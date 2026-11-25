import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import { hrReportsApi } from '../../api/hrReportsApi';
import {
  EMPTY_REPORT_CONFIG,
  type ReportChartType,
  type ReportConfiguration,
  type ReportDataset,
  type ReportDefinition,
  type ReportExecutionResult,
  type ReportFilterClause,
  type ReportFilterOperator,
  type ReportField,
  type ReportsFilters,
  type SaveReportRequest,
} from '../../models/hrReports';
import { apiErrorMessage } from '../../utils/employeeFormat';
import { normalizeReportConfig, parseJson, serializeReportConfig } from '../../utils/hrReportsFormat';
import { PanelSkeleton } from './ChartPanel';
import ReportResultView from './ReportResultView';

const CHART_TYPES: ReportChartType[] = ['table', 'bar', 'line', 'area', 'donut'];
const OPERATORS: ReportFilterOperator[] = ['eq', 'neq', 'contains', 'gt', 'gte', 'lt', 'lte'];
const CATEGORIES = ['Custom', 'Workforce', 'Retention', 'Onboarding', 'Offboarding', 'Organization', 'Compliance'];

const inputCls =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500';

type Props = {
  datasets: ReportDataset[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Capability check for dataset / field level `requiredPermission`. */
  hasPermission: (permission: string) => boolean;
  /** Report being edited (null → new report). */
  editing: ReportDefinition | null;
  canSave: boolean;
  filters: ReportsFilters;
  onSaved: (report: ReportDefinition, created: boolean) => void;
  onCancelEdit: () => void;
};

export default function ReportBuilder({ datasets, loading, error, onRetry, hasPermission, editing, canSave, filters, onSaved, onCancelEdit }: Props) {
  const { t } = useTranslation();

  const allowedDatasets = useMemo(
    () => datasets.filter((d) => !d.requiredPermission || hasPermission(d.requiredPermission)),
    [datasets, hasPermission],
  );

  const [datasetKey, setDatasetKey] = useState('');
  const [config, setConfig] = useState<ReportConfiguration>(EMPTY_REPORT_CONFIG);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [visibility, setVisibility] = useState('Private');
  const [fieldSearch, setFieldSearch] = useState('');

  const [result, setResult] = useState<ReportExecutionResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const previewId = useRef(0);

  // Load the report being edited (or reset for a fresh draft).
  const editingId = editing?.id ?? null;
  useEffect(() => {
    if (editing) {
      setDatasetKey(editing.datasetKey);
      setConfig(normalizeReportConfig(parseJson<Partial<ReportConfiguration>>(editing.configurationJson, {})));
      setName(editing.name);
      setDescription(editing.description ?? '');
      setCategory(editing.category || 'Custom');
      setVisibility(editing.visibility || 'Private');
    } else {
      setConfig(EMPTY_REPORT_CONFIG);
      setName('');
      setDescription('');
      setCategory('Custom');
      setVisibility('Private');
    }
    setResult(null);
    setPreviewError(null);
    setSaveError(null);
    setNameError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  // Default to the first allowed dataset.
  useEffect(() => {
    if (!datasetKey && allowedDatasets.length > 0 && !editing) setDatasetKey(allowedDatasets[0].key);
  }, [allowedDatasets, datasetKey, editing]);

  const dataset = allowedDatasets.find((d) => d.key === datasetKey) ?? datasets.find((d) => d.key === datasetKey) ?? null;
  const fields = useMemo<ReportField[]>(
    () => (dataset?.fields ?? []).filter((f) => !f.requiredPermission || hasPermission(f.requiredPermission)),
    [dataset, hasPermission],
  );
  const labels = useMemo(() => Object.fromEntries(fields.map((f) => [f.key, f.label])), [fields]);
  const visibleFields = fields.filter((f) => !fieldSearch.trim() || f.label.toLowerCase().includes(fieldSearch.trim().toLowerCase()));

  const toggle = (kind: 'dimensions' | 'measures', key: string) =>
    setConfig((c) => ({ ...c, [kind]: c[kind].includes(key) ? c[kind].filter((k) => k !== key) : [...c[kind], key] }));

  const selectDataset = (key: string) => {
    setDatasetKey(key);
    setConfig((c) => ({ ...EMPTY_REPORT_CONFIG, chartType: c.chartType }));
    setResult(null);
  };

  const serialized = useMemo(() => serializeReportConfig(config), [config]);

  const canPreview = !!datasetKey && config.dimensions.length + config.measures.length > 0;

  const runPreview = useCallback(async () => {
    if (!datasetKey) return;
    const id = ++previewId.current;
    setPreviewing(true);
    setPreviewError(null);
    try {
      const res = await hrReportsApi.preview({
        datasetKey,
        configurationJson: serialized,
        from: filters.from || undefined,
        to: filters.to || undefined,
        departmentId: filters.departmentId || undefined,
        limit: config.limit,
      });
      if (id === previewId.current) setResult(res);
    } catch (err) {
      if (id === previewId.current) setPreviewError(apiErrorMessage(err, t('coreHr.reports.builder.previewError')));
    } finally {
      if (id === previewId.current) setPreviewing(false);
    }
  }, [datasetKey, serialized, filters.from, filters.to, filters.departmentId, config.limit, t]);

  // Debounced auto-preview as the configuration changes.
  useEffect(() => {
    if (!canPreview) {
      setResult(null);
      return;
    }
    const id = window.setTimeout(() => void runPreview(), 500);
    return () => window.clearTimeout(id);
  }, [canPreview, runPreview]);

  const addFilter = () =>
    setConfig((c) => ({ ...c, filters: [...c.filters, { field: fields.find((f) => f.filterable)?.key ?? '', operator: 'eq', value: '' }] }));
  const patchFilter = (i: number, patch: Partial<ReportFilterClause>) =>
    setConfig((c) => ({ ...c, filters: c.filters.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) }));
  const removeFilter = (i: number) => setConfig((c) => ({ ...c, filters: c.filters.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!name.trim()) {
      setNameError(t('coreHr.reports.builder.nameRequired'));
      return;
    }
    if (!canPreview) {
      setSaveError(t('coreHr.reports.builder.fieldsRequired'));
      return;
    }
    setNameError(null);
    setSaveError(null);
    setSaving(true);
    const body: SaveReportRequest = {
      name: name.trim(),
      description: description.trim() || null,
      category,
      datasetKey,
      configurationJson: serialized,
      visualizationJson: JSON.stringify({ chartType: config.chartType }),
      visibility,
    };
    try {
      const saved = editing ? await hrReportsApi.updateReport(editing.id, body) : await hrReportsApi.createReport(body);
      onSaved(saved, !editing);
    } catch (err) {
      setSaveError(apiErrorMessage(err, t('coreHr.reports.builder.saveError')));
    } finally {
      setSaving(false);
    }
  };

  if (loading && datasets.length === 0) return <PanelSkeleton height={420} />;
  if (error) {
    return (
      <div className="space-y-3">
        <ErrorMessage message={error} />
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('coreHr.reports.actions.retry')}
        </Button>
      </div>
    );
  }
  if (allowedDatasets.length === 0) {
    return <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-sm text-gray-500">{t('coreHr.reports.builder.noDatasets')}</p>;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_300px]">
      {/* Datasets & fields */}
      <aside className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="builder-dataset">
          {t('coreHr.reports.builder.dataset')}
        </label>
        <select id="builder-dataset" value={datasetKey} onChange={(e) => selectDataset(e.target.value)} className={`${inputCls} mt-1`} disabled={!!editing}>
          {allowedDatasets.map((d) => (
            <option key={d.key} value={d.key}>
              {d.name}
            </option>
          ))}
        </select>
        {dataset?.description ? <p className="mt-2 text-xs text-gray-500">{dataset.description}</p> : null}

        <input
          type="search"
          value={fieldSearch}
          onChange={(e) => setFieldSearch(e.target.value)}
          placeholder={t('coreHr.reports.builder.searchFields')}
          aria-label={t('coreHr.reports.builder.searchFields')}
          className={`${inputCls} mt-4`}
        />
        <p className="mt-3 text-[11px] text-gray-400">{t('coreHr.reports.builder.fieldsHint')}</p>
        <ul className="mt-2 max-h-[420px] space-y-1 overflow-y-auto pr-1">
          {visibleFields.map((f) => {
            const isDim = config.dimensions.includes(f.key);
            const isMeas = config.measures.includes(f.key);
            return (
              <li key={f.key} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-dark-text">{f.label}</span>
                  <span className="block text-[10px] uppercase text-gray-400">{f.dataType}</span>
                </span>
                {f.isDimension ? (
                  <button
                    type="button"
                    onClick={() => toggle('dimensions', f.key)}
                    aria-pressed={isDim}
                    title={t('coreHr.reports.builder.asDimension')}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isDim ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
                  >
                    {t('coreHr.reports.builder.dimShort')}
                  </button>
                ) : null}
                {f.isMeasure ? (
                  <button
                    type="button"
                    onClick={() => toggle('measures', f.key)}
                    aria-pressed={isMeas}
                    title={t('coreHr.reports.builder.asMeasure')}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${isMeas ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}
                  >
                    {t('coreHr.reports.builder.measShort')}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Preview */}
      <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-dark-text">{t('coreHr.reports.builder.preview')}</h3>
          <Button variant="outline" size="sm" onClick={() => void runPreview()} disabled={!canPreview || previewing}>
            {previewing ? t('coreHr.reports.builder.running') : t('coreHr.reports.builder.refreshPreview')}
          </Button>
        </div>
        {previewError ? <ErrorMessage message={previewError} className="mb-3" /> : null}
        {!canPreview ? (
          <p className="rounded-xl border border-dashed border-gray-200 px-4 py-16 text-center text-sm text-gray-400">{t('coreHr.reports.builder.previewEmpty')}</p>
        ) : previewing && !result ? (
          <div aria-busy className="h-64 animate-pulse rounded-xl bg-gray-100" />
        ) : result ? (
          <div className={previewing ? 'opacity-60 transition-opacity' : ''}>
            <ReportResultView result={result} chartType={config.chartType} dimensions={config.dimensions} measures={config.measures} labels={labels} />
          </div>
        ) : null}
      </section>

      {/* Configuration */}
      <aside className="space-y-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div>
          <label htmlFor="builder-name" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('coreHr.reports.builder.name')}
          </label>
          <input id="builder-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={`${inputCls} mt-1 ${nameError ? 'border-red-300' : ''}`} />
          {nameError ? <p className="mt-1 text-xs text-red-600">{nameError}</p> : null}
        </div>
        <div>
          <label htmlFor="builder-desc" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            {t('coreHr.reports.builder.description')}
          </label>
          <textarea
            id="builder-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={400}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="builder-cat" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('coreHr.reports.builder.category')}
            </label>
            <select id="builder-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} mt-1`}>
              {Array.from(new Set([...CATEGORIES, category])).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="builder-vis" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t('coreHr.reports.builder.visibility')}
            </label>
            <select id="builder-vis" value={visibility} onChange={(e) => setVisibility(e.target.value)} className={`${inputCls} mt-1`}>
              <option value="Private">{t('coreHr.reports.builder.visibilityPrivate')}</option>
              <option value="Organization">{t('coreHr.reports.builder.visibilityOrganization')}</option>
            </select>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('coreHr.reports.builder.chartType')}</p>
          <div className="mt-1 flex flex-wrap gap-1.5" role="group">
            {CHART_TYPES.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={config.chartType === c}
                onClick={() => setConfig((cfg) => ({ ...cfg, chartType: c }))}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${config.chartType === c ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 text-gray-600 hover:border-violet-300'}`}
              >
                {t(`coreHr.reports.builder.chartTypes.${c}`)}
              </button>
            ))}
          </div>
        </div>

        {(['dimensions', 'measures'] as const).map((kind) => (
          <div key={kind}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t(`coreHr.reports.builder.${kind}`)}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {config[kind].length === 0 ? <span className="text-xs text-gray-400">{t('coreHr.reports.builder.none')}</span> : null}
              {config[kind].map((k) => (
                <span key={k} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${kind === 'dimensions' ? 'bg-violet-50 text-violet-700' : 'bg-teal-50 text-teal-700'}`}>
                  {labels[k] ?? k}
                  <button type="button" onClick={() => toggle(kind, k)} aria-label={t('coreHr.reports.builder.remove')} className="opacity-60 hover:opacity-100">
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}

        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('coreHr.reports.builder.filters')}</p>
            <button type="button" onClick={addFilter} className="text-xs font-medium text-violet-700 hover:underline" disabled={!fields.some((f) => f.filterable)}>
              {t('coreHr.reports.builder.addFilter')}
            </button>
          </div>
          <ul className="mt-2 space-y-2">
            {config.filters.map((f, i) => (
              <li key={i} className="space-y-1.5 rounded-lg border border-gray-100 bg-gray-50/60 p-2">
                <select aria-label={t('coreHr.reports.builder.filterField')} value={f.field} onChange={(e) => patchFilter(i, { field: e.target.value })} className={inputCls}>
                  {fields
                    .filter((x) => x.filterable)
                    .map((x) => (
                      <option key={x.key} value={x.key}>
                        {x.label}
                      </option>
                    ))}
                </select>
                <div className="flex gap-1.5">
                  <select
                    aria-label={t('coreHr.reports.builder.filterOperator')}
                    value={f.operator}
                    onChange={(e) => patchFilter(i, { operator: e.target.value as ReportFilterOperator })}
                    className={`${inputCls} w-28 shrink-0`}
                  >
                    {OPERATORS.map((o) => (
                      <option key={o} value={o}>
                        {t(`coreHr.reports.builder.operators.${o}`)}
                      </option>
                    ))}
                  </select>
                  <input aria-label={t('coreHr.reports.builder.filterValue')} value={f.value} onChange={(e) => patchFilter(i, { value: e.target.value })} className={inputCls} />
                  <button type="button" onClick={() => removeFilter(i)} aria-label={t('coreHr.reports.builder.remove')} className="px-1 text-gray-400 hover:text-red-600">
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {saveError ? <ErrorMessage message={saveError} /> : null}
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          {canSave ? (
            <Button size="sm" onClick={() => void save()} disabled={saving}>
              {saving ? t('common.actions.saving') : editing ? t('common.actions.saveChanges') : t('coreHr.reports.builder.save')}
            </Button>
          ) : (
            <p className="text-xs text-gray-400">{t('coreHr.reports.builder.noPermission')}</p>
          )}
          {editing ? (
            <Button variant="outline" size="sm" onClick={onCancelEdit} disabled={saving}>
              {t('common.actions.cancel')}
            </Button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

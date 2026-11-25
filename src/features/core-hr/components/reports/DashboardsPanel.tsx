import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
import { hrReportsApi } from '../../api/hrReportsApi';
import { useOrgResource } from '../../hooks/useOrgResource';
import {
  EMPTY_REPORT_CONFIG,
  type ReportConfiguration,
  type ReportDashboard,
  type ReportDashboardWidget,
  type ReportDefinition,
  type ReportExecutionResult,
  type SaveDashboardRequest,
} from '../../models/hrReports';
import { apiErrorMessage } from '../../utils/employeeFormat';
import { parseJson } from '../../utils/hrReportsFormat';
import { PanelSkeleton } from './ChartPanel';
import ReportResultView from './ReportResultView';

const GRID_COLUMNS = 12;
const inputCls =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500';

type Props = {
  reports: ReportDefinition[];
  canManage: boolean;
  onNotify: (tone: 'success' | 'error', text: string) => void;
};

type WidgetDraft = { key: string; reportDefinitionId: string; title: string; widgetType: string; gridW: number; gridH: number };

function WidgetView({ widget, report }: { widget: ReportDashboardWidget; report: ReportDefinition | undefined }) {
  const { t } = useTranslation();
  const [result, setResult] = useState<ReportExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reportId = widget.reportDefinitionId;

  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    setResult(null);
    setError(null);
    hrReportsApi
      .execute(reportId)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(apiErrorMessage(err, t('coreHr.reports.library.runError')));
      });
    return () => {
      cancelled = true;
    };
  }, [reportId, t]);

  const config: ReportConfiguration = report ? { ...EMPTY_REPORT_CONFIG, ...parseJson<Partial<ReportConfiguration>>(report.configurationJson, {}) } : EMPTY_REPORT_CONFIG;
  const viz = report ? parseJson<{ chartType?: ReportConfiguration['chartType'] }>(report.visualizationJson, {}) : {};
  const chartType = widget.widgetType.toLowerCase() === 'table' ? 'table' : (viz.chartType ?? config.chartType);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h4 className="mb-3 truncate text-sm font-semibold text-dark-text">{widget.title || report?.name || t('coreHr.reports.dashboards.untitledWidget')}</h4>
      <div className="min-h-0 flex-1 overflow-auto">
        {!reportId ? (
          <p className="text-xs text-gray-400">{t('coreHr.reports.dashboards.widgetNoReport')}</p>
        ) : error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : result ? (
          <ReportResultView result={result} chartType={chartType} dimensions={config.dimensions} measures={config.measures} compact />
        ) : (
          <div aria-busy className="h-24 animate-pulse rounded-lg bg-gray-100" />
        )}
      </div>
    </div>
  );
}

export default function DashboardsPanel({ reports, canManage, onNotify }: Props) {
  const { t } = useTranslation();
  const [reloadKey, setReloadKey] = useState(0);
  const list = useOrgResource(() => hrReportsApi.listDashboards(), true, reloadKey, t('coreHr.reports.dashboards.loadError'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ReportDashboard | null>(null);

  const [form, setForm] = useState<{ open: boolean; dashboard: ReportDashboard | null }>({ open: false, dashboard: null });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('Private');
  const [isDefault, setIsDefault] = useState(false);
  const [drafts, setDrafts] = useState<WidgetDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ReportDashboard | null>(null);
  const [deleting, setDeleting] = useState(false);

  const dashboards = useMemo(() => list.data ?? [], [list.data]);
  const reportById = useMemo(() => new Map(reports.map((r) => [r.id, r])), [reports]);

  // Keep a valid selection (default dashboard first).
  useEffect(() => {
    if (dashboards.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !dashboards.some((d) => d.id === selectedId)) {
      setSelectedId((dashboards.find((d) => d.isDefault) ?? dashboards[0]).id);
    }
  }, [dashboards, selectedId]);

  // The list may omit widgets; load the full dashboard when selected.
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    const fromList = dashboards.find((d) => d.id === selectedId) ?? null;
    setDetail(fromList);
    let cancelled = false;
    hrReportsApi
      .getDashboard(selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [selectedId, dashboards]);

  const openForm = useCallback((dashboard: ReportDashboard | null) => {
    setForm({ open: true, dashboard });
    setName(dashboard?.name ?? '');
    setDescription(dashboard?.description ?? '');
    setVisibility(dashboard?.visibility ?? 'Private');
    setIsDefault(dashboard?.isDefault ?? false);
    setDrafts(
      (dashboard?.widgets ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((w) => ({ key: w.id, reportDefinitionId: w.reportDefinitionId ?? '', title: w.title ?? '', widgetType: w.widgetType, gridW: w.gridW, gridH: w.gridH })),
    );
    setFormError(null);
  }, []);

  const save = async () => {
    if (!name.trim()) {
      setFormError(t('coreHr.reports.dashboards.nameRequired'));
      return;
    }
    // Flow layout: place widgets left-to-right, wrapping at the 12-column grid.
    let x = 0;
    let y = 0;
    let rowH = 0;
    const widgets = drafts.map((d, i) => {
      const w = Math.min(GRID_COLUMNS, Math.max(1, d.gridW));
      if (x + w > GRID_COLUMNS) {
        x = 0;
        y += rowH;
        rowH = 0;
      }
      const placed = { x, y };
      x += w;
      rowH = Math.max(rowH, d.gridH);
      const existing = form.dashboard?.widgets.find((ew) => ew.id === d.key);
      return {
        id: existing?.id ?? null,
        reportDefinitionId: d.reportDefinitionId || null,
        widgetType: d.widgetType,
        title: d.title.trim() || null,
        configurationJson: existing?.configurationJson ?? '{}',
        gridX: placed.x,
        gridY: placed.y,
        gridW: w,
        gridH: d.gridH,
        sortOrder: i,
      };
    });
    const body: SaveDashboardRequest = {
      name: name.trim(),
      description: description.trim() || null,
      visibility,
      isDefault,
      globalFiltersJson: form.dashboard?.globalFiltersJson ?? null,
      layoutJson: JSON.stringify({ columns: GRID_COLUMNS }),
      widgets,
    };
    setSaving(true);
    setFormError(null);
    try {
      const saved = await hrReportsApi.saveDashboard(body, form.dashboard?.id);
      setForm({ open: false, dashboard: null });
      setSelectedId(saved.id || null);
      setReloadKey((k) => k + 1);
      onNotify('success', t('coreHr.reports.dashboards.saved'));
    } catch (err) {
      setFormError(apiErrorMessage(err, t('coreHr.reports.dashboards.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await hrReportsApi.deleteDashboard(deleteTarget.id);
      setDeleteTarget(null);
      setReloadKey((k) => k + 1);
      onNotify('success', t('coreHr.reports.dashboards.deleted'));
    } catch (err) {
      onNotify('error', apiErrorMessage(err, t('coreHr.reports.dashboards.deleteError')));
    } finally {
      setDeleting(false);
    }
  };

  if (list.loading && !list.data) return <PanelSkeleton height={320} />;
  if (list.error) {
    return (
      <div className="space-y-3">
        <ErrorMessage message={list.error} />
        <Button variant="outline" size="sm" onClick={list.reload}>
          {t('coreHr.reports.actions.retry')}
        </Button>
      </div>
    );
  }

  const widgets = (detail?.widgets ?? []).slice().sort((a, b) => a.gridY - b.gridY || a.gridX - b.gridX || a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('coreHr.reports.tabs.dashboards')}>
          {dashboards.map((d) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={d.id === selectedId}
              onClick={() => setSelectedId(d.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${d.id === selectedId ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'}`}
            >
              {d.name}
              {d.isDefault ? <span className="ml-1.5 text-[10px] uppercase opacity-80">{t('coreHr.reports.dashboards.default')}</span> : null}
            </button>
          ))}
        </div>
        {canManage ? (
          <Button size="sm" onClick={() => openForm(null)}>
            {t('coreHr.reports.dashboards.create')}
          </Button>
        ) : null}
      </div>

      {dashboards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-sm text-gray-500">{t('coreHr.reports.dashboards.empty')}</p>
      ) : detail ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-dark-text">{detail.name}</h2>
              {detail.description ? <p className="text-sm text-gray-500">{detail.description}</p> : null}
            </div>
            {canManage ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openForm(detail)}>
                  {t('common.actions.edit')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDeleteTarget(detail)}>
                  {t('common.actions.delete')}
                </Button>
              </div>
            ) : null}
          </div>
          {widgets.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">{t('coreHr.reports.dashboards.noWidgets')}</p>
          ) : (
            <div className="space-y-4 md:grid md:grid-cols-12 md:gap-4 md:space-y-0" style={{ gridAutoRows: 'minmax(120px, auto)' }}>
              {widgets.map((w) => (
                <div
                  key={w.id}
                  style={{
                    gridColumn: `${Math.min(GRID_COLUMNS, w.gridX + 1)} / span ${Math.min(GRID_COLUMNS, Math.max(1, w.gridW))}`,
                    gridRow: `${w.gridY + 1} / span ${Math.max(1, w.gridH)}`,
                  }}
                >
                  <WidgetView widget={w} report={w.reportDefinitionId ? reportById.get(w.reportDefinitionId) : undefined} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <Modal
        isOpen={form.open}
        onClose={() => !saving && setForm({ open: false, dashboard: null })}
        title={form.dashboard ? t('coreHr.reports.dashboards.edit') : t('coreHr.reports.dashboards.create')}
        width="xl"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setForm({ open: false, dashboard: null })} disabled={saving}>
              {t('common.actions.cancel')}
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={saving}>
              {saving ? t('common.actions.saving') : t('common.actions.saveChanges')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError ? <ErrorMessage message={formError} /> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="dash-name" className="mb-1 block text-sm font-medium text-gray-700">
                {t('coreHr.reports.builder.name')}
              </label>
              <input id="dash-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="dash-desc" className="mb-1 block text-sm font-medium text-gray-700">
                {t('coreHr.reports.builder.description')}
              </label>
              <input id="dash-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={400} className={inputCls} />
            </div>
            <div>
              <label htmlFor="dash-vis" className="mb-1 block text-sm font-medium text-gray-700">
                {t('coreHr.reports.builder.visibility')}
              </label>
              <select id="dash-vis" value={visibility} onChange={(e) => setVisibility(e.target.value)} className={inputCls}>
                <option value="Private">{t('coreHr.reports.builder.visibilityPrivate')}</option>
                <option value="Organization">{t('coreHr.reports.builder.visibilityOrganization')}</option>
              </select>
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
              {t('coreHr.reports.dashboards.makeDefault')}
            </label>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-dark-text">{t('coreHr.reports.dashboards.widgets')}</h4>
              <button
                type="button"
                onClick={() => setDrafts((d) => [...d, { key: `new-${Date.now()}-${d.length}`, reportDefinitionId: '', title: '', widgetType: 'Chart', gridW: 6, gridH: 3 }])}
                className="text-sm font-medium text-violet-700 hover:underline"
              >
                {t('coreHr.reports.dashboards.addWidget')}
              </button>
            </div>
            <ul className="space-y-2">
              {drafts.map((d, i) => (
                <li key={d.key} className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3 sm:grid-cols-[1fr_1fr_90px_90px_auto]">
                  <select
                    aria-label={t('coreHr.reports.dashboards.widgetReport')}
                    value={d.reportDefinitionId}
                    onChange={(e) => setDrafts((list) => list.map((x, idx) => (idx === i ? { ...x, reportDefinitionId: e.target.value } : x)))}
                    className={inputCls}
                  >
                    <option value="">{t('coreHr.reports.dashboards.selectReport')}</option>
                    {reports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label={t('coreHr.reports.dashboards.widgetTitle')}
                    placeholder={t('coreHr.reports.dashboards.widgetTitle')}
                    value={d.title}
                    onChange={(e) => setDrafts((list) => list.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))}
                    className={inputCls}
                  />
                  <select
                    aria-label={t('coreHr.reports.dashboards.widgetWidth')}
                    value={d.gridW}
                    onChange={(e) => setDrafts((list) => list.map((x, idx) => (idx === i ? { ...x, gridW: Number(e.target.value) } : x)))}
                    className={inputCls}
                  >
                    {[3, 4, 6, 8, 12].map((w) => (
                      <option key={w} value={w}>
                        {t('coreHr.reports.dashboards.widthCols', { count: w })}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={t('coreHr.reports.dashboards.widgetHeight')}
                    value={d.gridH}
                    onChange={(e) => setDrafts((list) => list.map((x, idx) => (idx === i ? { ...x, gridH: Number(e.target.value) } : x)))}
                    className={inputCls}
                  >
                    {[2, 3, 4, 5].map((h) => (
                      <option key={h} value={h}>
                        {t('coreHr.reports.dashboards.heightRows', { count: h })}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setDrafts((list) => list.filter((_, idx) => idx !== i))} aria-label={t('coreHr.reports.builder.remove')} className="px-2 text-gray-400 hover:text-red-600">
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
        title={t('coreHr.reports.dashboards.deleteTitle')}
        description={t('coreHr.reports.dashboards.deleteDescription', { name: deleteTarget?.name ?? '' })}
        tone="danger"
        busy={deleting}
      />
    </div>
  );
}

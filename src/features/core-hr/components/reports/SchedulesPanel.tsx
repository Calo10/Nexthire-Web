import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import { hrReportsApi } from '../../api/hrReportsApi';
import { useOrgResource } from '../../hooks/useOrgResource';
import { SCHEDULE_FREQUENCIES, type ReportDefinition, type ReportExecution, type ReportSchedule } from '../../models/hrReports';
import { apiErrorMessage } from '../../utils/employeeFormat';
import { parseJson } from '../../utils/hrReportsFormat';
import { PanelSkeleton } from './ChartPanel';

const inputCls =
  'h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  reports: ReportDefinition[];
  canSchedule: boolean;
  canViewHistory: boolean;
  onNotify: (tone: 'success' | 'error', text: string) => void;
};

function recipientsOf(json: string): string[] {
  const v = parseJson<unknown>(json, []);
  return Array.isArray(v) ? v.map(String) : [];
}

function fmtDate(v: string | null, locale: string | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function SchedulesPanel({ reports, canSchedule, canViewHistory, onNotify }: Props) {
  const { t, i18n } = useTranslation();
  const [reloadKey, setReloadKey] = useState(0);
  const list = useOrgResource(() => hrReportsApi.listSchedules(), true, reloadKey, t('coreHr.reports.schedules.loadError'));
  const schedules = useMemo(() => list.data ?? [], [list.data]);

  const [form, setForm] = useState<{ open: boolean; schedule: ReportSchedule | null }>({ open: false, schedule: null });
  const [reportId, setReportId] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('Weekly');
  const [timezone, setTimezone] = useState('UTC');
  const [format, setFormat] = useState('Csv');
  const [recipients, setRecipients] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ schedule: ReportSchedule; items: ReportExecution[] | null; error: string | null } | null>(null);

  const openForm = (s: ReportSchedule | null) => {
    setForm({ open: true, schedule: s });
    setReportId(s?.reportDefinitionId ?? reports[0]?.id ?? '');
    setName(s?.name ?? '');
    setFrequency(s?.frequency ?? 'Weekly');
    setTimezone(s?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC');
    setFormat(s?.outputFormat ?? 'Csv');
    setRecipients(s ? recipientsOf(s.recipientsJson).join(', ') : '');
    setIsActive(s?.isActive ?? true);
    setFormError(null);
  };

  const save = async () => {
    const emails = recipients
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (!reportId) return setFormError(t('coreHr.reports.schedules.reportRequired'));
    if (!name.trim()) return setFormError(t('coreHr.reports.dashboards.nameRequired'));
    if (emails.length === 0 || emails.some((e) => !EMAIL_RE.test(e))) return setFormError(t('coreHr.reports.schedules.recipientsInvalid'));
    setSaving(true);
    setFormError(null);
    try {
      await hrReportsApi.saveSchedule({
        id: form.schedule?.id,
        reportDefinitionId: reportId,
        name: name.trim(),
        frequency,
        timezone,
        outputFormat: format,
        recipientsJson: JSON.stringify(emails),
        isActive,
      });
      setForm({ open: false, schedule: null });
      setReloadKey((k) => k + 1);
      onNotify('success', t('coreHr.reports.schedules.saved'));
    } catch (err) {
      setFormError(apiErrorMessage(err, t('coreHr.reports.schedules.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const act = async (s: ReportSchedule, action: 'pause' | 'resume' | 'run') => {
    setBusyId(s.id);
    try {
      if (action === 'pause') await hrReportsApi.pauseSchedule(s.id);
      else if (action === 'resume') await hrReportsApi.resumeSchedule(s.id);
      else await hrReportsApi.runSchedule(s.id);
      onNotify('success', t(`coreHr.reports.schedules.${action}Done`));
      setReloadKey((k) => k + 1);
    } catch (err) {
      onNotify('error', apiErrorMessage(err, t('coreHr.reports.schedules.actionError')));
    } finally {
      setBusyId(null);
    }
  };

  const openHistory = (s: ReportSchedule) => {
    setHistory({ schedule: s, items: null, error: null });
    hrReportsApi
      .scheduleHistory(s.id)
      .then((items) => setHistory((h) => (h && h.schedule.id === s.id ? { ...h, items } : h)))
      .catch((err: unknown) => setHistory((h) => (h && h.schedule.id === s.id ? { ...h, items: [], error: apiErrorMessage(err, t('coreHr.reports.schedules.historyError')) } : h)));
  };

  if (list.loading && !list.data) return <PanelSkeleton height={260} />;
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{t('coreHr.reports.schedules.subtitle')}</p>
        {canSchedule ? (
          <Button size="sm" onClick={() => openForm(null)} disabled={reports.length === 0}>
            {t('coreHr.reports.schedules.create')}
          </Button>
        ) : null}
      </div>

      {schedules.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-sm text-gray-500">{t('coreHr.reports.schedules.empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                {['name', 'report', 'frequency', 'nextRun', 'lastRun', 'status'].map((c) => (
                  <th key={c} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">
                    {t(`coreHr.reports.schedules.columns.${c}`)}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schedules.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-dark-text">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.reportName || reports.find((r) => r.id === s.reportDefinitionId)?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.frequency} · {s.outputFormat}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{s.isActive ? fmtDate(s.nextRunAt, i18n.language) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {fmtDate(s.lastRunAt, i18n.language)}
                    {s.lastStatus ? <span className="ml-1 text-xs text-gray-400">({s.lastStatus})</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {s.isActive ? t('coreHr.reports.schedules.active') : t('coreHr.reports.schedules.paused')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-gray-500">
                    <div className="flex justify-end gap-3">
                      {canSchedule ? (
                        <>
                          <button type="button" disabled={busyId === s.id} onClick={() => void act(s, 'run')} className="hover:text-violet-700 disabled:opacity-50">
                            {t('coreHr.reports.schedules.runNow')}
                          </button>
                          <button type="button" disabled={busyId === s.id} onClick={() => void act(s, s.isActive ? 'pause' : 'resume')} className="hover:text-violet-700 disabled:opacity-50">
                            {s.isActive ? t('coreHr.reports.schedules.pause') : t('coreHr.reports.schedules.resume')}
                          </button>
                          <button type="button" onClick={() => openForm(s)} className="hover:text-violet-700">
                            {t('common.actions.edit')}
                          </button>
                        </>
                      ) : null}
                      {canViewHistory ? (
                        <button type="button" onClick={() => openHistory(s)} className="hover:text-violet-700">
                          {t('coreHr.reports.schedules.history')}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={form.open}
        onClose={() => !saving && setForm({ open: false, schedule: null })}
        title={form.schedule ? t('coreHr.reports.schedules.edit') : t('coreHr.reports.schedules.create')}
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setForm({ open: false, schedule: null })} disabled={saving}>
              {t('common.actions.cancel')}
            </Button>
            <Button size="sm" onClick={() => void save()} disabled={saving}>
              {saving ? t('common.actions.saving') : t('common.actions.saveChanges')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {formError ? <ErrorMessage message={formError} /> : null}
          <div>
            <label htmlFor="sch-report" className="mb-1 block text-sm font-medium text-gray-700">
              {t('coreHr.reports.schedules.columns.report')}
            </label>
            <select id="sch-report" value={reportId} onChange={(e) => setReportId(e.target.value)} className={inputCls}>
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sch-name" className="mb-1 block text-sm font-medium text-gray-700">
              {t('coreHr.reports.builder.name')}
            </label>
            <input id="sch-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sch-freq" className="mb-1 block text-sm font-medium text-gray-700">
                {t('coreHr.reports.schedules.columns.frequency')}
              </label>
              <select id="sch-freq" value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls}>
                {SCHEDULE_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {t(`coreHr.reports.schedules.frequencies.${f}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sch-format" className="mb-1 block text-sm font-medium text-gray-700">
                {t('coreHr.reports.schedules.format')}
              </label>
              <select id="sch-format" value={format} onChange={(e) => setFormat(e.target.value)} className={inputCls}>
                <option value="Csv">CSV</option>
                <option value="Excel">Excel</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="sch-tz" className="mb-1 block text-sm font-medium text-gray-700">
              {t('coreHr.reports.schedules.timezone')}
            </label>
            <input id="sch-tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="sch-rcpt" className="mb-1 block text-sm font-medium text-gray-700">
              {t('coreHr.reports.schedules.recipients')}
            </label>
            <input id="sch-rcpt" value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="name@company.com, ..." className={inputCls} />
            <p className="mt-1 text-xs text-gray-400">{t('coreHr.reports.schedules.recipientsHint')}</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
            {t('coreHr.reports.schedules.active')}
          </label>
        </div>
      </Modal>

      <Modal
        isOpen={!!history}
        onClose={() => setHistory(null)}
        title={t('coreHr.reports.schedules.historyTitle', { name: history?.schedule.name ?? '' })}
        width="lg"
        footer={
          <div className="flex w-full justify-end">
            <Button variant="outline" size="sm" onClick={() => setHistory(null)}>
              {t('common.actions.close')}
            </Button>
          </div>
        }
      >
        {history?.error ? <ErrorMessage message={history.error} /> : null}
        {!history || history.items === null ? (
          <div aria-busy className="h-24 animate-pulse rounded-lg bg-gray-100" />
        ) : history.items.length === 0 && !history.error ? (
          <p className="py-6 text-center text-sm text-gray-400">{t('coreHr.reports.schedules.historyEmpty')}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.items.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-dark-text">{fmtDate(x.startedAt, i18n.language)}</p>
                  {x.errorMessage ? <p className="text-xs text-red-600">{x.errorMessage}</p> : null}
                </div>
                <div className="text-right text-xs text-gray-500">
                  <p className="font-semibold">{x.status}</p>
                  <p>
                    {x.rowCount != null ? t('coreHr.reports.states.rowCount', { count: x.rowCount }) : ''}
                    {x.durationMs != null ? ` · ${x.durationMs} ms` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import SelectField from '../SelectField';
import TextField from '../TextField';
import {
  getSourcingLeads,
  updateSourcingLeadStatus,
  convertSourcingLeadToCandidate,
} from '../../api/sourcingApi';
import type { SourcingLead } from '../../types/sourcing';
import type { Job } from '../../types/dashboard';
import { sourcingPlatformSelectLabels, SOURCING_PLATFORM_CODES } from '../../lib/sourcingPlatformCodes';
import LeadStatusPill from './LeadStatusPill';
import SourceTypeBrandLogo from './SourceTypeBrandLogo';
import { fitScoreTone, isSameLocalDay, leadDisplayName, leadId } from './sourcingUtils';

interface Props {
  shouldFetch: boolean;
  refreshKey: number;
  jobs: Job[];
  onOpenLead: (id: string | number) => void;
  onToastSuccess: (msg: string) => void;
  onToastError: (msg: string) => void;
  onRefreshDashboard: () => void;
}

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'converted', 'rejected', 'archived'] as const;
const FILTER_CONTROL_CLASS = 'h-12 min-h-12 max-h-12 box-border py-2.5';

function leadSourceCode(lead: SourcingLead): string {
  return String(lead.sourceTypeCode || lead.sourceType || '').trim();
}

function leadSourceLabel(code: string, t: (key: string) => string): string {
  const normalized = code.toLowerCase();
  if ((SOURCING_PLATFORM_CODES as readonly string[]).includes(normalized)) {
    return t(`sourcing.campaign.platforms.${normalized}`);
  }
  return code;
}

function formatDate(iso: string | null | undefined, locale: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function LeadsInbox({
  shouldFetch,
  refreshKey,
  jobs,
  onOpenLead,
  onToastSuccess,
  onToastError,
  onRefreshDashboard,
}: Props) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [sourceFilter, setSourceFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createdDateFilter, setCreatedDateFilter] = useState('');
  const [items, setItems] = useState<SourcingLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const jobTitleById = useMemo(() => {
    const m = new Map<string, string>();
    for (const j of jobs) m.set(String(j.id), j.title);
    return m;
  }, [jobs]);

  const jobOptions = useMemo(
    () => [{ value: '', label: t('sourcing.filters.allJobs') }, ...jobs.map((j) => ({ value: String(j.id), label: j.title }))],
    [jobs, t]
  );

  const sourceOptions = useMemo(
    () => [{ value: '', label: t('sourcing.filters.allSources') }, ...sourcingPlatformSelectLabels(t)],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('sourcing.inboxFilters.allStatuses') },
      ...LEAD_STATUSES.map((status) => ({
        value: status,
        label: t(`sourcing.leadStatuses.${status}`),
      })),
    ],
    [t]
  );

  useEffect(() => {
    setPage(1);
  }, [sourceFilter, jobFilter, statusFilter, createdDateFilter]);

  const load = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const useClientDateFilter = !!createdDateFilter;
      const res = await getSourcingLeads({
        page: useClientDateFilter ? 1 : page,
        pageSize: useClientDateFilter ? 500 : pageSize,
        status: statusFilter || undefined,
        jobId: jobFilter || undefined,
        sourceType: sourceFilter || undefined,
        from: createdDateFilter ? `${createdDateFilter}T00:00:00.000` : undefined,
        to: createdDateFilter ? `${createdDateFilter}T23:59:59.999` : undefined,
      });

      let filtered = res.items;
      if (createdDateFilter) {
        filtered = filtered.filter((lead) => isSameLocalDay(lead.createdAt, createdDateFilter));
      }

      const displayTotal = useClientDateFilter ? filtered.length : res.total;
      const displayItems = useClientDateFilter
        ? filtered.slice((page - 1) * pageSize, page * pageSize)
        : filtered;

      setItems(displayItems);
      setTotal(displayTotal);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.loadLeads');
      setError(msg);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, page, sourceFilter, jobFilter, statusFilter, createdDateFilter, t]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const run = async (lead: SourcingLead, action: 'contacted' | 'qualified' | 'convert' | 'reject') => {
    const id = lead.id;
    if (id == null) return;
    setPendingId(String(id));
    try {
      if (action === 'convert') {
        await convertSourcingLeadToCandidate(id);
        onToastSuccess(t('sourcing.toast.addedToPipeline'));
      } else if (action === 'contacted') {
        await updateSourcingLeadStatus(id, { status: 'contacted' });
        onToastSuccess(t('sourcing.toast.markedContacted'));
      } else if (action === 'qualified') {
        await updateSourcingLeadStatus(id, { status: 'qualified' });
        onToastSuccess(t('sourcing.toast.markedQualified'));
      } else {
        await updateSourcingLeadStatus(id, { status: 'rejected' });
        onToastSuccess(t('sourcing.toast.rejected'));
      }
      onRefreshDashboard();
      await load();
    } catch (e: unknown) {
      onToastError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.action'));
    } finally {
      setPendingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = !!(sourceFilter || jobFilter || statusFilter || createdDateFilter);
  const colSpan = 7;

  return (
    <div className="space-y-4">
      {error ? <ErrorMessage message={error} /> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 items-end">
        <SelectField
          label={t('sourcing.table.source')}
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          options={sourceOptions}
          className={FILTER_CONTROL_CLASS}
        />
        <SelectField
          label={t('sourcing.table.job')}
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          options={jobOptions}
          className={FILTER_CONTROL_CLASS}
        />
        <SelectField
          label={t('sourcing.table.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
          className={FILTER_CONTROL_CLASS}
        />
        <TextField
          label={t('sourcing.inboxFilters.createdDate')}
          type="date"
          value={createdDateFilter}
          onChange={(e) => setCreatedDateFilter(e.target.value)}
          className={FILTER_CONTROL_CLASS}
        />
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('sourcing.inboxFilters.actions')}</label>
          <button
            type="button"
            disabled={!hasFilters}
            onClick={() => {
              setSourceFilter('');
              setJobFilter('');
              setStatusFilter('');
              setCreatedDateFilter('');
            }}
            className={`${FILTER_CONTROL_CLASS} w-full px-4 border rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              hasFilters
                ? 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('sourcing.inboxFilters.clear')}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-purple-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-purple-50/80 text-left text-gray-600 border-b border-purple-100">
                <th className="px-4 py-3 font-semibold">{t('sourcing.table.name')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.table.source')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.table.job')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.table.status')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.table.fitScore')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.table.created')}</th>
                <th className="px-4 py-3 font-semibold text-right">{t('sourcing.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-12 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-16 text-center">
                    <p className="text-gray-600">{t('sourcing.empty.noLeadsTitle')}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('sourcing.empty.noLeadsSubtitle')}</p>
                  </td>
                </tr>
              ) : (
                items.map((lead) => {
                  const id = leadId(lead);
                  const busy = pendingId === id;
                  const jid = lead.jobId != null ? String(lead.jobId) : '';
                  const statusKey = String(lead.status || 'new').toLowerCase();
                  const sourceCode = leadSourceCode(lead);
                  const sourceLabel = sourceCode ? leadSourceLabel(sourceCode, t) : '';
                  return (
                    <tr key={id} className="border-b border-gray-100 hover:bg-purple-50/40">
                      <td className="px-4 py-3 font-medium text-dark-text">{leadDisplayName(lead)}</td>
                      <td className="px-4 py-3">
                        {sourceCode ? (
                          <div className="flex items-center" title={sourceLabel}>
                            <SourceTypeBrandLogo sourceTypeCode={sourceCode} displayName={sourceLabel} size="xs" />
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lead.jobTitle || jobTitleById.get(jid) || '—'}</td>
                      <td className="px-4 py-3">
                        <LeadStatusPill
                          status={lead.status}
                          label={
                            LEAD_STATUSES.includes(statusKey as (typeof LEAD_STATUSES)[number])
                              ? t(`sourcing.leadStatuses.${statusKey}`)
                              : undefined
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex min-w-[2.5rem] justify-center rounded-lg px-2 py-1 font-semibold ${fitScoreTone(lead.fitScore)}`}
                        >
                          {lead.fitScore != null ? Math.round(lead.fitScore) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(lead.createdAt, i18n.language)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex flex-wrap justify-end gap-1">
                          <Button variant="outline" size="sm" className="!py-1 !px-2" onClick={() => lead.id != null && onOpenLead(lead.id)} disabled={busy}>
                            {t('sourcing.actions.view')}
                          </Button>
                          <Button variant="outline" size="sm" className="!py-1 !px-2" onClick={() => run(lead, 'contacted')} disabled={busy}>
                            {t('sourcing.actions.contacted')}
                          </Button>
                          <Button variant="outline" size="sm" className="!py-1 !px-2" onClick={() => run(lead, 'qualified')} disabled={busy}>
                            {t('sourcing.actions.qualified')}
                          </Button>
                          <Button variant="secondary" size="sm" className="!py-1 !px-2" onClick={() => run(lead, 'convert')} disabled={busy}>
                            {t('sourcing.actions.convert')}
                          </Button>
                          <Button variant="outline" size="sm" className="!py-1 !px-2 text-red-600 border-red-200" onClick={() => run(lead, 'reject')} disabled={busy}>
                            {t('sourcing.actions.reject')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && items.length > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600">
            {t('sourcing.pagination.showing', { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total), total })}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              {t('sourcing.pagination.prev')}
            </Button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              {t('sourcing.pagination.next')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

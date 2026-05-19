import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import {
  getSourcingLeads,
  updateSourcingLeadStatus,
  convertSourcingLeadToCandidate,
} from '../../api/sourcingApi';
import type { SourcingLead } from '../../types/sourcing';
import type { Job } from '../../types/dashboard';
import LeadStatusPill from './LeadStatusPill';
import { fitScoreTone, leadDisplayName, leadId } from './sourcingUtils';

interface Props {
  shouldFetch: boolean;
  refreshKey: number;
  jobs: Job[];
  onOpenLead: (id: string | number) => void;
  onToastSuccess: (msg: string) => void;
  onToastError: (msg: string) => void;
  onRefreshDashboard: () => void;
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

  const load = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getSourcingLeads({ page, pageSize });
      setItems(res.items);
      setTotal(res.total);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.loadLeads');
      setError(msg);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, page, t]);

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

  return (
    <div className="space-y-4">
      {error ? <ErrorMessage message={error} /> : null}

      <div className="rounded-2xl border border-purple-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-purple-50/80 text-left text-gray-600 border-b border-purple-100">
                <th className="px-4 py-3 font-semibold">{t('sourcing.table.name')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.table.desiredRole')}</th>
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
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <p className="text-gray-600">{t('sourcing.empty.noLeadsTitle')}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('sourcing.empty.noLeadsSubtitle')}</p>
                  </td>
                </tr>
              ) : (
                items.map((lead) => {
                  const id = leadId(lead);
                  const busy = pendingId === id;
                  const jid = lead.jobId != null ? String(lead.jobId) : '';
                  return (
                    <tr key={id} className="border-b border-gray-100 hover:bg-purple-50/40">
                      <td className="px-4 py-3 font-medium text-dark-text">{leadDisplayName(lead)}</td>
                      <td className="px-4 py-3 text-gray-700">{lead.desiredRole || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{String(lead.sourceType || lead.sourceTypeCode || '—')}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.jobTitle || jobTitleById.get(jid) || '—'}</td>
                      <td className="px-4 py-3">
                        <LeadStatusPill status={lead.status} />
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

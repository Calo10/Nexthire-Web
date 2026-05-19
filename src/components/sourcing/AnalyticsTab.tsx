import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorMessage from '../ErrorMessage';
import { getSourcingLeads, getSourcingCampaigns } from '../../api/sourcingApi';
import type { SourcingDashboard, SourcingCampaign, SourcingLead } from '../../types/sourcing';
import { formatMoney, formatPercent } from './sourcingUtils';
import { asRecord } from '../../lib/normalizeApiResponse';

interface Props {
  shouldFetch: boolean;
  refreshKey: number;
  dashboard: SourcingDashboard | null;
  dashLoading: boolean;
  dashError: string | null;
}

function extractLeadsBySource(d: SourcingDashboard | null): { label: string; count: number }[] {
  if (!d?.leadsBySource) return [];
  const v = d.leadsBySource;
  if (typeof v === 'string') {
    try {
      const p = JSON.parse(v) as unknown;
      const r = asRecord(p);
      if (r) return Object.entries(r).map(([k, c]) => ({ label: k, count: Number(c) || 0 }));
    } catch {
      return [];
    }
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return Object.entries(v as Record<string, unknown>).map(([k, c]) => ({ label: k, count: Number(c) || 0 }));
  }
  return [];
}

function pickNum(d: SourcingDashboard | null, keys: string[]): number | null {
  if (!d) return null;
  for (const k of keys) {
    const v = d[k];
    if (v != null && typeof v !== 'object') {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export default function AnalyticsTab({ shouldFetch, refreshKey, dashboard, dashLoading, dashError }: Props) {
  const { t, i18n } = useTranslation();
  const [recent, setRecent] = useState<SourcingLead[]>([]);
  const [campaigns, setCampaigns] = useState<SourcingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, campRes] = await Promise.all([getSourcingLeads({ page: 1, pageSize: 8 }), getSourcingCampaigns()]);
      setRecent(leadsRes.items);
      setCampaigns(campRes.items);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.loadAnalytics');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, t]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const bySource = useMemo(() => extractLeadsBySource(dashboard), [dashboard]);
  const maxSource = useMemo(() => Math.max(1, ...bySource.map((x) => x.count)), [bySource]);

  const cost = pickNum(dashboard, ['costPerCandidate', 'avgCostPerCandidate']);
  const conv = pickNum(dashboard, ['conversionRate', 'conversionRatePercent']);

  const formatDt = (iso: string | null | undefined) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {dashError ? <ErrorMessage message={dashError} /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-dark-text mb-4">{t('sourcing.analytics.leadsBySource')}</h3>
          {dashLoading ? (
            <div className="h-32 animate-pulse bg-purple-50 rounded-xl" />
          ) : bySource.length === 0 ? (
            <p className="text-sm text-gray-500">{t('sourcing.analytics.noSourceData')}</p>
          ) : (
            <ul className="space-y-3">
              {bySource.map((row) => (
                <li key={row.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{row.label}</span>
                    <span className="font-semibold tabular-nums">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-purple-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all"
                      style={{ width: `${Math.round((row.count / maxSource) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-dark-text mb-4">{t('sourcing.analytics.kpis')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl bg-purple-50/80 border border-purple-100 p-4">
              <p className="text-xs text-gray-600 uppercase tracking-wide">{t('sourcing.dashboard.costPerCandidate')}</p>
              <p className="text-2xl font-bold text-dark-text mt-1">{cost != null ? formatMoney(cost) : '—'}</p>
            </div>
            <div className="rounded-xl bg-purple-50/80 border border-purple-100 p-4">
              <p className="text-xs text-gray-600 uppercase tracking-wide">{t('sourcing.dashboard.conversionRate')}</p>
              <p className="text-2xl font-bold text-dark-text mt-1">{conv != null ? formatPercent(conv) : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-dark-text mb-4">{t('sourcing.analytics.recentLeads')}</h3>
        {loading ? (
          <div className="h-24 animate-pulse bg-gray-100 rounded-xl" />
        ) : recent.length === 0 ? (
          <p className="text-sm text-gray-500">{t('sourcing.empty.noLeadsTitle')}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((l) => (
              <li key={String(l.id)} className="py-3 flex justify-between gap-4 text-sm">
                <span className="font-medium text-dark-text truncate">
                  {l.fullName || [l.firstName, l.lastName].filter(Boolean).join(' ') || '—'}
                </span>
                <span className="text-gray-500 whitespace-nowrap">{formatDt(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-purple-100 bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-purple-100">
          <h3 className="text-lg font-semibold text-dark-text">{t('sourcing.analytics.campaignPerformance')}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-purple-50/80 text-left text-gray-600">
                <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.name')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.table.status')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.leads')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.dailyBudget')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && campaigns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    {t('sourcing.empty.noCampaignsTitle')}
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={String(c.id)} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{c.name || '—'}</td>
                    <td className="px-4 py-3">{c.status || '—'}</td>
                    <td className="px-4 py-3">{c.leadsCount ?? c.leads ?? '—'}</td>
                    <td className="px-4 py-3 tabular-nums">{c.dailyBudget != null ? formatMoney(Number(c.dailyBudget)) : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

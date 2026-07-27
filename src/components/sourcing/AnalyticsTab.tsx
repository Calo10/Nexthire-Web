import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorMessage from '../ErrorMessage';
import Button from '../Button';
import { getSourcingCampaigns } from '../../api/sourcingApi';
import { listMetaCampaignInsights, metaCampaignInsightsRef } from '../../api/metaCampaignApi';
import type { SourcingCampaign } from '../../types/sourcing';
import type { MetaCampaignInsights } from '../../types/metaCampaign';
import { formatMoney, computeCostPerCandidate } from './sourcingUtils';
import CampaignInsightsModal from './CampaignInsightsModal';
import AnalyticsHistoryModal from './AnalyticsHistoryModal';
import CampaignInsightsMetricsView, {
  consolidateCampaignInsights,
} from './CampaignInsightsMetricsView';
import SourceTypeBrandLogo from './SourceTypeBrandLogo';
import { normalizeSourcingPlatformCode } from '../../lib/sourcingPlatformCodes';

interface Props {
  shouldFetch: boolean;
  refreshKey: number;
  metaAdsReady?: boolean;
}

function formatCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(undefined).format(n);
}

function isMetaAdsCampaign(c: SourcingCampaign): boolean {
  const platform = (c.platform || '').toLowerCase();
  return platform === 'meta_ads' || platform === 'meta' || Boolean(c.externalCampaignId);
}

function campaignLeads(c: SourcingCampaign, metrics: MetaCampaignInsights | null): number | null {
  if (c.leadsCount != null || c.leads != null) {
    const n = Number(c.leadsCount ?? c.leads);
    return Number.isFinite(n) ? n : null;
  }
  if (metrics?.metaLeads != null && Number.isFinite(Number(metrics.metaLeads))) {
    return Number(metrics.metaLeads);
  }
  return null;
}

export default function AnalyticsTab({ shouldFetch, refreshKey, metaAdsReady = false }: Props) {
  const { t } = useTranslation();
  const [campaigns, setCampaigns] = useState<SourcingCampaign[]>([]);
  const [insightsByKey, setInsightsByKey] = useState<Record<string, MetaCampaignInsights>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightsTarget, setInsightsTarget] = useState<{
    ref: string | number;
    name?: string | null;
    leadsCount?: number | null;
  } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const load = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const campRes = await getSourcingCampaigns({ page: 1, pageSize: 200 });
      setCampaigns(campRes.items);

      if (metaAdsReady) {
        try {
          const insights = await listMetaCampaignInsights('maximum');
          const map: Record<string, MetaCampaignInsights> = {};
          for (const row of insights.items) {
            if (row.localRecordId) map[row.localRecordId] = row;
            if (row.metaCampaignId) map[row.metaCampaignId] = row;
          }
          setInsightsByKey(map);
        } catch {
          setInsightsByKey({});
        }
      } else {
        setInsightsByKey({});
      }
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : t('sourcing.errors.loadAnalytics');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, metaAdsReady, t]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const insightFor = (c: SourcingCampaign) => {
    const id = c.id != null ? String(c.id) : '';
    if (id && insightsByKey[id]) return insightsByKey[id];
    if (c.externalCampaignId && insightsByKey[String(c.externalCampaignId)]) {
      return insightsByKey[String(c.externalCampaignId)];
    }
    return null;
  };

  const consolidated = useMemo(() => {
    const seen = new Set<string>();
    const rows: MetaCampaignInsights[] = [];
    let leadsTotal = 0;
    let hasLeads = false;

    for (const c of campaigns) {
      const metrics = insightFor(c);
      if (metrics) {
        const key = metrics.metaCampaignId || metrics.localRecordId || String(c.id);
        if (key && !seen.has(key)) {
          seen.add(key);
          rows.push(metrics);
        }
      }
      const leads = campaignLeads(c, metrics);
      if (leads != null && leads > 0) {
        leadsTotal += leads;
        hasLeads = true;
      }
    }

    return consolidateCampaignInsights(rows, hasLeads ? leadsTotal : null);
  }, [campaigns, insightsByKey]);

  return (
    <div className="space-y-6">
      {error ? <ErrorMessage message={error} /> : null}

      <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-dark-text">{t('sourcing.analytics.consolidatedTitle')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('sourcing.analytics.consolidatedSubtitle')}</p>
          </div>
          {metaAdsReady ? (
            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setHistoryOpen(true)}>
              {t('sourcing.analytics.history')}
            </Button>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-52 rounded-2xl bg-purple-50 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-purple-50 animate-pulse" />
              ))}
            </div>
          </div>
        ) : !metaAdsReady ? (
          <p className="text-sm text-gray-600">{t('sourcing.metaAds.configureRequired')}</p>
        ) : (
          <CampaignInsightsMetricsView
            insights={consolidated}
            costPerCandidate={consolidated.costPerCandidate}
            leadsCount={consolidated.leadsCount}
            gradientIdPrefix="analytics"
          />
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
                <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.spend')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.impressions')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.reach')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.linkClicks')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.costPerClick')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.leads')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.dashboard.costPerCandidate')}</th>
                <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.dailyBudget')}</th>
                <th className="px-4 py-3 font-semibold text-right">{t('sourcing.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading && campaigns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    {t('sourcing.empty.noCampaignsTitle')}
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => {
                  const metrics = insightFor(c);
                  const ref = metaCampaignInsightsRef(c);
                  const isMeta = isMetaAdsCampaign(c);
                  const leadsNum = campaignLeads(c, metrics);
                  const costPerCandidate = computeCostPerCandidate(metrics?.spend, leadsNum);
                  const platformCode = normalizeSourcingPlatformCode(String(c.platform || '')) || (isMeta ? 'meta_ads' : '');
                  return (
                    <tr key={String(c.id)} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {platformCode ? (
                            <SourceTypeBrandLogo
                              sourceTypeCode={platformCode}
                              displayName={String(c.platform || platformCode)}
                              size="xs"
                            />
                          ) : null}
                          <span className="truncate">{c.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{c.status || '—'}</td>
                      <td className="px-4 py-3 tabular-nums">{formatMoney(metrics?.spend)}</td>
                      <td className="px-4 py-3 tabular-nums">{formatCount(metrics?.impressions)}</td>
                      <td className="px-4 py-3 tabular-nums">{formatCount(metrics?.reach)}</td>
                      <td className="px-4 py-3 tabular-nums">{formatCount(metrics?.inlineLinkClicks)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {formatMoney(metrics?.costPerInlineLinkClick ?? metrics?.cpc)}
                      </td>
                      <td className="px-4 py-3">
                        {leadsNum != null ? formatCount(leadsNum) : '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatMoney(costPerCandidate)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {c.dailyBudget != null ? formatMoney(Number(c.dailyBudget)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isMeta && ref ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="!py-1 !px-2"
                            onClick={() =>
                              setInsightsTarget({ ref, name: c.name, leadsCount: leadsNum })
                            }
                          >
                            {t('sourcing.campaign.insights.details')}
                          </Button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CampaignInsightsModal
        isOpen={insightsTarget != null}
        onClose={() => setInsightsTarget(null)}
        campaignRef={insightsTarget?.ref ?? null}
        campaignName={insightsTarget?.name}
        leadsCount={insightsTarget?.leadsCount}
      />
      <AnalyticsHistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}

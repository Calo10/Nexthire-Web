import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import { getMetaInsightsHistory, metaErrorMessageFromUnknown } from '../../api/metaCampaignApi';
import type { MetaInsightsHistory, MetaInsightsSnapshotMetrics } from '../../types/metaCampaign';
import { formatMoney } from './sourcingUtils';
import SourceTypeBrandLogo from './SourceTypeBrandLogo';
import { normalizeSourcingPlatformCode } from '../../lib/sourcingPlatformCodes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function formatCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(undefined).format(n);
}

function formatDelta(n: number | null | undefined, money = false): string {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n > 0 ? '+' : '';
  if (money) return `${sign}${formatMoney(n)}`;
  return `${sign}${formatCount(n)}`;
}

function MetricCell({
  weekA,
  weekB,
  delta,
  pick,
  money,
  labelA,
  labelB,
  labelDelta,
}: {
  weekA?: MetaInsightsSnapshotMetrics | null;
  weekB?: MetaInsightsSnapshotMetrics | null;
  delta?: MetaInsightsSnapshotMetrics | null;
  pick: (m: MetaInsightsSnapshotMetrics | null | undefined) => number | null | undefined;
  money?: boolean;
  labelA: string;
  labelB: string;
  labelDelta: string;
}) {
  const a = pick(weekA);
  const b = pick(weekB);
  const d = pick(delta);
  const deltaClass =
    d != null && d > 0 ? 'text-emerald-700' : d != null && d < 0 ? 'text-rose-700' : 'text-gray-500';

  return (
    <div className="space-y-1 min-w-[7rem]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 shrink-0">{labelA}</span>
        <span className="text-sm text-gray-900 tabular-nums text-right">{money ? formatMoney(a) : formatCount(a)}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 shrink-0">{labelB}</span>
        <span className="text-sm text-gray-600 tabular-nums text-right">{money ? formatMoney(b) : formatCount(b)}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2 border-t border-gray-100 pt-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 shrink-0">{labelDelta}</span>
        <span className={`text-sm font-medium tabular-nums text-right ${deltaClass}`}>{formatDelta(d, money)}</span>
      </div>
    </div>
  );
}

export default function AnalyticsHistoryModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetaInsightsHistory | null>(null);
  const [weekA, setWeekA] = useState('');
  const [weekB, setWeekB] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setError(null);
      setWeekA('');
      setWeekB('');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const history = await getMetaInsightsHistory();
        if (cancelled) return;
        setData(history);
        setWeekA(history.weekA || '');
        setWeekB(history.weekB || '');
      } catch (e: unknown) {
        if (!cancelled) {
          setError(metaErrorMessageFromUnknown(e) ?? t('sourcing.analytics.historyLoadError'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, t]);

  const reloadCompare = async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await getMetaInsightsHistory({
        weekA: weekA || undefined,
        weekB: weekB || undefined,
      });
      setData(history);
      setWeekA(history.weekA || weekA);
      setWeekB(history.weekB || weekB);
    } catch (e: unknown) {
      setError(metaErrorMessageFromUnknown(e) ?? t('sourcing.analytics.historyLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const weeks = data?.weeks ?? [];
  const hasWeeks = weeks.length > 0;
  const sameWeek = Boolean(weekA && weekB && weekA === weekB);
  const labelA = t('sourcing.analytics.historyLabelA');
  const labelB = t('sourcing.analytics.historyLabelB');
  const labelDelta = t('sourcing.analytics.historyLabelDelta');
  const metricProps = { labelA, labelB, labelDelta };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sourcing.analytics.historyTitle')}
      subtitle={t('sourcing.analytics.historySubtitle')}
      width="xl"
      footer={
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.actions.close')}
        </Button>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}

        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('sourcing.analytics.historyWeekA')}</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              value={weekA}
              disabled={!hasWeeks || loading}
              onChange={(e) => setWeekA(e.target.value)}
            >
              {!hasWeeks ? <option value="">{t('sourcing.analytics.historyNoWeeks')}</option> : null}
              {weeks.map((w) => (
                <option key={`a-${w}`} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('sourcing.analytics.historyWeekB')}</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              value={weekB}
              disabled={!hasWeeks || loading}
              onChange={(e) => setWeekB(e.target.value)}
            >
              {!hasWeeks ? <option value="">{t('sourcing.analytics.historyNoWeeks')}</option> : null}
              {weeks.map((w) => (
                <option key={`b-${w}`} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!hasWeeks || loading || !weekA || !weekB}
            onClick={() => void reloadCompare()}
          >
            {t('sourcing.analytics.historyCompare')}
          </Button>
        </div>

        <p className="text-xs text-gray-500">{t('sourcing.analytics.historyHint')}</p>

        {sameWeek ? (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {t('sourcing.analytics.historySameWeekWarning')}
          </p>
        ) : null}

        {hasWeeks && weekA && weekB ? (
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 text-violet-700 px-2.5 py-1 font-medium">
              <span className="uppercase tracking-wide">{labelA}</span>
              <span className="font-mono text-violet-900">{weekA}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 px-2.5 py-1 font-medium">
              <span className="uppercase tracking-wide">{labelB}</span>
              <span className="font-mono text-slate-800">{weekB}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 text-gray-600 px-2.5 py-1 font-medium">
              <span className="uppercase tracking-wide">{labelDelta}</span>
              <span>{t('sourcing.analytics.historyDeltaMeaning')}</span>
            </span>
          </div>
        ) : null}

        {loading && !data ? (
          <div className="h-40 rounded-xl bg-gray-100 animate-pulse" />
        ) : !hasWeeks ? (
          <p className="text-sm text-gray-600 py-6 text-center">{t('sourcing.analytics.historyEmpty')}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="px-3 py-2.5 font-semibold">{t('sourcing.campaign.table.name')}</th>
                  <th className="px-3 py-2.5 font-semibold">{t('sourcing.campaign.table.spend')}</th>
                  <th className="px-3 py-2.5 font-semibold">{t('sourcing.campaign.table.leads')}</th>
                  <th className="px-3 py-2.5 font-semibold">{t('sourcing.dashboard.costPerCandidate')}</th>
                  <th className="px-3 py-2.5 font-semibold">{t('sourcing.campaign.table.impressions')}</th>
                  <th className="px-3 py-2.5 font-semibold">{t('sourcing.campaign.table.linkClicks')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.totalsWeekA || data?.totalsWeekB ? (
                  <tr className="bg-purple-50/60 border-b border-purple-100">
                    <td className="px-3 py-3 font-semibold text-gray-900">{t('sourcing.analytics.historyTotals')}</td>
                    <td className="px-3 py-3">
                      <MetricCell {...metricProps} weekA={data.totalsWeekA} weekB={data.totalsWeekB} delta={data.totalsDelta} pick={(m) => m?.spend} money />
                    </td>
                    <td className="px-3 py-3">
                      <MetricCell
                        {...metricProps}
                        weekA={data.totalsWeekA}
                        weekB={data.totalsWeekB}
                        delta={data.totalsDelta}
                        pick={(m) => m?.nexthireLeadsCount}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <MetricCell
                        {...metricProps}
                        weekA={data.totalsWeekA}
                        weekB={data.totalsWeekB}
                        delta={data.totalsDelta}
                        pick={(m) => m?.costPerCandidate}
                        money
                      />
                    </td>
                    <td className="px-3 py-3">
                      <MetricCell
                        {...metricProps}
                        weekA={data.totalsWeekA}
                        weekB={data.totalsWeekB}
                        delta={data.totalsDelta}
                        pick={(m) => m?.impressions}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <MetricCell
                        {...metricProps}
                        weekA={data.totalsWeekA}
                        weekB={data.totalsWeekB}
                        delta={data.totalsDelta}
                        pick={(m) => m?.inlineLinkClicks ?? m?.clicks}
                      />
                    </td>
                  </tr>
                ) : null}
                {(data?.campaigns ?? []).map((c) => (
                  <tr key={c.metaCampaignId} className="border-b border-gray-100 align-top">
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2.5">
                        <SourceTypeBrandLogo
                          sourceTypeCode={normalizeSourcingPlatformCode(c.platform) || 'meta_ads'}
                          displayName={c.campaignName || c.platform || 'Meta'}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{c.campaignName || c.metaCampaignId}</p>
                          <p className="text-[11px] font-mono text-gray-400 break-all">{c.metaCampaignId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <MetricCell {...metricProps} weekA={c.weekA} weekB={c.weekB} delta={c.delta} pick={(m) => m?.spend} money />
                    </td>
                    <td className="px-3 py-3">
                      <MetricCell {...metricProps} weekA={c.weekA} weekB={c.weekB} delta={c.delta} pick={(m) => m?.nexthireLeadsCount} />
                    </td>
                    <td className="px-3 py-3">
                      <MetricCell {...metricProps} weekA={c.weekA} weekB={c.weekB} delta={c.delta} pick={(m) => m?.costPerCandidate} money />
                    </td>
                    <td className="px-3 py-3">
                      <MetricCell {...metricProps} weekA={c.weekA} weekB={c.weekB} delta={c.delta} pick={(m) => m?.impressions} />
                    </td>
                    <td className="px-3 py-3">
                      <MetricCell {...metricProps} weekA={c.weekA} weekB={c.weekB} delta={c.delta} pick={(m) => m?.inlineLinkClicks ?? m?.clicks} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

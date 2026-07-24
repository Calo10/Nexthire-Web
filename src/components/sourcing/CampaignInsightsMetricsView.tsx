import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MetaCampaignInsights, MetaInsightAction } from '../../types/metaCampaign';
import { formatMoney, computeCostPerCandidate } from './sourcingUtils';

export type InsightsMetricsInput = Pick<
  MetaCampaignInsights,
  | 'spend'
  | 'impressions'
  | 'reach'
  | 'clicks'
  | 'inlineLinkClicks'
  | 'costPerInlineLinkClick'
  | 'ctr'
  | 'cpc'
  | 'cpm'
  | 'frequency'
  | 'metaLeads'
  | 'costPerLead'
  | 'actions'
  | 'costPerActionType'
  | 'empty'
  | 'dateStart'
  | 'dateStop'
>;

type ChartBar = {
  key: string;
  label: string;
  value: number;
  color: string;
};

function formatCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(undefined).format(n);
}

function formatCtr(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(2)}%`;
}

function MetricCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-xl border border-purple-100 bg-white p-4 shadow-sm relative"
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
        <div
          className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-15"
          style={{ backgroundColor: accent }}
        />
      </div>

      {hint ? (
        <span className="absolute top-2.5 right-2.5 z-20 group/hint">
          <button
            type="button"
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/70 text-[10px] font-semibold leading-none text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            style={{ backgroundColor: accent }}
            aria-label={hint}
          >
            i
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute right-0 bottom-full z-30 mb-2 w-52 rounded-lg border border-gray-700 bg-gray-900 px-2.5 py-2 text-[11px] normal-case tracking-normal font-normal leading-relaxed text-white shadow-lg opacity-0 invisible transition-opacity duration-150 group-hover/hint:opacity-100 group-hover/hint:visible group-focus-within/hint:opacity-100 group-focus-within/hint:visible"
          >
            {hint}
            <span
              aria-hidden
              className="absolute right-3 top-full border-4 border-transparent border-t-gray-900"
            />
          </span>
        </span>
      ) : null}

      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1 relative z-10 pr-7">{label}</p>
      <p className="text-xl font-semibold text-dark-text tabular-nums relative z-10">{value}</p>
    </div>
  );
}

function PerformanceBarChart({ bars, title, gradientIdPrefix }: { bars: ChartBar[]; title: string; gradientIdPrefix: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const chartHeight = 180;
  const chartWidth = 560;
  const paddingLeft = 44;
  const paddingRight = 16;
  const paddingTop = 24;
  const availableWidth = chartWidth - paddingLeft - paddingRight;
  const barSpacing = availableWidth / bars.length;
  const barWidth = Math.min(56, barSpacing * 0.62);

  if (!bars.some((b) => b.value > 0)) return null;

  return (
    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white via-purple-50/40 to-sky-50/50 p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-dark-text mb-3">{title}</h4>
      <svg
        width="100%"
        height={chartHeight + 56}
        viewBox={`0 0 ${chartWidth} ${chartHeight + 56}`}
        className="overflow-visible"
        role="img"
        aria-label={title}
      >
        <defs>
          {bars.map((bar) => (
            <linearGradient
              key={`grad-${gradientIdPrefix}-${bar.key}`}
              id={`grad-${gradientIdPrefix}-${bar.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={bar.color} stopOpacity="1" />
              <stop offset="100%" stopColor={bar.color} stopOpacity="0.65" />
            </linearGradient>
          ))}
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + chartHeight - chartHeight * ratio;
          return (
            <g key={`grid-${ratio}`}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#E9D5FF"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="#6B7280" fontSize="10">
                {Math.round(max * ratio)}
              </text>
            </g>
          );
        })}

        {bars.map((bar, index) => {
          const height = (bar.value / max) * chartHeight;
          const x = paddingLeft + index * barSpacing + (barSpacing - barWidth) / 2;
          const y = paddingTop + chartHeight - height;
          return (
            <g key={bar.key}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(height, 2)}
                rx="8"
                fill={`url(#grad-${gradientIdPrefix}-${bar.key})`}
              />
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fill="#1F2937"
                fontSize="11"
                fontWeight="600"
              >
                {formatCount(bar.value)}
              </text>
              <text
                x={x + barWidth / 2}
                y={paddingTop + chartHeight + 18}
                textAnchor="middle"
                fill="#4B5563"
                fontSize="11"
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function FunnelStrip({
  title,
  steps,
}: {
  title: string;
  steps: { label: string; value: number; color: string }[];
}) {
  const positive = steps.filter((s) => s.value > 0);
  if (positive.length < 2) return null;
  const top = positive[0].value || 1;

  return (
    <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
      <h4 className="text-sm font-semibold text-dark-text mb-3">{title}</h4>
      <div className="space-y-2.5">
        {positive.map((step) => {
          const width = Math.max(12, Math.round((step.value / top) * 100));
          return (
            <div key={step.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-700">{step.label}</span>
                <span className="tabular-nums text-gray-600">{formatCount(step.value)}</span>
              </div>
              <div className="h-3 rounded-full bg-purple-50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${step.color}, ${step.color}cc)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionsTable({
  title,
  rows,
  money,
}: {
  title: string;
  rows: MetaInsightAction[];
  money?: boolean;
}) {
  if (!rows.length) return null;
  return (
    <div className="rounded-xl border border-purple-100 overflow-hidden">
      <div className="px-4 py-3 bg-purple-50/80 border-b border-purple-100">
        <h4 className="text-sm font-semibold text-dark-text">{title}</h4>
      </div>
      <div className="max-h-56 overflow-y-auto">
        <table className="min-w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.actionType} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2 text-gray-700">{row.actionType}</td>
                <td className="px-4 py-2 text-right tabular-nums font-medium text-dark-text">
                  {money ? formatMoney(row.value) : formatCount(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function sumNum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((sum, v) => {
    const n = v != null ? Number(v) : 0;
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function mergeActions(rows: MetaInsightAction[][]): MetaInsightAction[] {
  const map = new Map<string, number>();
  for (const list of rows) {
    for (const row of list) {
      map.set(row.actionType, (map.get(row.actionType) || 0) + (Number(row.value) || 0));
    }
  }
  return [...map.entries()]
    .map(([actionType, value]) => ({ actionType, value }))
    .sort((a, b) => b.value - a.value);
}

/** Aggregate Meta insights across campaigns (sums + derived averages). */
export function consolidateCampaignInsights(
  rows: MetaCampaignInsights[],
  nexthireLeads: number | null
): InsightsMetricsInput & { costPerCandidate: number | null; leadsCount: number | null } {
  const active = rows.filter((r) => r && !r.empty);
  if (!active.length) {
    return {
      empty: true,
      actions: [],
      costPerActionType: [],
      costPerCandidate: null,
      leadsCount: nexthireLeads,
    };
  }

  const spend = sumNum(active.map((r) => r.spend));
  const impressions = sumNum(active.map((r) => r.impressions));
  const reach = sumNum(active.map((r) => r.reach));
  const clicks = sumNum(active.map((r) => r.clicks));
  const inlineLinkClicks = sumNum(active.map((r) => r.inlineLinkClicks));
  const metaLeads = sumNum(active.map((r) => r.metaLeads));

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
  const cpc = clicks > 0 ? spend / clicks : null;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : null;
  const costPerInlineLinkClick = inlineLinkClicks > 0 ? spend / inlineLinkClicks : null;
  const frequency = reach > 0 ? impressions / reach : null;
  const costPerLead = metaLeads > 0 ? spend / metaLeads : null;
  const costPerCandidate = computeCostPerCandidate(spend, nexthireLeads);

  const dateStarts = active.map((r) => r.dateStart).filter(Boolean) as string[];
  const dateStops = active.map((r) => r.dateStop).filter(Boolean) as string[];
  const sortedStarts = [...dateStarts].sort();
  const sortedStops = [...dateStops].sort();

  return {
    empty: false,
    spend,
    impressions,
    reach,
    clicks,
    inlineLinkClicks,
    costPerInlineLinkClick,
    ctr,
    cpc,
    cpm,
    frequency,
    metaLeads: metaLeads > 0 ? metaLeads : null,
    costPerLead,
    actions: mergeActions(active.map((r) => r.actions || [])),
    costPerActionType: mergeActions(active.map((r) => r.costPerActionType || [])),
    dateStart: sortedStarts.length ? sortedStarts[0] : undefined,
    dateStop: sortedStops.length ? sortedStops[sortedStops.length - 1] : undefined,
    costPerCandidate,
    leadsCount: nexthireLeads,
  };
}

interface Props {
  insights: InsightsMetricsInput;
  costPerCandidate?: number | null;
  leadsCount?: number | null;
  /** Unique SVG gradient ids when multiple views mount. */
  gradientIdPrefix?: string;
  showPeriod?: boolean;
  showActions?: boolean;
}

export default function CampaignInsightsMetricsView({
  insights,
  costPerCandidate: costPerCandidateProp,
  leadsCount,
  gradientIdPrefix = 'insights',
  showPeriod = true,
  showActions = true,
}: Props) {
  const { t } = useTranslation();

  const costPerCandidate =
    costPerCandidateProp != null
      ? costPerCandidateProp
      : computeCostPerCandidate(
          insights.spend,
          leadsCount != null && Number(leadsCount) > 0 ? Number(leadsCount) : insights.metaLeads
        );

  const volumeBars = useMemo((): ChartBar[] => {
    if (insights.empty) return [];
    return [
      {
        key: 'impressions',
        label: t('sourcing.campaign.insights.chart.impressions'),
        value: Number(insights.impressions) || 0,
        color: '#8B5CF6',
      },
      {
        key: 'reach',
        label: t('sourcing.campaign.insights.chart.reach'),
        value: Number(insights.reach) || 0,
        color: '#06B6D4',
      },
      {
        key: 'clicks',
        label: t('sourcing.campaign.insights.chart.clicks'),
        value: Number(insights.clicks) || 0,
        color: '#F59E0B',
      },
      {
        key: 'linkClicks',
        label: t('sourcing.campaign.insights.chart.linkClicks'),
        value: Number(insights.inlineLinkClicks) || 0,
        color: '#F97316',
      },
      {
        key: 'leads',
        label: t('sourcing.campaign.insights.chart.leads'),
        value:
          leadsCount != null && Number(leadsCount) > 0
            ? Number(leadsCount)
            : Number(insights.metaLeads) || 0,
        color: '#10B981',
      },
    ].filter((b) => b.value > 0 || ['impressions', 'reach', 'clicks', 'linkClicks'].includes(b.key));
  }, [insights, leadsCount, t]);

  const funnelSteps = useMemo(() => {
    if (insights.empty) return [];
    return [
      {
        label: t('sourcing.campaign.insights.impressions'),
        value: Number(insights.impressions) || 0,
        color: '#8B5CF6',
      },
      {
        label: t('sourcing.campaign.insights.reach'),
        value: Number(insights.reach) || 0,
        color: '#06B6D4',
      },
      {
        label: t('sourcing.campaign.insights.linkClicks'),
        value: Number(insights.inlineLinkClicks ?? insights.clicks) || 0,
        color: '#F97316',
      },
      {
        label: t('sourcing.campaign.insights.chart.leads'),
        value:
          leadsCount != null && Number(leadsCount) > 0
            ? Number(leadsCount)
            : Number(insights.metaLeads) || 0,
        color: '#10B981',
      },
    ];
  }, [insights, leadsCount, t]);

  if (insights.empty) {
    return <p className="text-sm text-gray-600">{t('sourcing.campaign.insights.empty')}</p>;
  }

  return (
    <div className="space-y-5">
      {showPeriod && insights.dateStart && insights.dateStop ? (
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>
            {t('sourcing.campaign.insights.period')}: {insights.dateStart} → {insights.dateStop}
          </span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <PerformanceBarChart
            bars={volumeBars}
            title={t('sourcing.campaign.insights.chart.volumeTitle')}
            gradientIdPrefix={gradientIdPrefix}
          />
        </div>
        <div className="lg:col-span-2">
          <FunnelStrip title={t('sourcing.campaign.insights.chart.funnelTitle')} steps={funnelSteps} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard
          label={t('sourcing.campaign.insights.spend')}
          value={formatMoney(insights.spend)}
          accent="#EC4899"
          hint={t('sourcing.campaign.insights.help.spend')}
        />
        <MetricCard
          label={t('sourcing.dashboard.costPerCandidate')}
          value={formatMoney(costPerCandidate)}
          accent="#22C55E"
          hint={t('sourcing.campaign.insights.help.costPerCandidate')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.impressions')}
          value={formatCount(insights.impressions)}
          accent="#8B5CF6"
          hint={t('sourcing.campaign.insights.help.impressions')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.reach')}
          value={formatCount(insights.reach)}
          accent="#06B6D4"
          hint={t('sourcing.campaign.insights.help.reach')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.linkClicks')}
          value={formatCount(insights.inlineLinkClicks)}
          accent="#F97316"
          hint={t('sourcing.campaign.insights.help.linkClicks')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.costPerLinkClick')}
          value={formatMoney(insights.costPerInlineLinkClick)}
          accent="#F59E0B"
          hint={t('sourcing.campaign.insights.help.costPerLinkClick')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.ctr')}
          value={formatCtr(insights.ctr)}
          accent="#6366F1"
          hint={t('sourcing.campaign.insights.help.ctr')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.clicks')}
          value={formatCount(insights.clicks)}
          accent="#EAB308"
          hint={t('sourcing.campaign.insights.help.clicks')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.cpc')}
          value={formatMoney(insights.cpc)}
          accent="#14B8A6"
          hint={t('sourcing.campaign.insights.help.cpc')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.cpm')}
          value={formatMoney(insights.cpm)}
          accent="#0EA5E9"
          hint={t('sourcing.campaign.insights.help.cpm')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.frequency')}
          value={insights.frequency != null ? insights.frequency.toFixed(2) : '—'}
          accent="#A855F7"
          hint={t('sourcing.campaign.insights.help.frequency')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.metaLeads')}
          value={formatCount(insights.metaLeads)}
          accent="#10B981"
          hint={t('sourcing.campaign.insights.help.metaLeads')}
        />
        <MetricCard
          label={t('sourcing.campaign.insights.costPerLead')}
          value={formatMoney(insights.costPerLead)}
          accent="#22C55E"
          hint={t('sourcing.campaign.insights.help.costPerLead')}
        />
      </div>

      {showActions ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionsTable title={t('sourcing.campaign.insights.actions')} rows={insights.actions || []} />
          <ActionsTable
            title={t('sourcing.campaign.insights.costPerAction')}
            rows={insights.costPerActionType || []}
            money
          />
        </div>
      ) : null}
    </div>
  );
}

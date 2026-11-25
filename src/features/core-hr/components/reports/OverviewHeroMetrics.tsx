import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { ReportsOverview } from '../../models/hrReports';
import { formatDeltaPct, formatNumber } from '../../utils/hrReportsFormat';
import { DeltaBadge } from './AnalyticsKpiStrip';

type Props = { overview: ReportsOverview };

function CompactCard({
  label,
  value,
  suffix,
  metric,
  risingIsGood,
  icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  metric: ReportsOverview['newHires'];
  risingIsGood: boolean;
  icon: JSX.Element;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">{icon}</span>
        <DeltaBadge metric={metric} risingIsGood={risingIsGood} />
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold tabular-nums text-dark-text">
          {value}
          {suffix ? <span className="ml-1 text-sm font-medium text-gray-400">{suffix}</span> : null}
        </p>
        <p className="mt-0.5 text-xs font-medium text-gray-500">{label}</p>
      </div>
    </div>
  );
}

const iconProps = { className: 'h-5 w-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', 'aria-hidden': true } as const;

export default function OverviewHeroMetrics({ overview }: Props) {
  const { t, i18n } = useTranslation();
  const loc = i18n.language;
  const total = overview.totalEmployees;
  const spark = overview.headcountEvolution.map((p) => ({ v: p.value }));
  const deltaLabel = formatDeltaPct(total, loc);
  const net = total.delta;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-violet-600 to-purple-500 p-6 text-white shadow-lg shadow-violet-200 lg:col-span-5">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-violet-100">{t('coreHr.reports.kpi.totalEmployees')}</p>
            <p className="mt-3 text-5xl font-bold tabular-nums tracking-tight">{formatNumber(total.value, loc, 0)}</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
            <svg {...iconProps}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </span>
        </div>
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-sm">
          {deltaLabel ? (
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold tabular-nums">{deltaLabel}</span>
          ) : null}
          {net != null && net !== 0 ? (
            <span className="text-violet-100">
              {t('coreHr.reports.kpi.netChange', { value: `${net > 0 ? '+' : ''}${formatNumber(net, loc, 0)}` })}
            </span>
          ) : null}
          {total.previousValue != null ? (
            <span className="text-violet-200">{t('coreHr.reports.kpi.vsPrevious', { value: formatNumber(total.previousValue, loc, 0) })}</span>
          ) : null}
        </div>
        {spark.length > 1 ? (
          <div aria-hidden className="relative mt-4 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <Area type="monotone" dataKey="v" stroke="#FFFFFF" strokeWidth={2} fill="#FFFFFF" fillOpacity={0.18} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-7">
        <CompactCard
          label={t('coreHr.reports.kpi.newHires')}
          value={formatNumber(overview.newHires.value, loc, 0)}
          metric={overview.newHires}
          risingIsGood
          icon={
            <svg {...iconProps}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
        <CompactCard
          label={t('coreHr.reports.kpi.turnoverRate')}
          value={formatNumber(overview.turnoverRate.value, loc, 1)}
          suffix="%"
          metric={overview.turnoverRate}
          risingIsGood={false}
          icon={
            <svg {...iconProps}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
        />
        <CompactCard
          label={t('coreHr.reports.kpi.avgTenure')}
          value={formatNumber(overview.averageTenureYears.value, loc, 1)}
          suffix={t('coreHr.reports.kpi.yearsShort')}
          metric={overview.averageTenureYears}
          risingIsGood
          icon={
            <svg {...iconProps}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

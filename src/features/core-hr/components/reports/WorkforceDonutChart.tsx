import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { NamedCount } from '../../models/hrReports';
import { CHART_COLORS, formatNumber } from '../../utils/hrReportsFormat';
import { ChartEmpty } from './ChartPanel';

type Props = {
  slices: NamedCount[];
  centerLabel: string;
  /** Max legend items before the tail is grouped into "Other". */
  maxItems?: number;
};

export default function WorkforceDonutChart({ slices, centerLabel, maxItems = 6 }: Props) {
  const { t, i18n } = useTranslation();
  const positive = slices.filter((s) => s.value > 0);
  if (positive.length === 0) return <ChartEmpty text={t('coreHr.reports.states.noData')} />;

  const sorted = [...positive].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, maxItems);
  const tail = sorted.slice(maxItems);
  const items = tail.length
    ? [...head, { key: '__other__', label: t('coreHr.reports.overview.other'), value: tail.reduce((s, x) => s + x.value, 0), percent: null }]
    : head;
  const total = items.reduce((s, x) => s + x.value, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0" role="img" aria-label={centerLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={items} dataKey="value" nameKey="label" innerRadius={56} outerRadius={80} paddingAngle={2} stroke="none">
              {items.map((it, i) => (
                <Cell key={it.key} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-dark-text">{formatNumber(total, i18n.language, 0)}</span>
          <span className="text-[11px] text-gray-500">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {items.map((it, i) => {
          const pct = it.percent ?? (total > 0 ? (it.value / total) * 100 : 0);
          return (
            <li key={it.key} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="flex-1 truncate text-gray-600">{it.label}</span>
              <span className="tabular-nums text-gray-400">{formatNumber(it.value, i18n.language, 0)}</span>
              <span className="w-12 text-right font-semibold tabular-nums text-dark-text">{formatNumber(pct, i18n.language, 0)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

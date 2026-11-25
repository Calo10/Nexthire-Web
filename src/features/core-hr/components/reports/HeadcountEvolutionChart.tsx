import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { TimeSeriesPoint } from '../../models/hrReports';
import { shortPeriodLabel } from '../../utils/hrReportsFormat';
import { ChartEmpty } from './ChartPanel';

type Props = {
  data: TimeSeriesPoint[];
  /** Series name shown in the tooltip. */
  name: string;
  color?: string;
  height?: number;
  /** `line` renders a stroke-only series (for rates / trends). */
  variant?: 'area' | 'line';
  valueSuffix?: string;
};

export default function HeadcountEvolutionChart({ data, name, color = '#7C3AED', height = 260, variant = 'area', valueSuffix = '' }: Props) {
  const { t, i18n } = useTranslation();
  if (data.length === 0) return <ChartEmpty text={t('coreHr.reports.states.noData')} height={height} />;
  const rows = data.map((p) => ({ label: shortPeriodLabel(p.label, p.periodStart, i18n.language), value: p.value }));
  const gradientId = `grad-${name.replace(/\W/g, '')}-${color.replace('#', '')}`;
  return (
    <div style={{ height }} role="img" aria-label={name}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={variant === 'area' ? 0.35 : 0} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} width={44} />
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.2 }}
            formatter={(v) => [`${v}${valueSuffix}`, name]}
            contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

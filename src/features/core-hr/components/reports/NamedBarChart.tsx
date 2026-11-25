import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { NamedCount } from '../../models/hrReports';
import { CHART_COLORS } from '../../utils/hrReportsFormat';
import { ChartEmpty } from './ChartPanel';

type Props = {
  data: NamedCount[];
  name: string;
  color?: string;
  /** `horizontal` draws category labels on the Y axis (better for long names). */
  layout?: 'vertical' | 'horizontal';
  multiColor?: boolean;
  valueSuffix?: string;
  maxItems?: number;
};

export default function NamedBarChart({ data, name, color = '#7C3AED', layout = 'horizontal', multiColor, valueSuffix = '', maxItems = 10 }: Props) {
  const { t } = useTranslation();
  const rows = data.slice(0, maxItems).map((d) => ({ label: d.label, value: d.value }));
  const horizontal = layout === 'horizontal';
  const height = horizontal ? Math.max(180, rows.length * 34 + 24) : 240;
  if (rows.length === 0) return <ChartEmpty text={t('coreHr.reports.states.noData')} height={180} />;
  return (
    <div style={{ height }} role="img" aria-label={name}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 4, right: 16, left: horizontal ? 8 : -12, bottom: 0 }}>
          <CartesianGrid stroke="#F3F4F6" horizontal={!horizontal} vertical={horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} />
              <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} width={40} />
            </>
          )}
          <Tooltip
            cursor={{ fill: '#F9FAFB' }}
            formatter={(v) => [`${v}${valueSuffix}`, name]}
            contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
          />
          <Bar dataKey="value" radius={4} maxBarSize={22} fill={color}>
            {multiColor ? rows.map((r, i) => <Cell key={r.label} fill={CHART_COLORS[i % CHART_COLORS.length]} />) : null}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

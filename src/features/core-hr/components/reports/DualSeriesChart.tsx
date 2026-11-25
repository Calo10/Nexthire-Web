import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { TimeSeriesPoint } from '../../models/hrReports';
import { shortPeriodLabel } from '../../utils/hrReportsFormat';
import { ChartEmpty } from './ChartPanel';

type Props = {
  a: TimeSeriesPoint[];
  b: TimeSeriesPoint[];
  aName: string;
  bName: string;
  height?: number;
};

/** Two aligned series (e.g. arrivals vs departures) on one line chart. */
export default function DualSeriesChart({ a, b, aName, bName, height = 260 }: Props) {
  const { t, i18n } = useTranslation();
  if (a.length === 0 && b.length === 0) return <ChartEmpty text={t('coreHr.reports.states.noData')} height={height} />;
  const base = a.length >= b.length ? a : b;
  const rows = base.map((p, i) => ({
    label: shortPeriodLabel(p.label, p.periodStart, i18n.language),
    a: a[i]?.value ?? 0,
    b: b[i]?.value ?? 0,
  }));
  return (
    <div style={{ height }} role="img" aria-label={`${aName} / ${bName}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} width={40} />
          <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" name={aName} dataKey="a" stroke="#0D9488" strokeWidth={2.5} dot={false} />
          <Line type="monotone" name={bName} dataKey="b" stroke="#EF4444" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

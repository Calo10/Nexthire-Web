import { useMemo } from 'react';
import type { NamedCount, ReportChartType, ReportExecutionResult, TimeSeriesPoint } from '../../models/hrReports';
import HeadcountEvolutionChart from './HeadcountEvolutionChart';
import NamedBarChart from './NamedBarChart';
import ReportPreviewTable from './ReportPreviewTable';
import WorkforceDonutChart from './WorkforceDonutChart';

type Props = {
  result: ReportExecutionResult;
  chartType: ReportChartType;
  dimensions?: string[];
  measures?: string[];
  labels?: Record<string, string>;
  /** Compact mode (dashboard widgets): chart only when a chart type is set, smaller table. */
  compact?: boolean;
  centerLabel?: string;
};

/** Renders a report execution as a chart (when chartable) plus the underlying table. */
export default function ReportResultView({ result, chartType, dimensions = [], measures = [], labels, compact, centerLabel = '' }: Props) {
  const chartData = useMemo(() => {
    const cols = result.columns;
    const dim = dimensions.find((d) => cols.includes(d)) ?? cols.find((c) => result.rows.some((r) => typeof r[c] !== 'number')) ?? cols[0];
    const meas = measures.find((m) => cols.includes(m)) ?? cols.find((c) => c !== dim && result.rows.some((r) => typeof r[c] === 'number'));
    if (dim && meas && result.rows.length > 0) {
      const named: NamedCount[] = result.rows.map((r, i) => ({
        key: `${String(r[dim] ?? i)}-${i}`,
        label: String(r[dim] ?? ''),
        value: Number(r[meas]) || 0,
        percent: null,
      }));
      return { named, meas: labels?.[meas] ?? meas };
    }
    if (result.series && result.series.length > 0) return { named: result.series, meas: result.datasetKey };
    return null;
  }, [result, dimensions, measures, labels]);

  const showChart = chartType !== 'table' && chartData && chartData.named.length > 0;
  const series: TimeSeriesPoint[] = chartData ? chartData.named.map((n) => ({ label: n.label, periodStart: '', value: n.value })) : [];

  return (
    <div className="space-y-4">
      {showChart && chartData ? (
        chartType === 'donut' ? (
          <WorkforceDonutChart slices={chartData.named} centerLabel={centerLabel || chartData.meas} />
        ) : chartType === 'bar' ? (
          <NamedBarChart data={chartData.named} name={chartData.meas} layout="vertical" maxItems={24} />
        ) : (
          <HeadcountEvolutionChart data={series} name={chartData.meas} variant={chartType === 'line' ? 'line' : 'area'} height={compact ? 180 : 260} />
        )
      ) : null}
      {!compact || !showChart ? (
        <ReportPreviewTable
          columns={result.columns}
          rows={result.rows}
          truncatedAt={result.truncatedAt}
          rowCount={result.rowCount}
          labels={labels}
          maxHeightClass={compact ? 'max-h-56' : 'max-h-96'}
        />
      ) : null}
    </div>
  );
}

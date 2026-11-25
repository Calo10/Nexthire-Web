import type {
  ComparisonMode,
  DatePreset,
  MetricValue,
  ReportConfiguration,
  ReportsFilters,
  ReportsOverview,
} from '../models/hrReports';
import { EMPTY_REPORT_CONFIG } from '../models/hrReports';

/* ------------------------------------------------------------------ */
/* Date ranges                                                         */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, '0');

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function presetRange(preset: Exclude<DatePreset, 'custom'>, now = new Date()): { from: string; to: string } {
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (preset) {
    case 'thisMonth':
      return { from: toIsoDate(new Date(y, m, 1)), to: toIsoDate(now) };
    case 'lastMonth':
      return { from: toIsoDate(new Date(y, m - 1, 1)), to: toIsoDate(new Date(y, m, 0)) };
    case 'last3Months':
      return { from: toIsoDate(new Date(y, m - 2, 1)), to: toIsoDate(now) };
    case 'last6Months':
      return { from: toIsoDate(new Date(y, m - 5, 1)), to: toIsoDate(now) };
    case 'last12Months':
      return { from: toIsoDate(new Date(y, m - 11, 1)), to: toIsoDate(now) };
    case 'thisYear':
      return { from: toIsoDate(new Date(y, 0, 1)), to: toIsoDate(now) };
  }
}

export const DEFAULT_PRESET: Exclude<DatePreset, 'custom'> = 'last6Months';

export function defaultFilters(): ReportsFilters {
  return {
    ...presetRange(DEFAULT_PRESET),
    comparison: 'PreviousPeriod' as ComparisonMode,
    departmentId: '',
    managerId: '',
    workLocationId: '',
    employmentTypeId: '',
    employmentStatus: '',
  };
}

/* ------------------------------------------------------------------ */
/* Number formatting                                                   */
/* ------------------------------------------------------------------ */

export function formatNumber(n: number, locale?: string, maxFraction = 1): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxFraction }).format(n);
}

export function formatPercent(n: number, locale?: string, maxFraction = 1): string {
  return `${formatNumber(n, locale, maxFraction)}%`;
}

export function formatCurrency(n: number, currency: string | null | undefined, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${formatNumber(n, locale, 0)} ${currency ?? ''}`.trim();
  }
}

/** Metric delta direction: `good` depends on whether a rise is desirable. */
export function deltaTone(metric: MetricValue, risingIsGood: boolean): 'good' | 'bad' | 'neutral' {
  const d = metric.deltaPct ?? metric.delta;
  if (d == null || d === 0) return 'neutral';
  return d > 0 === risingIsGood ? 'good' : 'bad';
}

export function formatDeltaPct(metric: MetricValue, locale?: string): string | null {
  if (metric.deltaPct == null) return null;
  const v = metric.deltaPct;
  return `${v > 0 ? '+' : ''}${formatNumber(v, locale, 1)}%`;
}

/** Shortens axis labels like "2025-03" or full ISO dates when the API supplies them as the label. */
export function shortPeriodLabel(label: string, periodStart: string, locale?: string): string {
  if (label && !/^\d{4}-\d{2}(-\d{2})?(T.*)?$/.test(label)) return label;
  const d = new Date(periodStart || label);
  if (Number.isNaN(d.getTime())) return label;
  return d.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
}

/* ------------------------------------------------------------------ */
/* CSV / files                                                         */
/* ------------------------------------------------------------------ */

type Cell = string | number | null | undefined;

export function toSafeCsv(rows: Cell[][]): string {
  const esc = (v: Cell) => {
    let s = v == null ? '' : String(v);
    // Neutralize spreadsheet formula injection for text only (numbers keep their sign).
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

export function csvBlob(rows: Cell[][]): Blob {
  return new Blob(['\uFEFF', toSafeCsv(rows)], { type: 'text/csv;charset=utf-8' });
}

type OverviewCsvLabels = {
  section: string;
  metric: string;
  value: string;
  previous: string;
  deltaPct: string;
  headcountEvolution: string;
  department: string;
  metrics: Record<'totalEmployees' | 'newHires' | 'turnoverRate' | 'averageTenure' | 'onboarding' | 'offboarding' | 'documents', string>;
};

/** Builds an overview CSV purely from API data (no hardcoded figures). */
export function overviewToCsvRows(o: ReportsOverview, labels: OverviewCsvLabels): Cell[][] {
  const m = (name: string, v: MetricValue): Cell[] => [name, v.value, v.previousValue, v.deltaPct];
  return [
    [labels.section, labels.metric, labels.value, labels.previous, labels.deltaPct],
    ...[
      m(labels.metrics.totalEmployees, o.totalEmployees),
      m(labels.metrics.newHires, o.newHires),
      m(labels.metrics.turnoverRate, o.turnoverRate),
      m(labels.metrics.averageTenure, o.averageTenureYears),
    ].map((r) => ['KPI', ...r]),
    ['KPI', labels.metrics.onboarding, o.onboarding.completionPct, o.onboarding.previousCompletionPct, null],
    ['KPI', labels.metrics.offboarding, o.offboarding.completionPct, o.offboarding.previousCompletionPct, null],
    ['KPI', labels.metrics.documents, o.documents.completenessPct, null, null],
    ...o.headcountEvolution.map((p) => [labels.headcountEvolution, p.label || p.periodStart, p.value, null, null]),
    ...o.workforceByDepartment.map((d) => [labels.department, d.label, d.value, d.percent, null]),
  ];
}

/** Reads a report's builder configuration defensively. */
export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw) as unknown;
    return v && typeof v === 'object' ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Normalize API/builder config: measures may be strings or `{field,agg}` objects. */
export function normalizeReportConfig(raw: Partial<ReportConfiguration> | Record<string, unknown> | null | undefined): ReportConfiguration {
  const base = { ...EMPTY_REPORT_CONFIG, ...(raw ?? {}) } as ReportConfiguration & { measures?: unknown };
  const measuresRaw = Array.isArray(base.measures) ? base.measures : [];
  const measures = measuresRaw
    .map((m) => {
      if (typeof m === 'string') return m;
      if (m && typeof m === 'object' && 'field' in m) return String((m as { field: unknown }).field ?? '');
      return '';
    })
    .filter(Boolean);
  return {
    dimensions: Array.isArray(base.dimensions) ? base.dimensions.map(String).filter(Boolean) : [],
    measures,
    filters: Array.isArray(base.filters) ? base.filters : [],
    chartType: base.chartType || 'table',
    limit: typeof base.limit === 'number' ? base.limit : undefined,
  };
}

/** Serialize UI config into the backend allowlisted shape (`measures` as `{field,agg}`). */
export function serializeReportConfig(config: ReportConfiguration): string {
  const filters = (config.filters ?? []).filter((f) => f.field && f.value !== '');
  return JSON.stringify({
    dimensions: config.dimensions,
    measures: config.measures.map((field) => ({ field, agg: 'count' })),
    filters,
    chartType: config.chartType,
    limit: config.limit ?? 500,
  });
}

export const CHART_COLORS = ['#7C3AED', '#0D9488', '#F59E0B', '#EC4899', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316'];

/** Stable numeric hash of a string; used to refetch resources when filters change. */
export function hashKey(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  return h;
}

export type KpiFormat = 'number' | 'percent' | 'years' | 'days' | 'currency';

export function formatKpi(value: number, format: KpiFormat, locale: string | undefined, currency?: string | null): string {
  switch (format) {
    case 'percent':
      return formatPercent(value, locale);
    case 'years':
      return formatNumber(value, locale, 1);
    case 'days':
      return formatNumber(value, locale, 1);
    case 'currency':
      return formatCurrency(value, currency, locale);
    default:
      return formatNumber(value, locale, 0);
  }
}


import { useTranslation } from 'react-i18next';
import type { MetricValue } from '../../models/hrReports';
import { deltaTone, formatDeltaPct, formatKpi, type KpiFormat } from '../../utils/hrReportsFormat';

export type KpiItem = {
  key: string;
  label: string;
  /** API metric (with optional comparison) or a plain number. */
  metric?: MetricValue;
  value?: number | null;
  format?: KpiFormat;
  currency?: string | null;
  /** Whether an increase is desirable (colors the delta). */
  risingIsGood?: boolean;
  hint?: string;
  tone?: 'default' | 'warning' | 'danger';
};

const TONE_CLS = {
  good: 'bg-emerald-50 text-emerald-700',
  bad: 'bg-red-50 text-red-700',
  neutral: 'bg-gray-100 text-gray-600',
} as const;

export function DeltaBadge({ metric, risingIsGood = true, className = '' }: { metric: MetricValue; risingIsGood?: boolean; className?: string }) {
  const { i18n } = useTranslation();
  const label = formatDeltaPct(metric, i18n.language);
  if (!label) return null;
  const tone = deltaTone(metric, risingIsGood);
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${TONE_CLS[tone]} ${className}`}>
      <svg aria-hidden className={`h-3 w-3 ${(metric.deltaPct ?? 0) < 0 ? 'rotate-180' : ''} ${metric.deltaPct === 0 ? 'opacity-0' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
      </svg>
      {label}
    </span>
  );
}

export default function AnalyticsKpiStrip({ items }: { items: KpiItem[] }) {
  const { t, i18n } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {items.map((it) => {
        const raw = it.metric ? it.metric.value : it.value;
        const fmt = it.format ?? 'number';
        const accent = it.tone === 'danger' ? 'text-red-600' : it.tone === 'warning' ? 'text-amber-600' : 'text-dark-text';
        return (
          <div key={it.key} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{it.label}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className={`text-2xl font-bold tabular-nums ${accent}`}>
                {raw == null ? '—' : formatKpi(raw, fmt, i18n.language, it.currency)}
                {raw != null && fmt === 'years' ? <span className="ml-1 text-sm font-medium text-gray-400">{t('coreHr.reports.kpi.yearsShort')}</span> : null}
                {raw != null && fmt === 'days' ? <span className="ml-1 text-sm font-medium text-gray-400">{t('coreHr.reports.kpi.daysShort')}</span> : null}
              </p>
              {it.metric ? <DeltaBadge metric={it.metric} risingIsGood={it.risingIsGood} /> : null}
            </div>
            {it.hint ? <p className="mt-1 text-[11px] text-gray-400">{it.hint}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

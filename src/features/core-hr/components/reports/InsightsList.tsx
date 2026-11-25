import { useTranslation } from 'react-i18next';
import type { Insight, InsightSeverity } from '../../models/hrReports';

const STYLE: Record<InsightSeverity, { wrap: string; icon: JSX.Element }> = {
  Positive: {
    wrap: 'bg-emerald-50 text-emerald-600',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
  },
  Warning: {
    wrap: 'bg-amber-50 text-amber-600',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />,
  },
  Info: {
    wrap: 'bg-violet-50 text-violet-600',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
};

export default function InsightsList({ insights }: { insights: Insight[] }) {
  const { t } = useTranslation();
  if (insights.length === 0) {
    return <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">{t('coreHr.reports.overview.noInsights')}</p>;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {insights.map((it, i) => {
        const s = STYLE[it.severity];
        return (
          <li key={`${it.code}-${i}`} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.wrap}`}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                {s.icon}
              </svg>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dark-text">{it.title}</p>
              {it.message ? <p className="mt-0.5 text-xs text-gray-500">{it.message}</p> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

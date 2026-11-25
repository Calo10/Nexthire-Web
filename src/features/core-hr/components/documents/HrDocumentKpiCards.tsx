import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { HrDocumentSummary } from '../../models/hrDocument';

function Card({ icon, label, value, hint, tone }: { icon: ReactNode; label: string; value: ReactNode; hint?: string; tone: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-dark-text">{value}</p>
          {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      </div>
    </div>
  );
}

const ICON = (d: string) => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
  </svg>
);

const PATHS = {
  doc: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
};

type Props = { summary: HrDocumentSummary | null; loading: boolean; error?: boolean };

export default function HrDocumentKpiCards({ summary, loading, error }: Props) {
  const { t, i18n } = useTranslation();
  const nf = (n: number, digits = 0) =>
    n.toLocaleString(i18n.language || 'en', { minimumFractionDigits: 0, maximumFractionDigits: digits });

  if (loading && !summary) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[116px] animate-pulse rounded-xl border border-gray-200 bg-white" />
        ))}
      </div>
    );
  }
  const s = summary;
  const dash = '—';
  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-amber-700">{t('coreHr.documentsHub.kpi.loadError')}</p> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          icon={ICON(PATHS.doc)}
          tone="bg-teal-50 text-teal-700"
          label={t('coreHr.documentsHub.kpi.total')}
          value={s ? nf(s.total) : dash}
        />
        <Card
          icon={ICON(PATHS.check)}
          tone="bg-emerald-50 text-emerald-700"
          label={t('coreHr.documentsHub.kpi.valid')}
          value={s ? `${nf(s.validPercent, 0)}%` : dash}
          hint={s ? t('coreHr.documentsHub.kpi.validCount', { count: s.valid }) : undefined}
        />
        <Card
          icon={ICON(PATHS.clock)}
          tone="bg-amber-50 text-amber-700"
          label={t('coreHr.documentsHub.kpi.expiring')}
          value={s ? nf(s.expiringSoon) : dash}
        />
        <Card
          icon={ICON(PATHS.alert)}
          tone="bg-red-50 text-red-700"
          label={t('coreHr.documentsHub.kpi.expired')}
          value={s ? nf(s.expired) : dash}
        />
      </div>
    </div>
  );
}

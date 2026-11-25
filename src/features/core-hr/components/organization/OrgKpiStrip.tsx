import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrganizationSummary } from '../../models/organization';

const PATHS = {
  people:
    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  building:
    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  briefcase:
    'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  span: 'M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01',
};

function Kpi({ path, label, value, hint, tone }: { path: string; label: string; value: ReactNode; hint?: string; tone: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={path} />
        </svg>
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold leading-tight tracking-tight text-dark-text">{value}</p>
        {hint ? <p className="truncate text-[11px] text-gray-500">{hint}</p> : null}
      </div>
    </div>
  );
}

type Props = { summary: OrganizationSummary | null; loading: boolean; error?: boolean };

export default function OrgKpiStrip({ summary, loading, error }: Props) {
  const { t, i18n } = useTranslation();
  const nf = (n: number, digits = 0) =>
    n.toLocaleString(i18n.language || 'en', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  if (loading && !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-xl border border-gray-200 bg-white" />
        ))}
      </div>
    );
  }
  const s = summary;
  const dash = '—';
  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-amber-700">{t('coreHr.organization.kpi.loadError')}</p> : null}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi path={PATHS.people} tone="bg-teal-50 text-teal-700" label={t('coreHr.organization.kpi.employees')} value={s ? nf(s.totalEmployees) : dash} />
        <Kpi path={PATHS.building} tone="bg-sky-50 text-sky-700" label={t('coreHr.organization.kpi.departments')} value={s ? nf(s.totalDepartments) : dash} />
        <Kpi
          path={PATHS.briefcase}
          tone="bg-violet-50 text-violet-700"
          label={t('coreHr.organization.kpi.positions')}
          value={s ? nf(s.totalPositions) : dash}
          hint={s?.openPositions != null ? t('coreHr.organization.kpi.openPositions', { count: s.openPositions }) : undefined}
        />
        <Kpi
          path={PATHS.span}
          tone="bg-amber-50 text-amber-700"
          label={t('coreHr.organization.kpi.span')}
          value={s ? nf(s.averageSpanOfControl, 1) : dash}
          hint={t('coreHr.organization.kpi.spanHint')}
        />
      </div>
    </div>
  );
}

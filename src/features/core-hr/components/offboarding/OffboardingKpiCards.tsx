import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { OffboardingSummary } from '../../models/offboarding';

type Delta = { text: string; tone: 'up' | 'down' | 'flat' } | null;

function Trend({ delta, label }: { delta: Delta; label: string }) {
  if (!delta) return null;
  const color = delta.tone === 'up' ? 'text-emerald-600' : delta.tone === 'down' ? 'text-red-600' : 'text-gray-500';
  const arrow = delta.tone === 'up' ? '▲' : delta.tone === 'down' ? '▼' : '–';
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs">
      <span className={`font-semibold ${color}`}>
        <span aria-hidden className="mr-0.5 text-[10px]">
          {arrow}
        </span>
        {delta.text}
      </span>
      <span className="text-gray-500">{label}</span>
    </p>
  );
}

function Card({ icon, label, value, children }: { icon: ReactNode; label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-dark-text">{value}</p>
          {children}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">{icon}</span>
      </div>
    </div>
  );
}

const ICON = (d: string) => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
  </svg>
);

const ICONS = {
  active: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
};

type Props = {
  summary: OffboardingSummary | null;
  loading: boolean;
  error?: boolean;
};

export default function OffboardingKpiCards({ summary, loading, error }: Props) {
  const { t, i18n } = useTranslation();
  const nf = (n: number, digits = 1) =>
    n.toLocaleString(i18n.language || 'en', { minimumFractionDigits: 0, maximumFractionDigits: digits });
  const signed = (n: number, digits = 1) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${nf(Math.abs(n), digits)}`;

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
  const vs = t('coreHr.offboarding.kpi.vsPrevious');

  let completedDelta: Delta = null;
  if (s) {
    const diff = s.completedInPeriod - s.previousCompletedInPeriod;
    completedDelta =
      s.previousCompletedInPeriod > 0
        ? { text: `${signed((diff / s.previousCompletedInPeriod) * 100, 0)}%`, tone: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat' }
        : s.completedInPeriod > 0
          ? { text: signed(diff, 0), tone: 'up' }
          : null;
  }

  const pendingClearanceItems = s ? s.pendingAssetReturns + s.pendingAccessRevocations : 0;

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-amber-700">{t('coreHr.offboarding.kpi.loadError')}</p> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card icon={ICON(ICONS.active)} label={t('coreHr.offboarding.kpi.active')} value={s ? nf(s.activeOffboardings, 0) : dash}>
          {s ? (
            <p className="mt-1 text-xs text-gray-500">
              {t('coreHr.offboarding.kpi.activeBreakdown', {
                scheduled: s.scheduled,
                inProgress: s.inProgress,
                pendingClearance: s.pendingClearance,
              })}
            </p>
          ) : null}
        </Card>
        <Card icon={ICON(ICONS.calendar)} label={t('coreHr.offboarding.kpi.upcoming')} value={s ? nf(s.upcomingDepartures, 0) : dash}>
          {s ? (
            <p className="mt-1 text-xs text-gray-500">
              {t('coreHr.offboarding.kpi.completedPeriod', { count: s.completedInPeriod })}
            </p>
          ) : null}
          <Trend delta={completedDelta} label={vs} />
        </Card>
        <Card icon={ICON(ICONS.box)} label={t('coreHr.offboarding.kpi.pendingClearance')} value={s ? nf(pendingClearanceItems, 0) : dash}>
          {s ? (
            <p className="mt-1 text-xs text-gray-500">
              {t('coreHr.offboarding.kpi.pendingBreakdown', {
                assets: s.pendingAssetReturns,
                access: s.pendingAccessRevocations,
              })}
            </p>
          ) : null}
        </Card>
        <Card icon={ICON(ICONS.alert)} label={t('coreHr.offboarding.kpi.overdue')} value={s ? nf(s.overdueTasks, 0) : dash}>
          {s ? (
            <p className={`mt-1 text-xs ${s.overdueOffboardings > 0 ? 'font-medium text-red-600' : 'text-gray-500'}`}>
              {t('coreHr.offboarding.kpi.overdueOffboardings', { count: s.overdueOffboardings })}
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

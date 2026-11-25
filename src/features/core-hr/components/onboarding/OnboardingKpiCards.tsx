import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { OnboardingSummary } from '../../models/onboarding';

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
  active: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  done: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  alert: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
};

type Props = {
  summary: OnboardingSummary | null;
  loading: boolean;
  error?: boolean;
};

export default function OnboardingKpiCards({ summary, loading, error }: Props) {
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
  const vs = t('coreHr.onboarding.kpi.vsPrevious');

  let completedDelta: Delta = null;
  let avgDelta: Delta = null;
  if (s) {
    const diff = s.completedInPeriod - s.previousCompletedInPeriod;
    completedDelta =
      s.previousCompletedInPeriod > 0
        ? { text: `${signed((diff / s.previousCompletedInPeriod) * 100, 0)}%`, tone: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat' }
        : s.completedInPeriod > 0
          ? { text: signed(diff, 0), tone: 'up' }
          : null;

    const avgDiff = s.averageCompletionDays - s.previousAverageCompletionDays;
    avgDelta =
      s.previousAverageCompletionDays > 0 || s.averageCompletionDays > 0
        ? {
            text: `${signed(avgDiff, 1)} ${t('coreHr.onboarding.kpi.days')}`,
            // Faster onboarding is better, so a decrease is shown as "up" (green).
            tone: Math.abs(avgDiff) < 0.05 ? 'flat' : avgDiff < 0 ? 'up' : 'down',
          }
        : null;
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-amber-700">{t('coreHr.onboarding.kpi.loadError')}</p> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card icon={ICON(ICONS.active)} label={t('coreHr.onboarding.kpi.active')} value={s ? nf(s.activeOnboardings, 0) : dash}>
          {s ? (
            <p className="mt-1 text-xs text-gray-500">
              {t('coreHr.onboarding.kpi.activeBreakdown', {
                notStarted: s.notStarted,
                inProgress: s.inProgress,
                inReview: s.inReview,
              })}
            </p>
          ) : null}
        </Card>
        <Card icon={ICON(ICONS.done)} label={t('coreHr.onboarding.kpi.completed')} value={s ? nf(s.completedInPeriod, 0) : dash}>
          <Trend delta={completedDelta} label={vs} />
        </Card>
        <Card
          icon={ICON(ICONS.clock)}
          label={t('coreHr.onboarding.kpi.avgCompletion')}
          value={s ? `${nf(s.averageCompletionDays, 1)} ${t('coreHr.onboarding.kpi.days')}` : dash}
        >
          <Trend delta={avgDelta} label={vs} />
        </Card>
        <Card icon={ICON(ICONS.alert)} label={t('coreHr.onboarding.kpi.overdue')} value={s ? nf(s.overdueTasks, 0) : dash}>
          {s ? (
            <p className={`mt-1 text-xs ${s.overdueOnboardings > 0 ? 'font-medium text-red-600' : 'text-gray-500'}`}>
              {t('coreHr.onboarding.kpi.overdueOnboardings', { count: s.overdueOnboardings })}
            </p>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

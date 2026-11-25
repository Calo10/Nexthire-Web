import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { EmployeeSummary } from '../models/employee';

type Delta = { text: string; tone: 'up' | 'down' | 'flat' } | null;

function Trend({ delta, label }: { delta: Delta; label: string }) {
  if (!delta) return null;
  const color =
    delta.tone === 'up' ? 'text-emerald-600' : delta.tone === 'down' ? 'text-red-600' : 'text-gray-500';
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          {icon}
        </span>
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
  people:
    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  userPlus: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  turnover: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
};

type Props = {
  summary: EmployeeSummary | null;
  loading: boolean;
  error?: boolean;
};

export default function EmployeeKpiCards({ summary, loading, error }: Props) {
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

  const dash = '—';
  const s = summary;
  const vs = t('coreHr.employees.kpi.vsPrevious');

  let newHiresDelta: Delta = null;
  let turnoverDelta: Delta = null;
  let tenureDelta: Delta = null;
  if (s) {
    const hireDiff = s.newHires - s.previousNewHires;
    newHiresDelta =
      s.previousNewHires > 0
        ? { text: `${signed((hireDiff / s.previousNewHires) * 100, 0)}%`, tone: hireDiff > 0 ? 'up' : hireDiff < 0 ? 'down' : 'flat' }
        : s.newHires > 0
          ? { text: signed(hireDiff, 0), tone: 'up' }
          : null;

    const turnDiff = s.turnoverRate - s.previousTurnoverRate;
    turnoverDelta =
      s.previousTurnoverRate > 0 || s.turnoverRate > 0
        ? {
            text: `${signed(turnDiff, 1)} ${t('coreHr.employees.kpi.pp')}`,
            // Higher turnover is worse, so an increase is shown as "down" (red).
            tone: Math.abs(turnDiff) < 0.05 ? 'flat' : turnDiff > 0 ? 'down' : 'up',
          }
        : null;

    const tenDiff = s.averageTenureYears - s.previousAverageTenureYears;
    tenureDelta =
      s.previousAverageTenureYears > 0 || s.averageTenureYears > 0
        ? {
            text: `${signed(tenDiff, 1)} ${t('coreHr.employees.kpi.years')}`,
            tone: Math.abs(tenDiff) < 0.05 ? 'flat' : tenDiff > 0 ? 'up' : 'down',
          }
        : null;
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-xs text-amber-700">{t('coreHr.employees.kpi.loadError')}</p> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card icon={ICON(ICONS.people)} label={t('coreHr.employees.kpi.total')} value={s ? nf(s.totalEmployees, 0) : dash}>
          {s ? (
            <p className="mt-1 text-xs text-gray-500">
              {t('coreHr.employees.kpi.activeCount', { count: s.activeEmployees })}
            </p>
          ) : null}
        </Card>
        <Card icon={ICON(ICONS.userPlus)} label={t('coreHr.employees.kpi.newHires')} value={s ? nf(s.newHires, 0) : dash}>
          <Trend delta={newHiresDelta} label={vs} />
        </Card>
        <Card
          icon={ICON(ICONS.turnover)}
          label={t('coreHr.employees.kpi.turnover')}
          value={s ? `${nf(s.turnoverRate, 1)}%` : dash}
        >
          <Trend delta={turnoverDelta} label={vs} />
        </Card>
        <Card
          icon={ICON(ICONS.clock)}
          label={t('coreHr.employees.kpi.tenure')}
          value={s ? `${nf(s.averageTenureYears, 1)} ${t('coreHr.employees.kpi.years')}` : dash}
        >
          <Trend delta={tenureDelta} label={vs} />
        </Card>
      </div>
    </div>
  );
}

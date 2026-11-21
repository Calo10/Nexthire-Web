import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAgentById } from '../models/agentCatalog';
import {
  formatTokenCount,
  type AgentActivityItem,
  type AgentHomeAnalytics,
  type TokenPeriod,
} from '../models/agentHome';

const PERIODS: TokenPeriod[] = ['7d', '30d', '90d'];

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function lastDays(count: number, now: Date): Date[] {
  const today = startOfDay(now);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - 1 - index));
    return date;
  });
}

function isSameDay(iso: string, day: Date): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate();
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date < end;
}

function seriesForPeriod(
  events: { at: string; tokens: number }[],
  period: TokenPeriod,
  locale: string,
  now = new Date(),
): { points: number[]; labels: string[] } {
  if (period === '90d') {
    const today = startOfDay(now);
    const weeks = Array.from({ length: 13 }, (_, index) => {
      const end = new Date(today);
      end.setDate(today.getDate() + 1);
      end.setDate(end.getDate() - (12 - index) * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 7);
      return { start, end };
    });
    return {
      points: weeks.map((week) =>
        events.reduce((sum, event) => sum + (inRange(event.at, week.start, week.end) ? event.tokens : 0), 0),
      ),
      labels: weeks.map((week) => week.start.toLocaleDateString(locale, { month: 'short', day: 'numeric' })),
    };
  }

  const days = lastDays(period === '7d' ? 7 : 30, now);
  return {
    points: days.map((day) => events.reduce((sum, event) => sum + (isSameDay(event.at, day) ? event.tokens : 0), 0)),
    labels: days.map((day) =>
      day.toLocaleDateString(locale, period === '7d' ? { weekday: 'short' } : { month: 'short', day: 'numeric' }),
    ),
  };
}

function TokenChart({ points, labels }: { points: number[]; labels: string[] }) {
  const width = 320;
  const height = 118;
  const padX = 8;
  const padY = 12;
  const max = Math.max(0, ...points);
  const coords = points.map((value, index) => {
    const x = padX + (index / Math.max(points.length - 1, 1)) * (width - padX * 2);
    const y = height - padY - (value / Math.max(max, 1)) * (height - padY * 2);
    return { x, y };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${padX},${height - padY} ${line} ${width - padX},${height - padY}`;
  const shown = labels.map((label, index) => ({ label, index })).filter((_, index) => {
    if (labels.length <= 8) return true;
    const step = Math.ceil(labels.length / 6);
    return index === 0 || index === labels.length - 1 || index % step === 0;
  });

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[118px]" aria-hidden>
        <defs>
          <linearGradient id="agentTokenFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {max > 0 ? (
          <>
            <polygon points={area} fill="url(#agentTokenFill)" />
            <polyline points={line} fill="none" stroke="#7C3AED" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
            {coords.length ? (
              <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="3.5" fill="#7C3AED" />
            ) : null}
            <text x={width - padX} y="11" textAnchor="end" fill="#9CA3AF" fontSize="9">
              {formatTokenCount(max)}
            </text>
          </>
        ) : (
          <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#E5E7EB" strokeWidth="1.5" />
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400 px-0.5">
        {shown.map((item) => (
          <span key={`${item.label}-${item.index}`}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}

export function TokenUsageCard({ analytics }: { analytics: AgentHomeAnalytics }) {
  const { t, i18n } = useTranslation();
  const [period, setPeriod] = useState<TokenPeriod>('7d');
  const { points, labels } = useMemo(
    () => seriesForPeriod(analytics.tokenEvents ?? [], period, i18n.language),
    [analytics.tokenEvents, period, i18n.language],
  );
  const periodTotal = points.reduce((sum, value) => sum + value, 0);
  const lifetime = analytics.tokens;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 inline-flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </span>
          <h3 className="text-sm font-semibold text-dark-text">{t('aiAgents.home.tokenUsage')}</h3>
        </div>
        <div className="flex rounded-lg border border-gray-200 p-0.5 text-[11px] font-medium">
          {PERIODS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={`h-6 px-2 rounded-md ${
                period === item ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-gray-500 hover:text-dark-text'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-dark-text leading-none">
        {formatTokenCount(periodTotal)}{' '}
        <span className="text-sm font-medium text-gray-400">{t('aiAgents.home.tokensUnit')}</span>
      </p>
      <p className="mt-1.5 text-xs text-gray-400">
        {lifetime > periodTotal
          ? t('aiAgents.home.tokenUsageLifetime', { total: formatTokenCount(lifetime) })
          : t(`aiAgents.home.tokenUsagePeriod.${period}`)}
      </p>
      <div className="mt-3">
        {periodTotal > 0 ? (
          <TokenChart points={points} labels={labels} />
        ) : (
          <div className="h-[118px] flex items-center justify-center rounded-xl bg-[#F8FAFC] text-sm text-gray-500 px-4 text-center">
            {lifetime > 0
              ? t('aiAgents.home.tokenUsageEmptyPeriod', { total: formatTokenCount(lifetime) })
              : t('aiAgents.home.tokenUsageEmpty')}
          </div>
        )}
      </div>
    </section>
  );
}

export function AgentStatusCard({ analytics }: { analytics: AgentHomeAnalytics }) {
  const { t } = useTranslation();
  const { active, paused, inactive } = analytics.status;
  const count = active + paused + inactive;
  const total = Math.max(count, 1);
  const rows = [
    { id: 'active', value: active, bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
    { id: 'paused', value: paused, bar: 'bg-violet-300', dot: 'bg-violet-400' },
    { id: 'inactive', value: inactive, bar: 'bg-gray-200', dot: 'bg-gray-400' },
  ] as const;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 inline-flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </span>
          <h3 className="text-sm font-semibold text-dark-text">{t('aiAgents.home.agentStatus')}</h3>
        </div>
        <p className="text-xs text-gray-400">
          {count} {t('aiAgents.home.agentsCount')}
        </p>
      </div>
      <div className="mt-4 h-2.5 rounded-full overflow-hidden flex bg-gray-100">
        {rows.map((row) =>
          row.value ? (
            <span key={row.id} className={row.bar} style={{ width: `${(row.value / total) * 100}%` }} />
          ) : null,
        )}
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between text-xs text-gray-600">
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${row.dot}`} />
              {t(`aiAgents.home.status.${row.id}`)}
            </span>
            <span className="font-medium text-dark-text">
              {row.value} ({Math.round((row.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RecentActivityCard({ activity }: { activity: AgentActivityItem[] }) {
  const { t } = useTranslation();
  const items = useMemo(
    () =>
      activity.map((item) => ({
        ...item,
        agent: getAgentById(item.agentId),
      })),
    [activity],
  );

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 inline-flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <h3 className="text-sm font-semibold text-dark-text">{t('aiAgents.home.recentActivity')}</h3>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{t('aiAgents.home.emptyActivity')}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-8 h-8 rounded-lg bg-[#F8FAFC] text-[#0077E6] inline-flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-dark-text leading-snug">
                  {item.title || t(`aiAgents.home.activity.${item.copyKey}`, { name: item.agent.firstName })}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {item.time ? new Date(item.time).toLocaleString() : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

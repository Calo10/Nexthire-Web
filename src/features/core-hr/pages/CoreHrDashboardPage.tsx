import { useTranslation } from 'react-i18next';
import CoreHrPageShell from '../components/CoreHrPageShell';
import CoreHrDashboardAiAgentsCard from '../components/CoreHrDashboardAiAgentsCard';
import HrAreaDonutChart from '../components/HrAreaDonutChart';
import HrHeadcountTrendChart from '../components/HrHeadcountTrendChart';
import {
  hrAreaSlices,
  hrDashboardMetrics,
  hrHeadcountTrend,
  hrProcesses,
  hrUpcomingEvents,
} from '../data/dashboardDemo';

function MetricIcon({ kind }: { kind: 'people' | 'userPlus' | 'clipboard' | 'file' }) {
  const paths: Record<typeof kind, JSX.Element> = {
    people: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    ),
    userPlus: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    ),
    clipboard: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
    file: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
  };

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {paths[kind]}
      </svg>
    </span>
  );
}

export default function CoreHrDashboardPage() {
  const { t } = useTranslation();
  const m = hrDashboardMetrics;

  const metrics = [
    {
      key: 'activeEmployees',
      value: m.activeEmployees.value,
      delta: m.activeEmployees.delta,
      icon: 'people' as const,
    },
    {
      key: 'newHires',
      value: m.newHires.value,
      delta: m.newHires.delta,
      icon: 'userPlus' as const,
    },
    {
      key: 'onboardingInProgress',
      value: m.onboardingInProgress.value,
      icon: 'clipboard' as const,
    },
    {
      key: 'docsExpiring',
      value: m.docsExpiring.value,
      icon: 'file' as const,
    },
  ];

  const areaSlices = hrAreaSlices.map((slice) => ({
    label: t(`coreHr.dashboard.areas.${slice.key}`),
    percent: slice.percent,
    color: slice.color,
  }));

  return (
    <CoreHrPageShell
      title={t('coreHr.dashboard.title')}
      subtitle={t('coreHr.dashboard.subtitle')}
      actions={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {t('coreHr.dashboard.periodLast30')}
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      }
    >
      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-gray-500">{t(`coreHr.dashboard.metrics.${metric.key}`)}</p>
              <MetricIcon kind={metric.icon} />
            </div>
            <div className="mt-3 flex items-end gap-2">
              <p className="text-3xl font-bold text-dark-text tabular-nums">{metric.value}</p>
              {metric.delta ? (
                <span className="mb-1 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                  {metric.delta}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 mb-6">
        <div className="xl:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-dark-text mb-2">
            {t('coreHr.dashboard.evolutionTitle')}
          </h2>
          <HrHeadcountTrendChart points={hrHeadcountTrend} />
        </div>
        <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-dark-text mb-4">
            {t('coreHr.dashboard.byAreaTitle')}
          </h2>
          <HrAreaDonutChart
            slices={areaSlices}
            centerValue={String(m.activeEmployees.value)}
            centerLabel={t('coreHr.dashboard.byAreaCenter')}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-dark-text mb-4">
            {t('coreHr.dashboard.processesTitle')}
          </h2>
          <ul className="space-y-2">
            {hrProcesses.map((proc) => (
              <li key={proc.key}>
                <button
                  type="button"
                  className="w-full flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-dark-text">
                      {t(`coreHr.dashboard.processes.${proc.key}.title`)}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {t(`coreHr.dashboard.processes.${proc.key}.meta`, { count: proc.count })}
                    </span>
                  </span>
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-dark-text mb-4">
            {t('coreHr.dashboard.eventsTitle')}
          </h2>
          <ol className="relative space-y-5 border-l border-gray-200 ml-2 pl-5">
            {hrUpcomingEvents.map((event) => (
              <li key={event.key} className="relative">
                <span
                  className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-white ${
                    event.celebrate ? 'bg-amber-400' : 'bg-primary'
                  }`}
                />
                <p className="text-xs font-semibold text-gray-400">
                  {t(`coreHr.dashboard.events.dates.${event.dateKey}`)}
                </p>
                <p className="mt-0.5 text-sm text-dark-text flex items-center gap-1.5">
                  {t(`coreHr.dashboard.events.${event.key}`)}
                  {event.celebrate ? <span aria-hidden>🎂</span> : null}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <CoreHrDashboardAiAgentsCard />
      </div>
    </CoreHrPageShell>
  );
}

import { useTranslation } from 'react-i18next';
import type { QuickReport, ReportsTab } from '../../models/hrReports';

type Props = {
  reports: QuickReport[];
  onSelect: (report: QuickReport) => void;
  onOpenTab: (tab: ReportsTab) => void;
  availableTabs: ReportsTab[];
};

const FALLBACK_TABS: ReportsTab[] = ['workforce', 'onboarding', 'offboarding', 'organization', 'documents'];

export default function QuickReportsPanel({ reports, onSelect, onOpenTab, availableTabs }: Props) {
  const { t } = useTranslation();
  const fallback = FALLBACK_TABS.filter((tab) => availableTabs.includes(tab));
  return (
    <ul className="space-y-1.5">
      {reports.length > 0
        ? reports.map((r) => (
            <li key={r.key || r.name}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 group-hover:bg-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-dark-text">{r.name}</span>
                  {r.category ? <span className="block truncate text-[11px] text-gray-400">{r.category}</span> : null}
                </span>
                <svg className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </li>
          ))
        : fallback.map((tab) => (
            <li key={tab}>
              <button
                type="button"
                onClick={() => onOpenTab(tab)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-dark-text transition-colors hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {t(`coreHr.reports.tabs.${tab}`)}
                <svg className="h-4 w-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </li>
          ))}
      <li>
        <button
          type="button"
          onClick={() => onOpenTab('library')}
          className="mt-1 w-full rounded-xl border border-dashed border-violet-200 px-3 py-2 text-center text-sm font-medium text-violet-700 hover:bg-violet-50"
        >
          {t('coreHr.reports.overview.browseLibrary')}
        </button>
      </li>
    </ul>
  );
}

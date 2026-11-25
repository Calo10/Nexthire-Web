import { useTranslation } from 'react-i18next';
import { REPORTS_TABS, type ReportsTab } from '../../models/hrReports';

type Props = {
  value: ReportsTab;
  onChange: (tab: ReportsTab) => void;
  /** Tabs to hide (e.g. when the user lacks a permission). */
  hidden?: ReportsTab[];
};

const WORKSPACE_TABS: ReportsTab[] = ['library', 'builder', 'dashboards', 'schedules'];

export default function ReportsTabBar({ value, onChange, hidden = [] }: Props) {
  const { t } = useTranslation();
  const tabs = REPORTS_TABS.filter((tab) => !hidden.includes(tab));
  return (
    <div role="tablist" aria-label={t('coreHr.reports.tabs.label')} className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map((tab, i) => {
        const active = tab === value;
        const startsWorkspace = WORKSPACE_TABS.includes(tab) && i > 0 && !WORKSPACE_TABS.includes(tabs[i - 1]);
        return (
          <div key={tab} className="flex shrink-0 items-center">
            {startsWorkspace ? <span aria-hidden className="mx-2 h-5 w-px bg-gray-200" /> : null}
            <button
              id={`reports-tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`reports-panel-${tab}`}
              onClick={() => onChange(tab)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                active ? 'border-violet-600 text-violet-800' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-dark-text'
              }`}
            >
              {t(`coreHr.reports.tabs.${tab}`)}
            </button>
          </div>
        );
      })}
    </div>
  );
}

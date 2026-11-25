import { useTranslation } from 'react-i18next';
import { ORG_TABS, type OrgTab } from '../../models/organization';

type Props = {
  value: OrgTab;
  onChange: (tab: OrgTab) => void;
  /** Tabs to hide (e.g. when the user lacks a permission). */
  hidden?: OrgTab[];
};

export default function OrgWorkspaceTabs({ value, onChange, hidden = [] }: Props) {
  const { t } = useTranslation();
  const tabs = ORG_TABS.filter((tab) => !hidden.includes(tab));
  return (
    <div role="tablist" aria-label={t('coreHr.organization.tabs.label')} className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map((tab) => {
        const active = tab === value;
        return (
          <button
            key={tab}
            id={`org-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={`org-panel-${tab}`}
            onClick={() => onChange(tab)}
            className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
              active ? 'border-teal-600 text-teal-800' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-dark-text'
            }`}
          >
            {t(`coreHr.organization.tabs.${tab}`)}
          </button>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import OrganizationBrandingSection from '../../components/settings/OrganizationBrandingSection';
import OrganizationSettingsSection from '../../components/settings/OrganizationSettingsSection';

type OrgTabId = 'branding' | 'orgSettings';

export default function ProfileSettingsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<OrgTabId>('branding');

  const tabs: { id: OrgTabId; label: string }[] = [
    { id: 'branding', label: t('settings.branding.title') },
    { id: 'orgSettings', label: t('settings.orgSettings.title') },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-dark-text mb-2">{t('settings.profile.title')}</h2>
          <p className="text-gray-600 text-sm">{t('settings.profile.description')}</p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setTab(x.id)}
              className={`px-4 py-2.5 rounded-t-lg text-sm font-medium border-b-2 transition-colors ${
                tab === x.id
                  ? 'border-primary text-primary bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </Card>

      {tab === 'branding' ? <OrganizationBrandingSection /> : <OrganizationSettingsSection />}
    </div>
  );
}

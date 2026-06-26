import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';
import OrganizationBrandingSection from '../../components/settings/OrganizationBrandingSection';

export default function ProfileSettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-2">
          <h2 className="text-xl font-semibold text-dark-text mb-2">{t('settings.profile.title')}</h2>
          <p className="text-gray-600 text-sm">{t('settings.profile.description')}</p>
        </div>
      </Card>

      <OrganizationBrandingSection />
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import Card from '../../components/Card';

export default function ProfileSettingsPage() {
  const { t } = useTranslation();
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-dark-text mb-2">{t('settings.profile.title')}</h2>
        <p className="text-gray-600 text-sm">
          {t('settings.profile.description')}
        </p>
      </div>
      <p className="text-gray-500">{t('settings.profile.comingSoon')}</p>
    </Card>
  );
}

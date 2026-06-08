import { useTranslation } from 'react-i18next';

export default function DashboardLoading() {
  const { t } = useTranslation();

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600">{t('dashboard.loading')}</p>
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';

export default function CoreHrSettingsPage() {
  const { t } = useTranslation();
  return (
    <CoreHrPageShell title={t('coreHr.settings.title')} subtitle={t('coreHr.settings.subtitle')}>
      <CoreHrEmptyState
        title={t('coreHr.settings.emptyTitle')}
        description={t('coreHr.settings.emptyDescription')}
      />
    </CoreHrPageShell>
  );
}

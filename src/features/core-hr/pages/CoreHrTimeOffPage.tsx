import { useTranslation } from 'react-i18next';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';

export default function CoreHrTimeOffPage() {
  const { t } = useTranslation();
  return (
    <CoreHrPageShell title={t('coreHr.timeOff.title')} subtitle={t('coreHr.timeOff.subtitle')}>
      <CoreHrEmptyState
        title={t('coreHr.timeOff.emptyTitle')}
        description={t('coreHr.timeOff.emptyDescription')}
      />
    </CoreHrPageShell>
  );
}

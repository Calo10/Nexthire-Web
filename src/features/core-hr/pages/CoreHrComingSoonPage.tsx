import { useTranslation } from 'react-i18next';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';

type Props = {
  /** Key under `coreHrNav.*` (e.g. `onboarding`). */
  navKey: 'onboarding' | 'offboarding' | 'reports';
};

/** Placeholder for Core HR areas that are not built yet (reachable only by direct URL; nav items are disabled). */
export default function CoreHrComingSoonPage({ navKey }: Props) {
  const { t } = useTranslation();
  const title = t(`coreHrNav.${navKey}`);
  return (
    <CoreHrPageShell title={title} subtitle={t('coreHr.comingSoon.subtitle')}>
      <CoreHrEmptyState title={t('coreHr.comingSoon.title', { name: title })} description={t('coreHr.comingSoon.description')} />
    </CoreHrPageShell>
  );
}

import { useTranslation } from 'react-i18next';
import Badge from '../../../../components/ui/Badge';
import { onboardingStatusTone } from '../../utils/onboardingFormat';

export default function OnboardingStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge tone={onboardingStatusTone(status)} dot>
      {t(`coreHr.onboarding.status.${status}`, { defaultValue: status })}
    </Badge>
  );
}

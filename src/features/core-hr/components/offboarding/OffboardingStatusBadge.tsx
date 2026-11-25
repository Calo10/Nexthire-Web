import { useTranslation } from 'react-i18next';
import Badge from '../../../../components/ui/Badge';
import { offboardingStatusTone } from '../../utils/offboardingFormat';

export default function OffboardingStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge tone={offboardingStatusTone(status)} dot>
      {t(`coreHr.offboarding.status.${status}`, { defaultValue: status })}
    </Badge>
  );
}

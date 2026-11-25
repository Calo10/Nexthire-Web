import { useTranslation } from 'react-i18next';
import Badge from '../../../components/ui/Badge';
import { statusTone } from '../utils/employeeFormat';

type Props = {
  status?: string | null;
  archived?: boolean;
  className?: string;
};

/** Active=green, Onboarding=blue, Pending=yellow, OnLeave=purple, Inactive=gray, Terminated=red. */
export default function EmployeeStatusBadge({ status, archived = false, className }: Props) {
  const { t } = useTranslation();
  if (archived) {
    return (
      <Badge tone="gray" dot className={className}>
        {t('coreHr.employees.archived')}
      </Badge>
    );
  }
  const label = status ? t(`coreHr.employees.status.${status}`, { defaultValue: status }) : '—';
  return (
    <Badge tone={statusTone(status)} dot className={className}>
      {label}
    </Badge>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import { offboardingsApi } from '../../api/offboardingsApi';
import type { OffboardingCapabilities } from '../../hooks/useOffboardingCapabilities';
import { useOffboardingLookups } from '../../hooks/useOffboardingLookups';
import type { EmployeeListItem } from '../../models/employee';
import { OFFBOARDING_PERMISSIONS, type OffboardingListItem } from '../../models/offboarding';
import { apiErrorMessage, employeeName, formatDate } from '../../utils/employeeFormat';
import { isActiveOffboarding } from '../../utils/offboardingFormat';
import NewOffboardingWizard, { type OffboardingWizardEmployee } from './NewOffboardingWizard';
import OffboardingProgressBar from './OffboardingProgressBar';
import OffboardingStatusBadge from './OffboardingStatusBadge';

type Props = {
  employee: Pick<
    EmployeeListItem,
    'id' | 'employeeNumber' | 'firstName' | 'lastName' | 'preferredName' | 'displayName' | 'jobTitle' | 'jobTitleId' | 'department' | 'departmentId' | 'profilePictureUrl' | 'employmentStatus'
  >;
  caps: OffboardingCapabilities;
  locale: string;
  /** Archived employees cannot start a new offboarding. */
  disabled?: boolean;
  onStarted?: () => void;
};

/** Offboarding history for one employee, with a shortcut to start one when none is active. */
export default function EmployeeOffboardingPanel({ employee, caps, locale, disabled = false, onStarted }: Props) {
  const { t } = useTranslation();
  const lookups = useOffboardingLookups(!caps.denied);
  const [items, setItems] = useState<OffboardingListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const name = employeeName(employee);
  const canCreate = caps.can(OFFBOARDING_PERMISSIONS.Create);
  const canManageTasks = caps.can(OFFBOARDING_PERMISSIONS.ManageTasks);
  const canViewConfidential = caps.has(OFFBOARDING_PERMISSIONS.ViewConfidentialInformation);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await offboardingsApi.list({
        search: employee.employeeNumber || name || undefined,
        pageSize: 50,
        sort: 'created',
        dir: 'desc',
      });
      setItems(res.items.filter((o) => o.employeeId === employee.id));
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.offboarding.employeeTab.loadError')));
    }
  }, [employee.id, employee.employeeNumber, name, t]);

  useEffect(() => {
    setItems(null);
    void load();
  }, [load]);

  const wizardEmployee = useMemo<OffboardingWizardEmployee>(
    () => ({
      id: employee.id,
      name,
      jobTitle: employee.jobTitle,
      jobTitleId: employee.jobTitleId,
      department: employee.department,
      departmentId: employee.departmentId,
      profilePictureUrl: employee.profilePictureUrl,
    }),
    [employee.id, employee.jobTitle, employee.jobTitleId, employee.department, employee.departmentId, employee.profilePictureUrl, name],
  );

  if (error) {
    return (
      <div className="space-y-3">
        <ErrorMessage message={error} />
        <Button variant="outline" size="sm" onClick={() => void load()}>
          {t('coreHr.offboarding.retry')}
        </Button>
      </div>
    );
  }
  if (!items) return <div className="h-24 animate-pulse rounded-lg bg-gray-100" />;

  const hasActive = items.some((o) => isActiveOffboarding(o.status));
  const alreadySeparated = employee.employmentStatus === 'Terminated';

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
          <p className="text-sm text-gray-500">{t('coreHr.offboarding.employeeTab.empty')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((o) => (
            <li key={o.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <OffboardingStatusBadge status={o.status} />
                  <span className="text-sm font-medium text-dark-text">
                    {t(`coreHr.offboarding.separationType.${o.separationType}`, { defaultValue: o.separationType })}
                  </span>
                  {o.templateName ? <span className="text-xs text-gray-500">· {o.templateName}</span> : null}
                </div>
                <Link to={`/app/hr/offboarding?open=${o.id}`} className="text-sm font-medium text-teal-700 hover:text-teal-900">
                  {t('coreHr.offboarding.employeeTab.open')} →
                </Link>
              </div>
              <OffboardingProgressBar percent={o.progressPercent} className="mt-3" />
              <p className="mt-2 text-xs text-gray-500">
                {t('coreHr.offboarding.table.tasksCount', { done: o.completedTasks, total: o.totalTasks })}
                {' · '}
                {t('coreHr.offboarding.form.lastWorkingDay')}: {formatDate(o.lastWorkingDay, locale)}
                {o.overdueCount > 0 ? (
                  <span className="ml-2 font-medium text-red-600">{t('coreHr.offboarding.card.overdue', { count: o.overdueCount })}</span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
      {canCreate && !hasActive && !disabled && !alreadySeparated ? (
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          {t('coreHr.offboarding.employeeTab.start')}
        </Button>
      ) : null}

      <NewOffboardingWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        lookups={lookups}
        preselectedEmployee={wizardEmployee}
        canManageTasks={canManageTasks}
        canManageAssets={caps.can(OFFBOARDING_PERMISSIONS.ManageAssets)}
        canViewConfidential={canViewConfidential}
        onCreated={() => {
          setWizardOpen(false);
          void load();
          onStarted?.();
        }}
      />
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import { onboardingsApi } from '../../api/onboardingsApi';
import type { OnboardingListItem } from '../../models/onboarding';
import { apiErrorMessage, formatDate } from '../../utils/employeeFormat';
import { isActiveOnboarding } from '../../utils/onboardingFormat';
import OnboardingProgressBar from './OnboardingProgressBar';
import OnboardingStatusBadge from './OnboardingStatusBadge';

type Props = {
  employeeId: string;
  /** Used to narrow the server-side search (the list endpoint has no employee filter). */
  employeeNumber: string;
  employeeName: string;
  locale: string;
  canCreate: boolean;
  /** Archived employees cannot start a new onboarding. */
  disabled?: boolean;
  onStarted?: () => void;
};

/** Onboarding history for one employee, with a shortcut to start one when none is active. */
export default function EmployeeOnboardingPanel({
  employeeId,
  employeeNumber,
  employeeName,
  locale,
  canCreate,
  disabled = false,
  onStarted,
}: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<OnboardingListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await onboardingsApi.list({
        search: employeeNumber || employeeName || undefined,
        pageSize: 50,
        sort: 'created',
        dir: 'desc',
      });
      setItems(res.items.filter((o) => o.employeeId === employeeId));
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.onboarding.employeeTab.loadError')));
    }
  }, [employeeId, employeeNumber, employeeName, t]);

  useEffect(() => {
    setItems(null);
    void load();
  }, [load]);

  const start = async () => {
    setStarting(true);
    setStartError(null);
    try {
      await onboardingsApi.startForEmployee(employeeId);
      await load();
      onStarted?.();
    } catch (err) {
      setStartError(apiErrorMessage(err, t('coreHr.onboarding.employeeTab.startError')));
    } finally {
      setStarting(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-3">
        <ErrorMessage message={error} />
        <Button variant="outline" size="sm" onClick={() => void load()}>
          {t('coreHr.onboarding.retry')}
        </Button>
      </div>
    );
  }
  if (!items) return <div className="h-24 animate-pulse rounded-lg bg-gray-100" />;

  const hasActive = items.some((o) => isActiveOnboarding(o.status));

  return (
    <div className="space-y-4">
      {startError ? <ErrorMessage message={startError} /> : null}
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center">
          <p className="text-sm text-gray-500">{t('coreHr.onboarding.employeeTab.empty')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((o) => (
            <li key={o.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <OnboardingStatusBadge status={o.status} />
                  <span className="text-sm font-medium text-dark-text">{o.templateName || t('coreHr.onboarding.employeeTab.noTemplate')}</span>
                </div>
                <Link
                  to={`/app/hr/onboarding?open=${o.id}`}
                  className="text-sm font-medium text-teal-700 hover:text-teal-900"
                >
                  {t('coreHr.onboarding.employeeTab.open')} →
                </Link>
              </div>
              <OnboardingProgressBar percent={o.progressPercent} className="mt-3" />
              <p className="mt-2 text-xs text-gray-500">
                {t('coreHr.onboarding.table.tasksCount', { done: o.completedTasks, total: o.totalTasks })}
                {' · '}
                {t('coreHr.onboarding.form.startDate')}: {formatDate(o.startDate, locale)}
                {o.overdueCount > 0 ? (
                  <span className="ml-2 font-medium text-red-600">{t('coreHr.onboarding.card.overdue', { count: o.overdueCount })}</span>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      )}
      {canCreate && !hasActive && !disabled ? (
        <Button size="sm" disabled={starting} onClick={() => void start()}>
          {starting ? t('common.loading') : t('coreHr.onboarding.employeeTab.start')}
        </Button>
      ) : null}
    </div>
  );
}

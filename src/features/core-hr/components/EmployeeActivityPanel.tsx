import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorMessage from '../../../components/ErrorMessage';
import { employeesApi } from '../api/employeesApi';
import type { EmployeeActivity } from '../models/employee';
import { apiErrorMessage, formatDateTime } from '../utils/employeeFormat';

type Props = {
  employeeId: string;
  locale: string;
  /** Bump to force a reload (e.g. after a status change). */
  refreshKey?: number;
  limit?: number;
};

export default function EmployeeActivityPanel({ employeeId, locale, refreshKey = 0, limit = 50 }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    employeesApi
      .activity(employeeId, limit)
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, t('coreHr.employees.activity.loadError')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId, limit, refreshKey, t]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }
  if (error) return <ErrorMessage message={error} />;
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
        {t('coreHr.employees.activity.empty')}
      </p>
    );
  }

  return (
    <ol className="relative space-y-5 border-l border-gray-200 pl-5">
      {items.map((a) => (
        <li key={a.id} className="relative">
          <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal-500 ring-1 ring-teal-200" />
          <p className="text-sm text-dark-text">{a.summary}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {formatDateTime(a.createdAt, locale)}
            {a.createdByName ? ` · ${a.createdByName}` : ''}
          </p>
        </li>
      ))}
    </ol>
  );
}

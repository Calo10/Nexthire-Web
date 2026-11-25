import { useTranslation } from 'react-i18next';
import EmployeeAvatar from '../EmployeeAvatar';
import type { OnboardingListItem, OnboardingSortKey } from '../../models/onboarding';
import { formatDate } from '../../utils/employeeFormat';
import OnboardingProgressBar from './OnboardingProgressBar';
import OnboardingStatusBadge from './OnboardingStatusBadge';

type Props = {
  items: OnboardingListItem[];
  loading: boolean;
  pageSize: number;
  sort: OnboardingSortKey;
  dir: 'asc' | 'desc';
  onSort: (key: OnboardingSortKey) => void;
  selectedId: string | null;
  onOpen: (item: OnboardingListItem) => void;
};

function SortHeader({
  label,
  sortKey,
  sort,
  dir,
  onSort,
}: {
  label: string;
  sortKey?: OnboardingSortKey;
  sort: OnboardingSortKey;
  dir: 'asc' | 'desc';
  onSort: (key: OnboardingSortKey) => void;
}) {
  const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500';
  if (!sortKey) return <th className={th}>{label}</th>;
  const active = sort === sortKey;
  return (
    <th className={th} aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 uppercase hover:text-dark-text">
        {label}
        <span aria-hidden className={active ? 'text-teal-700' : 'text-gray-300'}>
          {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

export default function OnboardingListTable({ items, loading, pageSize, sort, dir, onSort, selectedId, onOpen }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const head = { sort, dir, onSort };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <SortHeader label={t('coreHr.onboarding.table.employee')} sortKey="employee" {...head} />
            <SortHeader label={t('coreHr.onboarding.table.template')} {...head} />
            <SortHeader label={t('coreHr.onboarding.table.owner')} {...head} />
            <SortHeader label={t('coreHr.onboarding.table.startDate')} sortKey="startDate" {...head} />
            <SortHeader label={t('coreHr.onboarding.table.expected')} sortKey="expectedCompletion" {...head} />
            <SortHeader label={t('coreHr.onboarding.table.progress')} {...head} />
            <SortHeader label={t('coreHr.onboarding.table.status')} sortKey="status" {...head} />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {loading && items.length === 0
            ? Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-4">
                    <div className="h-8 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))
            : items.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => onOpen(o)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedId === o.id ? 'bg-teal-50/50' : ''} ${
                    loading ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <EmployeeAvatar name={o.employeeName} seed={o.employeeId} url={o.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-dark-text">{o.employeeName}</p>
                        <p className="truncate text-xs text-gray-500">{o.jobTitle || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.templateName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.ownerName || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{formatDate(o.startDate, locale)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {formatDate(o.expectedCompletionDate, locale)}
                  </td>
                  <td className="min-w-[160px] px-4 py-3">
                    <OnboardingProgressBar percent={o.progressPercent} />
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        {t('coreHr.onboarding.table.tasksCount', { done: o.completedTasks, total: o.totalTasks })}
                      </span>
                      {o.overdueCount > 0 ? (
                        <span className="font-medium text-red-600">
                          {t('coreHr.onboarding.card.overdue', { count: o.overdueCount })}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <OnboardingStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

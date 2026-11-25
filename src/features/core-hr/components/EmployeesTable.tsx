import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { EmployeeListItem, EmployeeSortKey, SortDirection } from '../models/employee';
import { employeeName } from '../utils/employeeFormat';
import EmployeeAvatar from './EmployeeAvatar';
import EmployeeStatusBadge from './EmployeeStatusBadge';
import RowActionsMenu, { type RowMenuItem } from './RowActionsMenu';

type Column = {
  key: string;
  label: string;
  sortKey?: EmployeeSortKey;
  className?: string;
};

export type RowActionHandlers = {
  onView: (e: EmployeeListItem) => void;
  onEdit: (e: EmployeeListItem) => void;
  onChangeStatus: (e: EmployeeListItem) => void;
  onDocuments: (e: EmployeeListItem) => void;
  onArchive: (e: EmployeeListItem) => void;
  onRestore: (e: EmployeeListItem) => void;
};

type Props = {
  items: EmployeeListItem[];
  loading: boolean;
  pageSize: number;
  sort: EmployeeSortKey;
  dir: SortDirection;
  onSort: (key: EmployeeSortKey) => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  canEdit: boolean;
  canArchive: boolean;
  actions: RowActionHandlers;
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDirection }) {
  return (
    <span aria-hidden className={`ml-1 inline-block text-[10px] ${active ? 'text-teal-700' : 'text-gray-300'}`}>
      {active ? (dir === 'asc' ? '▲' : '▼') : '↕'}
    </span>
  );
}

export default function EmployeesTable({
  items,
  loading,
  pageSize,
  sort,
  dir,
  onSort,
  selected,
  onToggle,
  onToggleAll,
  canEdit,
  canArchive,
  actions,
}: Props) {
  const { t } = useTranslation();
  const allRef = useRef<HTMLInputElement>(null);
  const selectedOnPage = items.filter((i) => selected.has(i.id)).length;
  const allSelected = items.length > 0 && selectedOnPage === items.length;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = selectedOnPage > 0 && !allSelected;
  }, [selectedOnPage, allSelected]);

  const columns: Column[] = [
    { key: 'name', label: t('coreHr.employees.table.name'), sortKey: 'name' },
    { key: 'email', label: t('coreHr.employees.table.workEmail'), className: 'hidden xl:table-cell' },
    { key: 'number', label: t('coreHr.employees.table.employeeNumber'), sortKey: 'employeeNumber', className: 'hidden lg:table-cell' },
    { key: 'title', label: t('coreHr.employees.table.jobTitle'), sortKey: 'jobTitle' },
    { key: 'dept', label: t('coreHr.employees.table.department'), sortKey: 'department', className: 'hidden md:table-cell' },
    { key: 'loc', label: t('coreHr.employees.table.location'), className: 'hidden xl:table-cell' },
    { key: 'status', label: t('coreHr.employees.table.status'), sortKey: 'status' },
  ];

  const hasSelection = canEdit || canArchive;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-10 px-4 py-3">
              {hasSelection ? (
                <input
                  ref={allRef}
                  type="checkbox"
                  aria-label={t('coreHr.employees.table.selectAll')}
                  checked={allSelected}
                  disabled={items.length === 0 || loading}
                  onChange={(e) => onToggleAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
              ) : null}
            </th>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                aria-sort={c.sortKey && sort === c.sortKey ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
                className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 ${c.className ?? ''}`}
              >
                {c.sortKey ? (
                  <button
                    type="button"
                    onClick={() => onSort(c.sortKey!)}
                    className="inline-flex items-center uppercase tracking-wide hover:text-gray-800 focus:outline-none focus-visible:underline"
                  >
                    {c.label}
                    <SortIcon active={sort === c.sortKey} dir={dir} />
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
            <th className="w-12 px-4 py-3">
              <span className="sr-only">{t('coreHr.employees.table.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {loading
            ? Array.from({ length: Math.min(pageSize, 8) }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td className="px-4 py-4">
                    <div className="h-4 w-4 animate-pulse rounded bg-gray-100" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                    </div>
                  </td>
                  {columns.slice(1).map((c) => (
                    <td key={c.key} className={`px-4 py-4 ${c.className ?? ''}`}>
                      <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                    </td>
                  ))}
                  <td className="px-4 py-4" />
                </tr>
              ))
            : items.map((e) => {
                const name = employeeName(e);
                const isSelected = selected.has(e.id);
                const menu: RowMenuItem[] = [
                  { key: 'view', label: t('coreHr.employees.actions.view'), onClick: () => actions.onView(e) },
                  {
                    key: 'edit',
                    label: t('coreHr.employees.actions.edit'),
                    onClick: () => actions.onEdit(e),
                    hidden: !canEdit || e.isArchived,
                  },
                  {
                    key: 'email',
                    label: t('coreHr.employees.actions.email'),
                    href: e.workEmail ? `mailto:${e.workEmail}` : undefined,
                    disabled: !e.workEmail,
                  },
                  {
                    key: 'status',
                    label: t('coreHr.employees.actions.changeStatus'),
                    onClick: () => actions.onChangeStatus(e),
                    hidden: !canEdit || e.isArchived,
                  },
                  {
                    key: 'docs',
                    label: t('coreHr.employees.actions.documents'),
                    onClick: () => actions.onDocuments(e),
                  },
                  {
                    key: 'archive',
                    label: t('coreHr.employees.actions.archive'),
                    onClick: () => actions.onArchive(e),
                    hidden: !canArchive || e.isArchived,
                    danger: true,
                    dividerBefore: true,
                  },
                  {
                    key: 'restore',
                    label: t('coreHr.employees.actions.restore'),
                    onClick: () => actions.onRestore(e),
                    hidden: !canArchive || !e.isArchived,
                    dividerBefore: true,
                  },
                ];
                return (
                  <tr
                    key={e.id}
                    onClick={() => actions.onView(e)}
                    className={`cursor-pointer transition-colors hover:bg-teal-50/40 ${isSelected ? 'bg-teal-50/60' : ''} ${
                      e.isArchived ? 'opacity-70' : ''
                    }`}
                  >
                    <td className="px-4 py-3" onClick={(ev) => ev.stopPropagation()}>
                      {hasSelection ? (
                        <input
                          type="checkbox"
                          aria-label={t('coreHr.employees.table.selectRow', { name })}
                          checked={isSelected}
                          disabled={e.isArchived}
                          onChange={() => onToggle(e.id)}
                          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 disabled:opacity-40"
                        />
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <EmployeeAvatar name={name} seed={e.id} url={e.profilePictureUrl} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-dark-text">{name}</p>
                          <p className="truncate text-xs text-gray-500 xl:hidden">{e.workEmail || e.employeeNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden max-w-[220px] truncate px-4 py-3 text-sm text-gray-600 xl:table-cell">
                      {e.workEmail || '—'}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-gray-600 lg:table-cell">
                      {e.employeeNumber || '—'}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-sm text-gray-700">{e.jobTitle || '—'}</td>
                    <td className="hidden max-w-[160px] truncate px-4 py-3 text-sm text-gray-600 md:table-cell">
                      {e.department || '—'}
                    </td>
                    <td className="hidden max-w-[160px] truncate px-4 py-3 text-sm text-gray-600 xl:table-cell">
                      {e.location || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <EmployeeStatusBadge status={e.employmentStatus} />
                        {e.isArchived ? <EmployeeStatusBadge archived /> : null}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right" onClick={(ev) => ev.stopPropagation()}>
                      <RowActionsMenu items={menu} ariaLabel={t('coreHr.employees.table.rowActions', { name })} />
                    </td>
                  </tr>
                );
              })}
        </tbody>
      </table>
    </div>
  );
}

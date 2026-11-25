import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { HrDocumentListItem } from '../../models/hrDocument';
import { formatDate } from '../../utils/employeeFormat';
import { formatFileSize } from '../../utils/hrDocumentFormat';
import EmployeeAvatar from '../EmployeeAvatar';
import RowActionsMenu from '../RowActionsMenu';
import HrDocumentStatusBadge, { HrDocumentTypeBadge } from './HrDocumentStatusBadge';

type Props = {
  items: HrDocumentListItem[];
  loading: boolean;
  pageSize: number;
  locale: string;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  canArchive: boolean;
  onOpen: (doc: HrDocumentListItem) => void;
  onDownload: (doc: HrDocumentListItem) => void;
  onArchive: (doc: HrDocumentListItem) => void;
  activeId?: string | null;
  /** Hides the employee column (used inside grouped By Employee rows). */
  hideEmployee?: boolean;
};

export function DocumentRows({
  items,
  locale,
  selected,
  onToggle,
  canArchive,
  onOpen,
  onDownload,
  onArchive,
  activeId,
  hideEmployee,
}: Omit<Props, 'loading' | 'pageSize' | 'onToggleAll'>) {
  const { t } = useTranslation();
  return (
    <>
      {items.map((d) => (
        <tr
          key={d.id}
          onClick={() => onOpen(d)}
          className={`cursor-pointer transition-colors hover:bg-gray-50 ${activeId === d.id ? 'bg-teal-50/50' : ''}`}
        >
          <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected.has(d.id)}
              onChange={() => onToggle(d.id)}
              aria-label={t('coreHr.documentsHub.table.select', { name: d.name })}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-dark-text">{d.name}</p>
                {d.fileSizeBytes ? <p className="text-xs text-gray-500">{formatFileSize(d.fileSizeBytes)}</p> : null}
              </div>
            </div>
          </td>
          {hideEmployee ? null : (
            <td className="hidden px-4 py-3 md:table-cell">
              <div className="flex items-center gap-3">
                <EmployeeAvatar name={d.employeeName || '?'} seed={d.employeeId} url={d.employeeAvatarUrl} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-dark-text">{d.employeeName}</p>
                  <p className="truncate text-xs text-gray-500">{d.employeeJobTitle ?? '—'}</p>
                </div>
              </div>
            </td>
          )}
          <td className="hidden px-4 py-3 lg:table-cell">
            <HrDocumentTypeBadge category={d.category} />
          </td>
          <td className="hidden px-4 py-3 text-sm text-gray-600 lg:table-cell">{formatDate(d.expiresAt, locale)}</td>
          <td className="px-4 py-3">
            <HrDocumentStatusBadge doc={d} />
          </td>
          <td className="w-12 px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
            <RowActionsMenu
              ariaLabel={t('coreHr.documentsHub.table.actionsFor', { name: d.name })}
              items={[
                { key: 'view', label: t('coreHr.documentsHub.actions.view'), onClick: () => onOpen(d) },
                {
                  key: 'download',
                  label: t('coreHr.documentsHub.actions.download'),
                  onClick: () => onDownload(d),
                  disabled: !d.documentId && !d.externalUrl,
                },
                {
                  key: 'archive',
                  label: t('coreHr.documentsHub.actions.archive'),
                  danger: true,
                  dividerBefore: true,
                  hidden: !canArchive,
                  onClick: () => onArchive(d),
                },
              ]}
            />
          </td>
        </tr>
      ))}
    </>
  );
}

export default function HrDocumentsTable(props: Props) {
  const { t } = useTranslation();
  const { items, loading, pageSize, selected, onToggleAll } = props;
  const allRef = useRef<HTMLInputElement>(null);
  const selectedOnPage = items.filter((i) => selected.has(i.id)).length;
  const allSelected = items.length > 0 && selectedOnPage === items.length;

  useEffect(() => {
    if (allRef.current) allRef.current.indeterminate = selectedOnPage > 0 && !allSelected;
  }, [selectedOnPage, allSelected]);

  const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500';
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                ref={allRef}
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
                aria-label={t('coreHr.documentsHub.table.selectAll')}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
            </th>
            <th className={th}>{t('coreHr.documentsHub.table.document')}</th>
            <th className={`${th} hidden md:table-cell`}>{t('coreHr.documentsHub.table.employee')}</th>
            <th className={`${th} hidden lg:table-cell`}>{t('coreHr.documentsHub.table.type')}</th>
            <th className={`${th} hidden lg:table-cell`}>{t('coreHr.documentsHub.table.expiration')}</th>
            <th className={th}>{t('coreHr.documentsHub.table.status')}</th>
            <th className="w-12 px-2 py-3">
              <span className="sr-only">{t('coreHr.employees.table.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {loading && items.length === 0
            ? Array.from({ length: Math.min(pageSize, 8) }, (_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-9 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))
            : <DocumentRows {...props} />}
        </tbody>
      </table>
    </div>
  );
}

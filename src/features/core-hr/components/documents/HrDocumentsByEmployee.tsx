import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { HrDocumentListItem } from '../../models/hrDocument';
import { resolveDocumentStatus } from '../../utils/hrDocumentFormat';
import EmployeeAvatar from '../EmployeeAvatar';
import { DocumentRows } from './HrDocumentsTable';

type Props = {
  items: HrDocumentListItem[];
  loading: boolean;
  locale: string;
  selected: Set<string>;
  onToggle: (id: string) => void;
  canArchive: boolean;
  canUpload: boolean;
  onOpen: (doc: HrDocumentListItem) => void;
  onDownload: (doc: HrDocumentListItem) => void;
  onArchive: (doc: HrDocumentListItem) => void;
  onUploadFor: (employeeId: string) => void;
  activeId?: string | null;
};

type Group = {
  employeeId: string;
  name: string;
  jobTitle?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  docs: HrDocumentListItem[];
};

/** Groups the current result set by employee (the server list is already filtered/paged). */
export default function HrDocumentsByEmployee({
  items,
  loading,
  locale,
  selected,
  onToggle,
  canArchive,
  canUpload,
  onOpen,
  onDownload,
  onArchive,
  onUploadFor,
  activeId,
}: Props) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const d of items) {
      const g = map.get(d.employeeId) ?? {
        employeeId: d.employeeId,
        name: d.employeeName,
        jobTitle: d.employeeJobTitle,
        department: d.employeeDepartment,
        avatarUrl: d.employeeAvatarUrl,
        docs: [],
      };
      g.docs.push(d);
      map.set(d.employeeId, g);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  if (loading && items.length === 0) {
    return (
      <div className="space-y-2 p-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {groups.map((g) => {
        const open = !collapsed.has(g.employeeId);
        const attention = g.docs.filter((d) => {
          const s = resolveDocumentStatus(d);
          return s === 'Expired' || s === 'Expiring';
        }).length;
        return (
          <li key={g.employeeId}>
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                type="button"
                aria-expanded={open}
                onClick={() =>
                  setCollapsed((prev) => {
                    const next = new Set(prev);
                    if (next.has(g.employeeId)) next.delete(g.employeeId);
                    else next.add(g.employeeId);
                    return next;
                  })
                }
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <EmployeeAvatar name={g.name || '?'} seed={g.employeeId} url={g.avatarUrl} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dark-text">{g.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {[g.jobTitle, g.department].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
              </button>
              <div className="flex shrink-0 items-center gap-3 text-xs">
                <span className="text-gray-500">{t('coreHr.documentsHub.byEmployee.count', { count: g.docs.length })}</span>
                {attention > 0 ? (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                    {t('coreHr.documentsHub.byEmployee.attention', { count: attention })}
                  </span>
                ) : null}
                {canUpload ? (
                  <button
                    type="button"
                    onClick={() => onUploadFor(g.employeeId)}
                    className="font-medium text-teal-700 hover:text-teal-800"
                  >
                    {t('coreHr.documentsHub.byEmployee.addDocument')}
                  </button>
                ) : null}
                <Link to={`/app/hr/employees/${g.employeeId}`} className="font-medium text-gray-600 hover:text-teal-700">
                  {t('coreHr.documentsHub.byEmployee.profile')}
                </Link>
              </div>
            </div>
            {open ? (
              <div className="overflow-x-auto bg-gray-50/40">
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-100">
                    <DocumentRows
                      items={g.docs}
                      locale={locale}
                      selected={selected}
                      onToggle={onToggle}
                      canArchive={canArchive}
                      onOpen={onOpen}
                      onDownload={onDownload}
                      onArchive={onArchive}
                      activeId={activeId}
                      hideEmployee
                    />
                  </tbody>
                </table>
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

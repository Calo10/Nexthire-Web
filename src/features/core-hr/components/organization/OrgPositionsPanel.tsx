import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import { organizationApi } from '../../api/organizationApi';
import type { DepartmentListItem, OrgLevel, OrgPosition } from '../../models/organization';
import { POSITION_STATUSES } from '../../models/organization';
import { apiErrorMessage } from '../../utils/employeeFormat';
import PaginationBar from '../PaginationBar';
import OrgPositionsTable from './OrgPositionsTable';

const SEARCH_DEBOUNCE_MS = 350;

type Props = {
  /** Locks the list to one department (used under the org chart). Hides filters. */
  departmentId?: string;
  departmentName?: string;
  departments?: DepartmentListItem[];
  levels?: OrgLevel[];
  reloadKey: number;
  activeId?: string | null;
  canManage: boolean;
  onOpen: (position: OrgPosition) => void;
  onAdd: (departmentId?: string) => void;
};

export default function OrgPositionsPanel({
  departmentId,
  departmentName,
  departments = [],
  levels = [],
  reloadKey,
  activeId,
  canManage,
  onOpen,
  onAdd,
}: Props) {
  const { t } = useTranslation();
  const scoped = !!departmentId;
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(scoped ? 10 : 25);
  const [items, setItems] = useState<OrgPosition[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const applied = useRef('');
  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next === applied.current) return;
      applied.current = next;
      setSearch(next);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => setPage(1), [departmentId]);

  const query = useMemo(
    () => ({
      search: search || undefined,
      departmentId: departmentId ?? (deptFilter || undefined),
      levelId: levelFilter || undefined,
      status: status || undefined,
      page,
      pageSize,
    }),
    [search, departmentId, deptFilter, levelFilter, status, page, pageSize],
  );

  const reqId = useRef(0);
  useEffect(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    organizationApi
      .listPositions(query)
      .then((res) => {
        if (id !== reqId.current) return;
        setItems(res.items);
        setTotal(res.total);
        const lastPage = Math.max(1, Math.ceil(res.total / pageSize));
        if (res.items.length === 0 && res.total > 0 && page > lastPage) setPage(lastPage);
      })
      .catch((err: unknown) => {
        if (id === reqId.current) setError(apiErrorMessage(err, t('coreHr.organization.positions.loadError')));
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [query, pageSize, page, reloadKey, retryKey, t]);

  const hasFilters = search !== '' || deptFilter !== '' || levelFilter !== '' || status !== '';
  const clearFilters = () => {
    setSearchInput('');
    applied.current = '';
    setSearch('');
    setDeptFilter('');
    setLevelFilter('');
    setStatus('');
    setPage(1);
  };

  const selectCls = (active: boolean) =>
    `h-10 min-w-[140px] rounded-lg border bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 ${
      active ? 'border-teal-300 text-dark-text' : 'border-gray-300 text-gray-600'
    }`;

  return (
    <section
      aria-label={scoped ? t('coreHr.organization.positions.forDepartment', { name: departmentName ?? '' }) : t('coreHr.organization.tabs.positions')}
      className="rounded-xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        {scoped ? (
          <h3 className="text-sm font-semibold text-dark-text">
            {t('coreHr.organization.positions.forDepartment', { name: departmentName ?? '' })}
            <span className="ml-2 text-xs font-normal text-gray-500">{total}</span>
          </h3>
        ) : (
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('coreHr.organization.positions.search')}
              aria-label={t('coreHr.organization.positions.search')}
              className="h-10 w-full max-w-xs rounded-lg border border-gray-300 px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <select
              aria-label={t('coreHr.organization.positions.filters.department')}
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className={selectCls(!!deptFilter)}
            >
              <option value="">{t('coreHr.organization.positions.filters.department')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              aria-label={t('coreHr.organization.positions.filters.level')}
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value);
                setPage(1);
              }}
              className={selectCls(!!levelFilter)}
            >
              <option value="">{t('coreHr.organization.positions.filters.level')}</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <select
              aria-label={t('coreHr.organization.positions.filters.status')}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className={selectCls(!!status)}
            >
              <option value="">{t('coreHr.organization.positions.filters.status')}</option>
              {POSITION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`coreHr.organization.positions.status.${s}`)}
                </option>
              ))}
            </select>
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className="text-sm font-medium text-teal-700 hover:text-teal-800">
                {t('coreHr.organization.positions.filters.clear')}
              </button>
            ) : null}
          </div>
        )}
        {canManage ? (
          <Button size="sm" onClick={() => onAdd(departmentId)}>
            + {t('coreHr.organization.actions.addPosition')}
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="space-y-3 p-6">
          <ErrorMessage message={error} />
          <Button variant="outline" size="sm" onClick={() => setRetryKey((k) => k + 1)}>
            {t('coreHr.organization.retry')}
          </Button>
        </div>
      ) : !loading && items.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h4 className="text-base font-semibold text-dark-text">
            {hasFilters ? t('coreHr.organization.positions.noResultsTitle') : t('coreHr.organization.positions.emptyTitle')}
          </h4>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {hasFilters ? t('coreHr.organization.positions.noResultsDescription') : t('coreHr.organization.positions.emptyDescription')}
          </p>
        </div>
      ) : (
        <>
          <OrgPositionsTable items={items} loading={loading} activeId={activeId} hideDepartment={scoped} onOpen={onOpen} />
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={total}
            disabled={loading}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </>
      )}
    </section>
  );
}

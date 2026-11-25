import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { employeesApi } from '../api/employeesApi';
import AddEmployeeWizard from '../components/AddEmployeeWizard';
import ChangeStatusModal from '../components/ChangeStatusModal';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';
import EmployeeFilters from '../components/EmployeeFilters';
import { activeFilterCount, EMPTY_FILTERS, type EmployeeFilterState } from '../models/employeeFilters';
import EmployeeKpiCards from '../components/EmployeeKpiCards';
import EmployeeQuickViewDrawer, { type DrawerTab } from '../components/EmployeeQuickViewDrawer';
import EmployeesTable from '../components/EmployeesTable';
import HrToast, { type HrToastState } from '../components/HrToast';
import ImportEmployeesModal from '../components/ImportEmployeesModal';
import PaginationBar from '../components/PaginationBar';
import { HR_PERMISSIONS, useHrCapabilities } from '../hooks/useHrCapabilities';
import { useHrLookups } from '../hooks/useHrLookups';
import type {
  EmployeeListItem,
  EmployeeListQuery,
  EmployeeSortKey,
  EmployeeSummary,
  SortDirection,
} from '../models/employee';
import { apiErrorMessage, downloadBlob, employeeName } from '../utils/employeeFormat';

const SEARCH_DEBOUNCE_MS = 350;

export default function CoreHrEmployeesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const caps = useHrCapabilities();
  const lookups = useHrLookups(!caps.denied);

  const canCreate = caps.can(HR_PERMISSIONS.Create);
  const canImport = caps.can(HR_PERMISSIONS.Import);
  const canExport = caps.has(HR_PERMISSIONS.Export);
  const canEdit = caps.can(HR_PERMISSIONS.Edit);
  const canArchive = caps.can(HR_PERMISSIONS.Archive);
  const canManageDocuments = caps.can(HR_PERMISSIONS.ManageDocuments);

  // Query state
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<EmployeeFilterState>(EMPTY_FILTERS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<EmployeeSortKey>('name');
  const [dir, setDir] = useState<SortDirection>('asc');

  // Data state
  const [items, setItems] = useState<EmployeeListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [summary, setSummary] = useState<EmployeeSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  // UI state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<{ id: string; preview: EmployeeListItem; tab: DrawerTab } | null>(null);
  const [drawerRefresh, setDrawerRefresh] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<EmployeeListItem | null>(null);
  const [archiveTargets, setArchiveTargets] = useState<EmployeeListItem[] | { bulk: string[] } | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<EmployeeListItem | null>(null);
  const [mutating, setMutating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<HrToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // Debounce the search box.
  const appliedSearch = useRef('');
  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = searchInput.trim();
      if (next === appliedSearch.current) return;
      appliedSearch.current = next;
      setSearch(next);
      setPage(1);
      setSelected(new Set());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const query: EmployeeListQuery = useMemo(
    () => ({
      search: search || undefined,
      departmentId: filters.departmentId || undefined,
      workLocationId: filters.workLocationId || undefined,
      employmentStatus: filters.employmentStatus || undefined,
      employmentTypeId: filters.employmentTypeId || undefined,
      jobTitleId: filters.jobTitleId || undefined,
      managerId: filters.managerId || undefined,
      hireFrom: filters.hireFrom || undefined,
      hireTo: filters.hireTo || undefined,
      includeArchived: filters.includeArchived,
      sort,
      dir,
    }),
    [search, filters, sort, dir],
  );

  // List
  const reqId = useRef(0);
  useEffect(() => {
    if (caps.ready && caps.denied) {
      setLoading(false);
      setForbidden(true);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    employeesApi
      .list({ ...query, page, pageSize })
      .then((res) => {
        if (id !== reqId.current) return;
        setItems(res.items);
        setTotal(res.total);
        setForbidden(false);
        // Landed beyond the last page (e.g. after archiving the only row on it).
        const lastPage = Math.max(1, Math.ceil(res.total / pageSize));
        if (res.items.length === 0 && res.total > 0 && page > lastPage) setPage(lastPage);
      })
      .catch((err: unknown) => {
        if (id !== reqId.current) return;
        if ((err as { status?: number })?.status === 403) {
          setForbidden(true);
        } else {
          setError(apiErrorMessage(err, t('coreHr.employees.loadError')));
        }
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [query, page, pageSize, reloadKey, caps.ready, caps.denied, t]);

  // Summary
  const loadSummary = useCallback(async () => {
    setSummaryError(false);
    try {
      setSummary(await employeesApi.summary());
    } catch {
      setSummaryError(true);
    } finally {
      setSummaryLoading(false);
    }
  }, []);
  useEffect(() => {
    if (caps.ready && !caps.denied) void loadSummary();
  }, [caps.ready, caps.denied, loadSummary]);

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
    void loadSummary();
  }, [loadSummary]);

  const resetToFirstPage = () => {
    setPage(1);
    setSelected(new Set());
  };

  const patchFilters = (patch: Partial<EmployeeFilterState>) => {
    setFilters((f) => ({ ...f, ...patch }));
    resetToFirstPage();
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchInput('');
    appliedSearch.current = '';
    setSearch('');
    resetToFirstPage();
  };

  const onSort = (key: EmployeeSortKey) => {
    if (key === sort) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(key);
      setDir('asc');
    }
    setPage(1);
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const e of items) {
        if (e.isArchived) continue;
        if (checked) next.add(e.id);
        else next.delete(e.id);
      }
      return next;
    });

  // Actions
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await employeesApi.exportCsv(query);
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      downloadBlob(blob, `employees-${stamp}.csv`);
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.employees.export.error')) });
    } finally {
      setExporting(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTargets) return;
    const ids = Array.isArray(archiveTargets) ? archiveTargets.map((e) => e.id) : archiveTargets.bulk;
    setMutating(true);
    const results = await Promise.allSettled(ids.map((id) => employeesApi.archive(id)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ok;
    setMutating(false);
    setArchiveTargets(null);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    if (drawer && ids.includes(drawer.id)) setDrawer(null);
    if (failed === 0) {
      setToast({ tone: 'success', text: t('coreHr.employees.archive.success', { count: ok }) });
    } else {
      const firstError = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
      setToast({
        tone: ok > 0 ? 'warning' : 'error',
        text: ok > 0
          ? t('coreHr.employees.archive.partial', { ok, failed })
          : apiErrorMessage(firstError?.reason, t('coreHr.employees.archive.error')),
      });
    }
    refresh();
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    setMutating(true);
    try {
      await employeesApi.restore(restoreTarget.id);
      setToast({ tone: 'success', text: t('coreHr.employees.restore.success', { name: employeeName(restoreTarget) }) });
      refresh();
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.employees.restore.error')) });
    } finally {
      setMutating(false);
      setRestoreTarget(null);
    }
  };

  const hasFilters = activeFilterCount(filters) > 0 || search !== '';

  const archiveCount = archiveTargets
    ? Array.isArray(archiveTargets)
      ? archiveTargets.length
      : archiveTargets.bulk.length
    : 0;
  const archiveName =
    archiveTargets && Array.isArray(archiveTargets) && archiveTargets.length === 1
      ? employeeName(archiveTargets[0])
      : '';

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {canImport ? (
        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          {t('coreHr.employees.actions.import')}
        </Button>
      ) : null}
      {canExport ? (
        <Button variant="outline" size="sm" disabled={exporting} onClick={() => void handleExport()}>
          {exporting ? t('common.actions.exporting') : t('coreHr.employees.actions.export')}
        </Button>
      ) : null}
      {canCreate ? (
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          + {t('coreHr.employees.actions.add')}
        </Button>
      ) : null}
    </div>
  );

  const breadcrumbs = [
    { label: t('modules.coreHr'), to: '/app/hr/dashboard' },
    { label: t('coreHr.employees.title') },
  ];

  if (forbidden) {
    return (
      <CoreHrPageShell title={t('coreHr.employees.title')} subtitle={t('coreHr.employees.subtitle')} breadcrumbs={breadcrumbs}>
        <CoreHrEmptyState
          title={t('coreHr.employees.forbiddenTitle')}
          description={t('coreHr.employees.forbiddenDescription')}
        />
      </CoreHrPageShell>
    );
  }

  return (
    <CoreHrPageShell
      title={t('coreHr.employees.title')}
      subtitle={t('coreHr.employees.subtitle')}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <div className="space-y-6">
        <EmployeeKpiCards summary={summary} loading={summaryLoading} error={summaryError} />

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-gray-200 p-4">
            <EmployeeFilters
              searchInput={searchInput}
              onSearchChange={setSearchInput}
              filters={filters}
              onFiltersChange={patchFilters}
              onClear={clearFilters}
              lookups={lookups}
              advancedOpen={advancedOpen}
              onToggleAdvanced={() => setAdvancedOpen((o) => !o)}
            />
            {selected.size > 0 && (canArchive || canEdit) ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5">
                <p className="text-sm font-medium text-teal-900">
                  {t('coreHr.employees.bulk.selected', { count: selected.size })}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className="text-sm font-medium text-teal-800 hover:text-teal-950"
                  >
                    {t('coreHr.employees.bulk.clear')}
                  </button>
                  {canArchive ? (
                    <Button
                      size="sm"
                      className="!from-red-600 !to-red-600 hover:!from-red-700 hover:!to-red-700"
                      onClick={() => setArchiveTargets({ bulk: Array.from(selected) })}
                    >
                      {t('coreHr.employees.bulk.archive')}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="space-y-3 p-6">
              <ErrorMessage message={error} />
              <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
                {t('coreHr.employees.retry')}
              </Button>
            </div>
          ) : !loading && items.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-dark-text">
                {hasFilters ? t('coreHr.employees.noResultsTitle') : t('coreHr.employees.emptyTitle')}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                {hasFilters ? t('coreHr.employees.noResultsDescription') : t('coreHr.employees.emptyDescription')}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {hasFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    {t('coreHr.employees.filters.clear')}
                  </Button>
                ) : (
                  <>
                    {canImport ? (
                      <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
                        {t('coreHr.employees.actions.import')}
                      </Button>
                    ) : null}
                    {canCreate ? (
                      <Button size="sm" onClick={() => setWizardOpen(true)}>
                        + {t('coreHr.employees.actions.add')}
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              <EmployeesTable
                items={items}
                loading={loading}
                pageSize={pageSize}
                sort={sort}
                dir={dir}
                onSort={onSort}
                selected={selected}
                onToggle={toggleOne}
                onToggleAll={toggleAll}
                canEdit={canEdit}
                canArchive={canArchive}
                actions={{
                  onView: (e) => setDrawer({ id: e.id, preview: e, tab: 'overview' }),
                  onEdit: (e) => navigate(`/app/hr/employees/${e.id}?edit=personal`),
                  onChangeStatus: (e) => setStatusTarget(e),
                  onDocuments: (e) => setDrawer({ id: e.id, preview: e, tab: 'documents' }),
                  onArchive: (e) => setArchiveTargets([e]),
                  onRestore: (e) => setRestoreTarget(e),
                }}
              />
              <PaginationBar
                page={page}
                pageSize={pageSize}
                total={total}
                disabled={loading}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  resetToFirstPage();
                }}
              />
            </>
          )}
        </section>
      </div>

      <EmployeeQuickViewDrawer
        employeeId={drawer?.id ?? null}
        preview={drawer?.preview}
        initialTab={drawer?.tab}
        canManageDocuments={canManageDocuments}
        refreshKey={drawerRefresh}
        onClose={() => setDrawer(null)}
      />

      <AddEmployeeWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        lookups={lookups}
        canCreateLookups={canCreate}
        canManageDocuments={canManageDocuments}
        onCreated={(employee, documentFailures) => {
          setWizardOpen(false);
          setToast({
            tone: documentFailures > 0 ? 'warning' : 'success',
            text:
              documentFailures > 0
                ? t('coreHr.employees.wizard.createdWithDocFailures', {
                    name: employeeName(employee),
                    count: documentFailures,
                  })
                : t('coreHr.employees.wizard.created', { name: employeeName(employee) }),
            linkTo: `/app/hr/employees/${employee.id}`,
            linkLabel: t('coreHr.employees.wizard.viewProfile'),
          });
          refresh();
        }}
      />

      <ImportEmployeesModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          void lookups.reload();
          refresh();
        }}
      />

      <ChangeStatusModal
        isOpen={!!statusTarget}
        employee={statusTarget}
        onClose={() => setStatusTarget(null)}
        onChanged={(updated) => {
          setStatusTarget(null);
          setToast({
            tone: 'success',
            text: t('coreHr.employees.statusModal.success', {
              name: employeeName(updated),
              status: t(`coreHr.employees.status.${updated.employmentStatus}`),
            }),
          });
          setDrawerRefresh((k) => k + 1);
          refresh();
        }}
      />

      <ConfirmModal
        isOpen={!!archiveTargets}
        onClose={() => setArchiveTargets(null)}
        onConfirm={() => void confirmArchive()}
        tone="danger"
        busy={mutating}
        title={t('coreHr.employees.archive.title', { count: archiveCount })}
        description={
          archiveCount === 1 && archiveName
            ? t('coreHr.employees.archive.descriptionOne', { name: archiveName })
            : t('coreHr.employees.archive.descriptionMany', { count: archiveCount })
        }
        confirmLabel={t('coreHr.employees.archive.confirm')}
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => void confirmRestore()}
        busy={mutating}
        title={t('coreHr.employees.restore.title')}
        description={t('coreHr.employees.restore.description', {
          name: restoreTarget ? employeeName(restoreTarget) : '',
        })}
        confirmLabel={t('coreHr.employees.actions.restore')}
      />

      <HrToast toast={toast} onDismiss={dismissToast} />
    </CoreHrPageShell>
  );
}

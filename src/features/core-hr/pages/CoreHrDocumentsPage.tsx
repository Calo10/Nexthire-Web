import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { hrDocumentsApi } from '../api/hrDocumentsApi';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';
import HrDocumentCategorySidebar from '../components/documents/HrDocumentCategorySidebar';
import HrDocumentDrawer from '../components/documents/HrDocumentDrawer';
import HrDocumentKpiCards from '../components/documents/HrDocumentKpiCards';
import HrDocumentRequestsModal from '../components/documents/HrDocumentRequestsModal';
import HrDocumentsByEmployee from '../components/documents/HrDocumentsByEmployee';
import HrDocumentsTable from '../components/documents/HrDocumentsTable';
import UploadHrDocumentModal from '../components/documents/UploadHrDocumentModal';
import HrToast, { type HrToastState } from '../components/HrToast';
import PaginationBar from '../components/PaginationBar';
import { HR_PERMISSIONS, useHrCapabilities } from '../hooks/useHrCapabilities';
import { useHrLookups } from '../hooks/useHrLookups';
import { resolveHrDocumentUrl } from '../hooks/useHrDocumentUrl';
import {
  HR_DOCUMENT_STATUSES,
  type HrDocumentCategoryCount,
  type HrDocumentListItem,
  type HrDocumentSummary,
} from '../models/hrDocument';
import { DOCUMENT_CATEGORIES } from '../models/employee';
import { apiErrorMessage } from '../utils/employeeFormat';

const SEARCH_DEBOUNCE_MS = 350;

type HubTab = 'documents' | 'employees';
const TABS: HubTab[] = ['documents', 'employees'];

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 min-w-[140px] rounded-lg border bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 ${
        value ? 'border-teal-300 text-dark-text' : 'border-gray-300 text-gray-600'
      }`}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function CoreHrDocumentsPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const caps = useHrCapabilities();
  const lookups = useHrLookups(!caps.denied);
  const canManage = caps.can(HR_PERMISSIONS.ManageDocuments);

  // Query state
  const [tab, setTab] = useState<HubTab>('documents');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Data state
  const [items, setItems] = useState<HrDocumentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [summary, setSummary] = useState<HrDocumentSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<HrDocumentCategoryCount[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // UI state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<HrDocumentListItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadEmployeeId, setUploadEmployeeId] = useState<string | undefined>(undefined);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [archiveTargets, setArchiveTargets] = useState<HrDocumentListItem[] | null>(null);
  const [mutating, setMutating] = useState(false);
  const [toast, setToast] = useState<HrToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

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

  const query = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      status: status || undefined,
      departmentId: departmentId || undefined,
      sort: tab === 'employees' ? 'employee' : undefined,
      dir: tab === 'employees' ? ('asc' as const) : undefined,
    }),
    [search, category, status, departmentId, tab],
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
    hrDocumentsApi
      .list({ ...query, page, pageSize })
      .then((res) => {
        if (id !== reqId.current) return;
        setItems(res.items);
        setTotal(res.total);
        setForbidden(false);
        const lastPage = Math.max(1, Math.ceil(res.total / pageSize));
        if (res.items.length === 0 && res.total > 0 && page > lastPage) setPage(lastPage);
      })
      .catch((err: unknown) => {
        if (id !== reqId.current) return;
        if ((err as { status?: number })?.status === 403) setForbidden(true);
        else setError(apiErrorMessage(err, t('coreHr.documentsHub.loadError')));
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [query, page, pageSize, reloadKey, caps.ready, caps.denied, t]);

  // Summary + category counts
  const loadAside = useCallback(async () => {
    setSummaryError(false);
    const [s, c] = await Promise.allSettled([hrDocumentsApi.summary(), hrDocumentsApi.categories()]);
    if (s.status === 'fulfilled') setSummary(s.value);
    else setSummaryError(true);
    if (c.status === 'fulfilled') setCategoryCounts(c.value);
    setSummaryLoading(false);
    setCategoriesLoading(false);
  }, []);
  useEffect(() => {
    if (caps.ready && !caps.denied) void loadAside();
  }, [caps.ready, caps.denied, loadAside]);

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
    void loadAside();
  }, [loadAside]);

  const resetToFirstPage = () => {
    setPage(1);
    setSelected(new Set());
  };

  const clearFilters = () => {
    setSearchInput('');
    appliedSearch.current = '';
    setSearch('');
    setCategory('');
    setStatus('');
    setDepartmentId('');
    resetToFirstPage();
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
      for (const d of items) {
        if (checked) next.add(d.id);
        else next.delete(d.id);
      }
      return next;
    });

  const download = async (doc: HrDocumentListItem) => {
    try {
      const url = await resolveHrDocumentUrl(doc);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else setToast({ tone: 'warning', text: t('coreHr.documentsHub.preview.none') });
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.documentsHub.preview.error')) });
    }
  };

  const confirmArchive = async () => {
    if (!archiveTargets) return;
    const ids = archiveTargets.map((d) => d.id);
    setMutating(true);
    const results = await Promise.allSettled(ids.map((id) => hrDocumentsApi.archive(id)));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - ok;
    setMutating(false);
    setArchiveTargets(null);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    if (active && ids.includes(active.id)) setActive(null);
    if (failed === 0) {
      setToast({ tone: 'success', text: t('coreHr.documentsHub.archive.success', { count: ok }) });
    } else {
      const firstError = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
      setToast({
        tone: ok > 0 ? 'warning' : 'error',
        text:
          ok > 0
            ? t('coreHr.documentsHub.archive.partial', { ok, failed })
            : apiErrorMessage(firstError?.reason, t('coreHr.documentsHub.archive.error')),
      });
    }
    refresh();
  };

  const openUpload = (employeeId?: string) => {
    setUploadEmployeeId(employeeId);
    setUploadOpen(true);
  };

  const hasFilters = search !== '' || category !== '' || status !== '' || departmentId !== '';
  const openRequests = summary?.openRequests ?? 0;
  const activeDepartments = lookups.departments.filter((d) => d.isActive || d.id === departmentId);

  const breadcrumbs = [
    { label: t('modules.coreHr'), to: '/app/hr/dashboard' },
    { label: t('coreHr.documents.title') },
  ];

  if (forbidden) {
    return (
      <CoreHrPageShell title={t('coreHr.documents.title')} subtitle={t('coreHr.documents.subtitle')} breadcrumbs={breadcrumbs}>
        <CoreHrEmptyState
          title={t('coreHr.documentsHub.forbiddenTitle')}
          description={t('coreHr.documentsHub.forbiddenDescription')}
        />
      </CoreHrPageShell>
    );
  }

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setRequestsOpen(true)}>
        <span className="inline-flex items-center gap-2">
          {t('coreHr.documentsHub.actions.requests')}
          {openRequests > 0 ? (
            <span
              aria-label={t('coreHr.documentsHub.actions.openRequests', { count: openRequests })}
              className="inline-flex min-w-5 items-center justify-center rounded-full bg-teal-600 px-1.5 text-xs font-semibold text-white"
            >
              {openRequests}
            </span>
          ) : null}
        </span>
      </Button>
      {canManage ? (
        <Button size="sm" onClick={() => openUpload()}>
          + {t('coreHr.documentsHub.actions.upload')}
        </Button>
      ) : null}
    </div>
  );

  return (
    <CoreHrPageShell
      title={t('coreHr.documents.title')}
      subtitle={t('coreHr.documents.subtitle')}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <div className="space-y-6">
        <HrDocumentKpiCards summary={summary} loading={summaryLoading} error={summaryError} />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside className="w-full shrink-0 lg:w-60">
            <HrDocumentCategorySidebar
              total={summary?.total ?? 0}
              counts={categoryCounts}
              selected={category}
              loading={categoriesLoading}
              onSelect={(c) => {
                setCategory(c);
                resetToFirstPage();
              }}
            />
          </aside>

          <section className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="space-y-3 border-b border-gray-200 p-4">
              <div className="flex rounded-lg bg-gray-100 p-1 sm:w-fit" role="tablist">
                {TABS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={tab === k}
                    onClick={() => {
                      setTab(k);
                      resetToFirstPage();
                    }}
                    className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
                      tab === k ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-600 hover:text-dark-text'
                    }`}
                  >
                    {t(`coreHr.documentsHub.tabs.${k}`)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={t('coreHr.documentsHub.filters.searchPlaceholder')}
                    aria-label={t('coreHr.documentsHub.filters.searchPlaceholder')}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <FilterSelect
                  label={t('coreHr.documentsHub.filters.type')}
                  value={category}
                  onChange={(v) => {
                    setCategory(v);
                    resetToFirstPage();
                  }}
                  options={DOCUMENT_CATEGORIES.map((c) => ({
                    value: c,
                    label: t(`coreHr.employees.documents.categories.${c}`, { defaultValue: c }),
                  }))}
                />
                <FilterSelect
                  label={t('coreHr.documentsHub.filters.status')}
                  value={status}
                  onChange={(v) => {
                    setStatus(v);
                    resetToFirstPage();
                  }}
                  options={HR_DOCUMENT_STATUSES.map((s) => ({ value: s, label: t(`coreHr.documentsHub.status.${s}`) }))}
                />
                <FilterSelect
                  label={t('coreHr.documentsHub.filters.department')}
                  value={departmentId}
                  onChange={(v) => {
                    setDepartmentId(v);
                    resetToFirstPage();
                  }}
                  options={activeDepartments.map((d) => ({ value: d.id, label: d.name }))}
                />
                {hasFilters ? (
                  <button type="button" onClick={clearFilters} className="text-sm font-medium text-teal-700 hover:text-teal-800">
                    {t('coreHr.documentsHub.filters.clear')}
                  </button>
                ) : null}
              </div>

              {selected.size > 0 && canManage ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5">
                  <p className="text-sm font-medium text-teal-900">
                    {t('coreHr.documentsHub.bulk.selected', { count: selected.size })}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(new Set())}
                      className="text-sm font-medium text-teal-800 hover:text-teal-950"
                    >
                      {t('coreHr.documentsHub.bulk.clear')}
                    </button>
                    <Button
                      size="sm"
                      className="!from-red-600 !to-red-600 hover:!from-red-700 hover:!to-red-700"
                      onClick={() => setArchiveTargets(items.filter((d) => selected.has(d.id)))}
                    >
                      {t('coreHr.documentsHub.bulk.archive')}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="space-y-3 p-6">
                <ErrorMessage message={error} />
                <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
                  {t('coreHr.documentsHub.retry')}
                </Button>
              </div>
            ) : !loading && items.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <h2 className="text-base font-semibold text-dark-text">
                  {hasFilters ? t('coreHr.documentsHub.noResultsTitle') : t('coreHr.documents.emptyTitle')}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  {hasFilters ? t('coreHr.documentsHub.noResultsDescription') : t('coreHr.documents.emptyDescription')}
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  {hasFilters ? (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      {t('coreHr.documentsHub.filters.clear')}
                    </Button>
                  ) : canManage ? (
                    <Button size="sm" onClick={() => openUpload()}>
                      + {t('coreHr.documentsHub.actions.upload')}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              <>
                {tab === 'documents' ? (
                  <HrDocumentsTable
                    items={items}
                    loading={loading}
                    pageSize={pageSize}
                    locale={locale}
                    selected={selected}
                    onToggle={toggleOne}
                    onToggleAll={toggleAll}
                    canArchive={canManage}
                    onOpen={setActive}
                    onDownload={(d) => void download(d)}
                    onArchive={(d) => setArchiveTargets([d])}
                    activeId={active?.id}
                  />
                ) : (
                  <HrDocumentsByEmployee
                    items={items}
                    loading={loading}
                    locale={locale}
                    selected={selected}
                    onToggle={toggleOne}
                    canArchive={canManage}
                    canUpload={canManage}
                    onOpen={setActive}
                    onDownload={(d) => void download(d)}
                    onArchive={(d) => setArchiveTargets([d])}
                    onUploadFor={(employeeId) => openUpload(employeeId)}
                    activeId={active?.id}
                  />
                )}
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
      </div>

      <HrDocumentDrawer
        doc={active}
        locale={locale}
        canArchive={canManage}
        onArchive={(d) => setArchiveTargets([d])}
        onClose={() => setActive(null)}
      />

      <UploadHrDocumentModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultEmployeeId={uploadEmployeeId}
        defaultCategory={category || undefined}
        onUploaded={(name) => {
          setUploadOpen(false);
          setToast({ tone: 'success', text: t('coreHr.documentsHub.upload.success', { name }) });
          refresh();
        }}
      />

      <HrDocumentRequestsModal
        isOpen={requestsOpen}
        onClose={() => setRequestsOpen(false)}
        canManage={canManage}
        locale={locale}
        onChanged={() => void loadAside()}
      />

      <ConfirmModal
        isOpen={!!archiveTargets}
        onClose={() => setArchiveTargets(null)}
        onConfirm={() => void confirmArchive()}
        tone="danger"
        busy={mutating}
        title={t('coreHr.documentsHub.archive.title', { count: archiveTargets?.length ?? 0 })}
        description={
          archiveTargets && archiveTargets.length === 1
            ? t('coreHr.documentsHub.archive.descriptionOne', { name: archiveTargets[0].name })
            : t('coreHr.documentsHub.archive.descriptionMany', { count: archiveTargets?.length ?? 0 })
        }
        confirmLabel={t('coreHr.documentsHub.actions.archive')}
      />

      <HrToast toast={toast} onDismiss={dismissToast} />
    </CoreHrPageShell>
  );
}

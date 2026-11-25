import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import { offboardingsApi } from '../api/offboardingsApi';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';
import HrToast, { type HrToastState } from '../components/HrToast';
import PaginationBar from '../components/PaginationBar';
import NewOffboardingWizard from '../components/offboarding/NewOffboardingWizard';
import OffboardingDrawer, { type OffboardingDrawerPreview } from '../components/offboarding/OffboardingDrawer';
import OffboardingFilters from '../components/offboarding/OffboardingFilters';
import OffboardingKpiCards from '../components/offboarding/OffboardingKpiCards';
import OffboardingListTable from '../components/offboarding/OffboardingListTable';
import OffboardingPipelineBoard from '../components/offboarding/OffboardingPipelineBoard';
import { useHrLookups } from '../hooks/useHrLookups';
import { useOffboardingCapabilities } from '../hooks/useOffboardingCapabilities';
import { useOffboardingLookups } from '../hooks/useOffboardingLookups';
import {
  activeOffboardingFilterCount,
  EMPTY_OFFBOARDING_FILTERS,
  OFFBOARDING_PERMISSIONS,
  type OffboardingFilterState,
  type OffboardingListItem,
  type OffboardingPipelineColumn,
  type OffboardingSortKey,
  type OffboardingSummary,
} from '../models/offboarding';
import { apiErrorMessage } from '../utils/employeeFormat';

const SEARCH_DEBOUNCE_MS = 350;
type View = 'pipeline' | 'list';

export default function CoreHrOffboardingPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const [searchParams, setSearchParams] = useSearchParams();
  const caps = useOffboardingCapabilities();
  const hrLookups = useHrLookups(!caps.denied);
  const lookups = useOffboardingLookups(!caps.denied);

  const canCreate = caps.can(OFFBOARDING_PERMISSIONS.Create);
  const canEdit = caps.can(OFFBOARDING_PERMISSIONS.Edit);
  const canManageTasks = caps.can(OFFBOARDING_PERMISSIONS.ManageTasks);

  const [view, setView] = useState<View>('pipeline');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<OffboardingFilterState>(EMPTY_OFFBOARDING_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<OffboardingSortKey>('lastWorkingDay');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [reloadKey, setReloadKey] = useState(0);

  // Data
  const [columns, setColumns] = useState<OffboardingPipelineColumn[]>([]);
  const [items, setItems] = useState<OffboardingListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [summary, setSummary] = useState<OffboardingSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  // UI
  const [drawer, setDrawer] = useState<{ id: string; preview?: OffboardingDrawerPreview } | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
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
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  // `?open=<offboardingId>` (from the employee profile) opens the drawer once.
  useEffect(() => {
    const open = searchParams.get('open');
    if (!open) return;
    setDrawer({ id: open });
    const params = new URLSearchParams(searchParams);
    params.delete('open');
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseQuery = useMemo(
    () => ({
      search: search || undefined,
      departmentId: filters.departmentId || undefined,
      ownerUserId: filters.ownerUserId || undefined,
      templateId: filters.templateId || undefined,
      separationType: filters.separationType || undefined,
      overdueOnly: filters.overdueOnly,
    }),
    [search, filters],
  );

  // Pipeline / list data
  const reqId = useRef(0);
  useEffect(() => {
    if (caps.ready && caps.denied) {
      setLoading(false);
      setForbidden(true);
      return;
    }
    if (!caps.ready) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    const request =
      view === 'pipeline'
        ? offboardingsApi.pipeline(baseQuery).then((res) => {
            if (id !== reqId.current) return;
            setColumns(res.columns);
          })
        : offboardingsApi
            .list({ ...baseQuery, status: filters.status || undefined, page, pageSize, sort, dir })
            .then((res) => {
              if (id !== reqId.current) return;
              setItems(res.items);
              setTotal(res.total);
              const lastPage = Math.max(1, Math.ceil(res.total / pageSize));
              if (res.items.length === 0 && res.total > 0 && page > lastPage) setPage(lastPage);
            });
    request
      .then(() => {
        if (id === reqId.current) setForbidden(false);
      })
      .catch((err: unknown) => {
        if (id !== reqId.current) return;
        if ((err as { status?: number })?.status === 403) setForbidden(true);
        else setError(apiErrorMessage(err, t('coreHr.offboarding.loadError')));
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [view, baseQuery, filters.status, page, pageSize, sort, dir, reloadKey, caps.ready, caps.denied, t]);

  // Summary
  const loadSummary = useCallback(async () => {
    setSummaryError(false);
    try {
      setSummary(await offboardingsApi.summary());
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

  const patchFilters = (patch: Partial<OffboardingFilterState>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_OFFBOARDING_FILTERS);
    setSearchInput('');
    appliedSearch.current = '';
    setSearch('');
    setPage(1);
  };

  const onSort = (key: OffboardingSortKey) => {
    if (key === sort) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSort(key);
      setDir('asc');
    }
    setPage(1);
  };

  // Drag & drop: optimistic move, revert + toast when the API rejects the transition.
  const handleMove = async (id: string, toStatus: string) => {
    const snapshot = columns;
    const card = snapshot.flatMap((c) => c.cards).find((c) => c.id === id);
    if (!card) return;
    setColumns(
      snapshot.map((c) => {
        if (c.status === toStatus) return { ...c, cards: [card, ...c.cards.filter((x) => x.id !== id)], count: c.count + 1 };
        if (c.cards.some((x) => x.id === id)) return { ...c, cards: c.cards.filter((x) => x.id !== id), count: Math.max(0, c.count - 1) };
        return c;
      }),
    );
    try {
      const updated = await offboardingsApi.changeStatus(id, { status: toStatus });
      setToast({
        tone: 'success',
        text: t('coreHr.offboarding.toast.moved', {
          name: updated.employeeName,
          status: t(`coreHr.offboarding.status.${updated.status}`, { defaultValue: updated.status }),
        }),
      });
      refresh();
    } catch (err) {
      setColumns(snapshot);
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.offboarding.toast.moveError')) });
    }
  };

  const hasFilters = activeOffboardingFilterCount(filters) > 0 || search !== '';
  const isEmpty = view === 'pipeline' ? columns.every((c) => c.cards.length === 0) : items.length === 0;

  const breadcrumbs = [
    { label: t('modules.coreHr'), to: '/app/hr/dashboard' },
    { label: t('coreHr.offboarding.title') },
  ];

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to="/app/hr/offboarding/templates"
        className="inline-flex items-center rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-dark-text hover:bg-gray-50"
      >
        {t('coreHr.offboarding.actions.templates')}
      </Link>
      <Link
        to="/app/hr/offboarding/automations"
        className="inline-flex items-center rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-dark-text hover:bg-gray-50"
      >
        {t('coreHr.offboarding.actions.automations')}
      </Link>
      {canCreate ? (
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          + {t('coreHr.offboarding.actions.new')}
        </Button>
      ) : null}
    </div>
  );

  if (forbidden) {
    return (
      <CoreHrPageShell title={t('coreHr.offboarding.title')} subtitle={t('coreHr.offboarding.subtitle')} breadcrumbs={breadcrumbs}>
        <CoreHrEmptyState title={t('coreHr.offboarding.forbiddenTitle')} description={t('coreHr.offboarding.forbiddenDescription')} />
      </CoreHrPageShell>
    );
  }

  return (
    <CoreHrPageShell
      title={t('coreHr.offboarding.title')}
      subtitle={t('coreHr.offboarding.subtitle')}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <div className="space-y-6">
        <OffboardingKpiCards summary={summary} loading={summaryLoading} error={summaryError} />

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-lg bg-gray-100 p-1" role="tablist" aria-label={t('coreHr.offboarding.view.label')}>
                {(['pipeline', 'list'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={view === v}
                    onClick={() => setView(v)}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      view === v ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                    }`}
                  >
                    {t(`coreHr.offboarding.view.${v}`)}
                  </button>
                ))}
              </div>
            </div>
            <OffboardingFilters
              searchInput={searchInput}
              onSearchChange={setSearchInput}
              filters={filters}
              onFiltersChange={patchFilters}
              onClear={clearFilters}
              hrLookups={hrLookups}
              lookups={lookups}
              showStatus={view === 'list'}
            />
          </div>

          {error ? (
            <div className="space-y-3 p-6">
              <ErrorMessage message={error} />
              <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
                {t('coreHr.offboarding.retry')}
              </Button>
            </div>
          ) : !loading && isEmpty ? (
            <div className="px-6 py-14 text-center">
              <h2 className="text-base font-semibold text-dark-text">
                {hasFilters ? t('coreHr.offboarding.noResultsTitle') : t('coreHr.offboarding.emptyTitle')}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                {hasFilters ? t('coreHr.offboarding.noResultsDescription') : t('coreHr.offboarding.emptyDescription')}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {hasFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    {t('coreHr.offboarding.filters.clear')}
                  </Button>
                ) : canCreate ? (
                  <Button size="sm" onClick={() => setWizardOpen(true)}>
                    + {t('coreHr.offboarding.actions.new')}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : view === 'pipeline' ? (
            loading && columns.length === 0 ? (
              <div className="p-6">
                <div className="h-[420px] animate-pulse rounded-xl bg-gray-100" />
              </div>
            ) : (
              <div className="h-[calc(100vh-420px)] min-h-[520px] pb-2">
                <OffboardingPipelineBoard
                  columns={columns}
                  locale={locale}
                  selectedId={drawer?.id ?? null}
                  dragDisabled={!canEdit}
                  onSelect={(id) => {
                    const card = columns.flatMap((c) => c.cards).find((c) => c.id === id);
                    setDrawer({
                      id,
                      preview: card
                        ? {
                            employeeId: card.employeeId,
                            employeeName: card.employeeName,
                            jobTitle: card.jobTitle,
                            avatarUrl: card.avatarUrl,
                            status: columns.find((c) => c.cards.some((x) => x.id === id))?.status,
                            progressPercent: card.progressPercent,
                          }
                        : undefined,
                    });
                  }}
                  onMove={(id, to) => void handleMove(id, to)}
                />
              </div>
            )
          ) : (
            <>
              <OffboardingListTable
                items={items}
                loading={loading}
                pageSize={pageSize}
                sort={sort}
                dir={dir}
                onSort={onSort}
                selectedId={drawer?.id ?? null}
                onOpen={(o) =>
                  setDrawer({
                    id: o.id,
                    preview: {
                      employeeId: o.employeeId,
                      employeeName: o.employeeName,
                      jobTitle: o.jobTitle,
                      avatarUrl: o.avatarUrl,
                      status: o.status,
                      progressPercent: o.progressPercent,
                    },
                  })
                }
              />
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
      </div>

      <OffboardingDrawer
        offboardingId={drawer?.id ?? null}
        preview={drawer?.preview}
        caps={caps}
        lookups={lookups}
        locale={locale}
        onChanged={refresh}
        onToast={setToast}
        onClose={() => setDrawer(null)}
      />

      <NewOffboardingWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        lookups={lookups}
        canManageTasks={canManageTasks}
        canManageAssets={caps.can(OFFBOARDING_PERMISSIONS.ManageAssets)}
        canViewConfidential={caps.has(OFFBOARDING_PERMISSIONS.ViewConfidentialInformation)}
        onCreated={(created) => {
          setWizardOpen(false);
          setToast({ tone: 'success', text: t('coreHr.offboarding.wizard.created', { name: created.employeeName }) });
          setDrawer({
            id: created.id,
            preview: {
              employeeId: created.employeeId,
              employeeName: created.employeeName,
              jobTitle: created.jobTitle,
              avatarUrl: created.avatarUrl,
              status: created.status,
              progressPercent: created.progressPercent,
            },
          });
          refresh();
        }}
      />

      <HrToast toast={toast} onDismiss={dismissToast} />
    </CoreHrPageShell>
  );
}

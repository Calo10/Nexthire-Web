import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import { onboardingsApi } from '../api/onboardingsApi';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';
import HrToast, { type HrToastState } from '../components/HrToast';
import PaginationBar from '../components/PaginationBar';
import NewOnboardingWizard from '../components/onboarding/NewOnboardingWizard';
import OnboardingDrawer, { type OnboardingDrawerPreview } from '../components/onboarding/OnboardingDrawer';
import OnboardingFilters from '../components/onboarding/OnboardingFilters';
import OnboardingKpiCards from '../components/onboarding/OnboardingKpiCards';
import OnboardingListTable from '../components/onboarding/OnboardingListTable';
import OnboardingPipelineBoard from '../components/onboarding/OnboardingPipelineBoard';
import { useHrLookups } from '../hooks/useHrLookups';
import { useOnboardingCapabilities } from '../hooks/useOnboardingCapabilities';
import { useOnboardingLookups } from '../hooks/useOnboardingLookups';
import {
  activeOnboardingFilterCount,
  EMPTY_ONBOARDING_FILTERS,
  ONBOARDING_PERMISSIONS,
  type OnboardingFilterState,
  type OnboardingListItem,
  type OnboardingPipelineColumn,
  type OnboardingSortKey,
  type OnboardingSummary,
} from '../models/onboarding';
import { apiErrorMessage } from '../utils/employeeFormat';

const SEARCH_DEBOUNCE_MS = 350;
type View = 'pipeline' | 'list';

export default function CoreHrOnboardingPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const [searchParams, setSearchParams] = useSearchParams();
  const caps = useOnboardingCapabilities();
  const hrLookups = useHrLookups(!caps.denied);
  const lookups = useOnboardingLookups(!caps.denied);

  const canCreate = caps.can(ONBOARDING_PERMISSIONS.Create);
  const canEdit = caps.can(ONBOARDING_PERMISSIONS.Edit);
  const canManageTasks = caps.can(ONBOARDING_PERMISSIONS.ManageTasks);

  const [view, setView] = useState<View>('pipeline');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<OnboardingFilterState>(EMPTY_ONBOARDING_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState<OnboardingSortKey>('startDate');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [reloadKey, setReloadKey] = useState(0);

  // Data
  const [columns, setColumns] = useState<OnboardingPipelineColumn[]>([]);
  const [items, setItems] = useState<OnboardingListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(false);

  // UI
  const [drawer, setDrawer] = useState<{ id: string; preview?: OnboardingDrawerPreview } | null>(null);
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

  // `?open=<onboardingId>` (from the employee profile) opens the drawer once.
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
        ? onboardingsApi.pipeline(baseQuery).then((res) => {
            if (id !== reqId.current) return;
            setColumns(res.columns);
          })
        : onboardingsApi
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
        else setError(apiErrorMessage(err, t('coreHr.onboarding.loadError')));
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [view, baseQuery, filters.status, page, pageSize, sort, dir, reloadKey, caps.ready, caps.denied, t]);

  // Summary
  const loadSummary = useCallback(async () => {
    setSummaryError(false);
    try {
      setSummary(await onboardingsApi.summary());
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

  const patchFilters = (patch: Partial<OnboardingFilterState>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_ONBOARDING_FILTERS);
    setSearchInput('');
    appliedSearch.current = '';
    setSearch('');
    setPage(1);
  };

  const onSort = (key: OnboardingSortKey) => {
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
      const updated = await onboardingsApi.changeStatus(id, { status: toStatus });
      setToast({
        tone: 'success',
        text: t('coreHr.onboarding.toast.moved', {
          name: updated.employeeName,
          status: t(`coreHr.onboarding.status.${updated.status}`, { defaultValue: updated.status }),
        }),
      });
      refresh();
    } catch (err) {
      setColumns(snapshot);
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.onboarding.toast.moveError')) });
    }
  };

  const hasFilters = activeOnboardingFilterCount(filters) > 0 || search !== '';
  const isEmpty = view === 'pipeline' ? columns.every((c) => c.cards.length === 0) : items.length === 0;

  const breadcrumbs = [
    { label: t('modules.coreHr'), to: '/app/hr/dashboard' },
    { label: t('coreHr.onboarding.title') },
  ];

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        to="/app/hr/onboarding/templates"
        className="inline-flex items-center rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-dark-text hover:bg-gray-50"
      >
        {t('coreHr.onboarding.actions.templates')}
      </Link>
      <Link
        to="/app/hr/onboarding/automations"
        className="inline-flex items-center rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-dark-text hover:bg-gray-50"
      >
        {t('coreHr.onboarding.actions.automations')}
      </Link>
      {canCreate ? (
        <Button size="sm" onClick={() => setWizardOpen(true)}>
          + {t('coreHr.onboarding.actions.new')}
        </Button>
      ) : null}
    </div>
  );

  if (forbidden) {
    return (
      <CoreHrPageShell title={t('coreHr.onboarding.title')} subtitle={t('coreHr.onboarding.subtitle')} breadcrumbs={breadcrumbs}>
        <CoreHrEmptyState title={t('coreHr.onboarding.forbiddenTitle')} description={t('coreHr.onboarding.forbiddenDescription')} />
      </CoreHrPageShell>
    );
  }

  return (
    <CoreHrPageShell
      title={t('coreHr.onboarding.title')}
      subtitle={t('coreHr.onboarding.subtitle')}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <div className="space-y-6">
        <OnboardingKpiCards summary={summary} loading={summaryLoading} error={summaryError} />

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-3 border-b border-gray-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex rounded-lg bg-gray-100 p-1" role="tablist" aria-label={t('coreHr.onboarding.view.label')}>
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
                    {t(`coreHr.onboarding.view.${v}`)}
                  </button>
                ))}
              </div>
            </div>
            <OnboardingFilters
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
                {t('coreHr.onboarding.retry')}
              </Button>
            </div>
          ) : !loading && isEmpty ? (
            <div className="px-6 py-14 text-center">
              <h2 className="text-base font-semibold text-dark-text">
                {hasFilters ? t('coreHr.onboarding.noResultsTitle') : t('coreHr.onboarding.emptyTitle')}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                {hasFilters ? t('coreHr.onboarding.noResultsDescription') : t('coreHr.onboarding.emptyDescription')}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                {hasFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    {t('coreHr.onboarding.filters.clear')}
                  </Button>
                ) : canCreate ? (
                  <Button size="sm" onClick={() => setWizardOpen(true)}>
                    + {t('coreHr.onboarding.actions.new')}
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
                <OnboardingPipelineBoard
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
              <OnboardingListTable
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

      <OnboardingDrawer
        onboardingId={drawer?.id ?? null}
        preview={drawer?.preview}
        caps={caps}
        lookups={lookups}
        locale={locale}
        onChanged={refresh}
        onToast={setToast}
        onClose={() => setDrawer(null)}
      />

      <NewOnboardingWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        lookups={lookups}
        canManageTasks={canManageTasks}
        onCreated={(created) => {
          setWizardOpen(false);
          setToast({ tone: 'success', text: t('coreHr.onboarding.wizard.created', { name: created.employeeName }) });
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

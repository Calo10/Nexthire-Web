import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { hrReportsApi } from '../api/hrReportsApi';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';
import HrToast, { type HrToastState } from '../components/HrToast';
import {
  CompensationSection,
  DocumentsSection,
  OffboardingSection,
  OnboardingSection,
  OrganizationSection,
  WorkforceSection,
} from '../components/reports/AnalyticsSections';
import ChartPanel, { PanelSkeleton } from '../components/reports/ChartPanel';
import DashboardsPanel from '../components/reports/DashboardsPanel';
import HeadcountEvolutionChart from '../components/reports/HeadcountEvolutionChart';
import InsightsList from '../components/reports/InsightsList';
import OverviewHeroMetrics from '../components/reports/OverviewHeroMetrics';
import PerformanceGaugeCard from '../components/reports/PerformanceGaugeCard';
import QuickReportsPanel from '../components/reports/QuickReportsPanel';
import ReportBuilder from '../components/reports/ReportBuilder';
import ReportLibraryGrid from '../components/reports/ReportLibraryGrid';
import ReportRunModal from '../components/reports/ReportRunModal';
import ReportsFilterBar from '../components/reports/ReportsFilterBar';
import ReportsTabBar from '../components/reports/ReportsTabBar';
import SchedulesPanel from '../components/reports/SchedulesPanel';
import WorkforceDonutChart from '../components/reports/WorkforceDonutChart';
import { useHrLookups } from '../hooks/useHrLookups';
import { useOrgResource } from '../hooks/useOrgResource';
import { REPORTS_PERMISSIONS, useReportsCapabilities } from '../hooks/useReportsCapabilities';
import {
  isReportsTab,
  type DatePreset,
  type QuickReport,
  type ReportDefinition,
  type ReportsFilters,
  type ReportsTab,
} from '../models/hrReports';
import { apiErrorMessage, downloadBlob } from '../utils/employeeFormat';
import {
  csvBlob,
  defaultFilters,
  DEFAULT_PRESET,
  formatDeltaPct,
  formatNumber,
  hashKey,
  overviewToCsvRows,
  presetRange,
} from '../utils/hrReportsFormat';

const P = REPORTS_PERMISSIONS;
const BASE_PATH = '/app/hr/reports';

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report';
}

export default function CoreHrReportsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ tab?: string }>();
  const caps = useReportsCapabilities();
  const active = caps.ready && !caps.denied;
  const lookups = useHrLookups(active);

  const canCreate = caps.can(P.Create);
  const canEdit = caps.can(P.Edit);
  const canExport = caps.has(P.Export);
  const canSchedule = caps.can(P.Schedule);
  const canManageDashboards = caps.can(P.ManageDashboards);
  const canViewHistory = caps.has(P.ViewExecutionHistory) || caps.has(P.Schedule);

  /* ---------------------------- Tabs ---------------------------- */
  const hiddenTabs = useMemo<ReportsTab[]>(() => {
    const hidden: ReportsTab[] = [];
    if (!caps.has(P.ViewWorkforce)) hidden.push('workforce');
    if (!caps.has(P.ViewOnboarding)) hidden.push('onboarding');
    if (!caps.has(P.ViewOffboarding)) hidden.push('offboarding');
    if (!caps.has(P.ViewOrganization)) hidden.push('organization');
    if (!caps.has(P.ViewCompliance)) hidden.push('documents');
    if (!caps.has(P.ViewCompensation)) hidden.push('compensation');
    if (!canCreate) hidden.push('builder');
    if (!caps.has(P.Schedule)) hidden.push('schedules');
    return hidden;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caps.capabilities, canCreate]);

  const requested: ReportsTab = isReportsTab(params.tab) ? params.tab : 'overview';
  const tab: ReportsTab = hiddenTabs.includes(requested) && caps.ready ? 'overview' : requested;
  const setTab = useCallback(
    (next: ReportsTab) => navigate(next === 'overview' ? BASE_PATH : `${BASE_PATH}/${next}`),
    [navigate],
  );
  const availableTabs = useMemo(
    () => (['overview', 'workforce', 'onboarding', 'offboarding', 'organization', 'documents', 'compensation', 'library', 'builder', 'dashboards', 'schedules'] as ReportsTab[]).filter((x) => !hiddenTabs.includes(x)),
    [hiddenTabs],
  );

  /* --------------------------- Filters -------------------------- */
  const [filters, setFilters] = useState<ReportsFilters>(defaultFilters);
  const [preset, setPreset] = useState<DatePreset>(DEFAULT_PRESET);
  const [manualReload, setManualReload] = useState(0);
  const reloadKey = useMemo(() => hashKey(JSON.stringify(filters)) + manualReload, [filters, manualReload]);

  const patchFilters = useCallback((patch: Partial<ReportsFilters>) => setFilters((f) => ({ ...f, ...patch })), []);
  const changePreset = useCallback((next: DatePreset) => {
    setPreset(next);
    if (next !== 'custom') setFilters((f) => ({ ...f, ...presetRange(next) }));
  }, []);
  const clearDimensions = useCallback(
    () => patchFilters({ departmentId: '', managerId: '', workLocationId: '', employmentTypeId: '', employmentStatus: '' }),
    [patchFilters],
  );

  const [toast, setToast] = useState<HrToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);
  const notify = useCallback((tone: 'success' | 'error', text: string) => setToast({ tone, text }), []);

  /* ----------------------------- Data --------------------------- */
  const rangeValid = !filters.from || !filters.to || filters.from <= filters.to;
  const overview = useOrgResource(
    () => hrReportsApi.overview(filters),
    active && tab === 'overview' && rangeValid,
    reloadKey,
    t('coreHr.reports.overview.loadError'),
  );

  // Library
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [libraryReload, setLibraryReload] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const needsReports = tab === 'library' || tab === 'dashboards' || tab === 'schedules';
  const library = useOrgResource(
    () => hrReportsApi.listReports(tab === 'library' ? { search: debouncedSearch, favoritesOnly } : {}),
    active && needsReports,
    libraryReload + hashKey(tab === 'library' ? `${debouncedSearch}|${favoritesOnly}` : 'all'),
    t('coreHr.reports.library.loadError'),
  );
  const reports = useMemo(() => library.data ?? [], [library.data]);

  // Builder
  const datasets = useOrgResource(() => hrReportsApi.listDatasets(), active && tab === 'builder', libraryReload, t('coreHr.reports.builder.loadError'));
  const [editing, setEditing] = useState<ReportDefinition | null>(null);

  // Run / archive / export
  const [runTarget, setRunTarget] = useState<ReportDefinition | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ReportDefinition | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const hasPermission = useCallback(
    (permission: string) => caps.capabilities.some((c) => c.toLowerCase() === permission.toLowerCase()),
    [caps.capabilities],
  );

  /* ---------------------------- Actions ------------------------- */
  const exportOverview = async () => {
    setExporting(true);
    try {
      const data = overview.data ?? (await hrReportsApi.overview(filters));
      const rows = overviewToCsvRows(data, {
        section: t('coreHr.reports.export.section'),
        metric: t('coreHr.reports.export.metric'),
        value: t('coreHr.reports.export.value'),
        previous: t('coreHr.reports.export.previous'),
        deltaPct: t('coreHr.reports.export.deltaPct'),
        headcountEvolution: t('coreHr.reports.overview.headcountEvolution'),
        department: t('coreHr.reports.overview.byDepartment'),
        metrics: {
          totalEmployees: t('coreHr.reports.kpi.totalEmployees'),
          newHires: t('coreHr.reports.kpi.newHires'),
          turnoverRate: t('coreHr.reports.kpi.turnoverRate'),
          averageTenure: t('coreHr.reports.kpi.avgTenure'),
          onboarding: t('coreHr.reports.overview.onboarding'),
          offboarding: t('coreHr.reports.overview.offboarding'),
          documents: t('coreHr.reports.overview.documents'),
        },
      });
      downloadBlob(csvBlob(rows), `people-analytics-${filters.from || 'start'}_${filters.to || 'end'}.csv`);
    } catch (err) {
      notify('error', apiErrorMessage(err, t('coreHr.reports.export.failed')));
    } finally {
      setExporting(false);
    }
  };

  const exportReport = async (report: ReportDefinition) => {
    setExporting(true);
    try {
      const res = await hrReportsApi.exportReport(report.id, 'Csv');
      if (res.kind === 'blob') {
        downloadBlob(res.blob, `${slug(report.name)}.csv`);
      } else {
        notify('success', t('coreHr.reports.export.queued'));
      }
    } catch (err) {
      notify('error', apiErrorMessage(err, t('coreHr.reports.export.failed')));
    } finally {
      setExporting(false);
    }
  };

  const toggleFavorite = async (r: ReportDefinition) => {
    try {
      if (r.isFavorite) await hrReportsApi.unfavoriteReport(r.id);
      else await hrReportsApi.favoriteReport(r.id);
      setLibraryReload((n) => n + 1);
    } catch (err) {
      notify('error', apiErrorMessage(err, t('coreHr.reports.library.actionError')));
    }
  };

  const duplicate = async (r: ReportDefinition) => {
    try {
      await hrReportsApi.duplicateReport(r.id);
      setLibraryReload((n) => n + 1);
      notify('success', t('coreHr.reports.library.duplicated'));
    } catch (err) {
      notify('error', apiErrorMessage(err, t('coreHr.reports.library.actionError')));
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await hrReportsApi.archiveReport(archiveTarget.id);
      setArchiveTarget(null);
      setLibraryReload((n) => n + 1);
      notify('success', t('coreHr.reports.library.archived'));
    } catch (err) {
      notify('error', apiErrorMessage(err, t('coreHr.reports.library.actionError')));
    } finally {
      setArchiving(false);
    }
  };

  const openBuilder = (report: ReportDefinition | null) => {
    setEditing(report);
    setTab('builder');
  };

  const selectQuickReport = (r: QuickReport) => {
    const path = r.path.trim();
    const normalized = path.replace(/^\/+/, '').replace(/^app\/hr\/reports\/?/, '');
    if (path.startsWith('/app/') && !path.startsWith(BASE_PATH)) {
      navigate(path);
    } else if (isReportsTab(normalized) && availableTabs.includes(normalized)) {
      setTab(normalized);
    } else if (isReportsTab(r.key) && availableTabs.includes(r.key)) {
      setTab(r.key);
    } else {
      setSearch(r.name);
      setTab('library');
    }
  };

  /* ----------------------------- Render ------------------------- */
  const headerActions = active ? (
    <div className="flex flex-wrap items-center gap-2">
      <ReportsFilterBar part="primary" filters={filters} preset={preset} onPresetChange={changePreset} onFiltersChange={patchFilters} />
      {canExport ? (
        <Button variant="outline" size="sm" onClick={() => void exportOverview()} disabled={exporting || !rangeValid}>
          {exporting ? t('coreHr.reports.actions.exporting') : t('coreHr.reports.actions.export')}
        </Button>
      ) : null}
      {canCreate ? (
        <Button size="sm" onClick={() => openBuilder(null)}>
          {t('coreHr.reports.actions.createReport')}
        </Button>
      ) : null}
    </div>
  ) : undefined;

  const isAnalytics = ['overview', 'workforce', 'onboarding', 'offboarding', 'organization', 'documents', 'compensation'].includes(tab);
  const o = overview.data;

  return (
    <CoreHrPageShell
      wide
      title={t('coreHr.reports.title')}
      subtitle={t('coreHr.reports.subtitle')}
      breadcrumbs={[{ label: t('modules.coreHr'), to: '/app/hr/dashboard' }, { label: t('coreHrNav.reports') }]}
      actions={headerActions}
    >
      <HrToast toast={toast} onDismiss={dismissToast} />

      {!caps.ready ? (
        <div className="space-y-4" aria-busy>
          <PanelSkeleton height={48} />
          <PanelSkeleton height={260} />
        </div>
      ) : caps.denied ? (
        <CoreHrEmptyState title={t('coreHr.reports.accessDenied.title')} description={t('coreHr.reports.accessDenied.description')} />
      ) : (
        <div className="space-y-6">
          <ReportsTabBar value={tab} onChange={setTab} hidden={hiddenTabs} />

          {isAnalytics ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ReportsFilterBar
                part="secondary"
                filters={filters}
                preset={preset}
                onPresetChange={changePreset}
                onFiltersChange={patchFilters}
                onClear={clearDimensions}
                lookups={lookups}
              />
              <button type="button" onClick={() => setManualReload((n) => n + 1)} className="text-sm font-medium text-violet-700 hover:underline">
                {t('coreHr.reports.actions.refresh')}
              </button>
            </div>
          ) : null}
          {isAnalytics && !rangeValid ? <ErrorMessage message={t('coreHr.reports.filters.invalidRange')} /> : null}

          <div role="tabpanel" id={`reports-panel-${tab}`} aria-labelledby={`reports-tab-${tab}`} className="space-y-6">
            {tab === 'overview' ? (
              overview.error && !o ? (
                <div className="space-y-3">
                  <ErrorMessage message={overview.error} />
                  <Button variant="outline" size="sm" onClick={overview.reload}>
                    {t('coreHr.reports.actions.retry')}
                  </Button>
                </div>
              ) : !o ? (
                <div className="space-y-4" aria-busy>
                  <div className="grid gap-4 lg:grid-cols-12">
                    <PanelSkeleton className="lg:col-span-5" height={220} />
                    <PanelSkeleton className="lg:col-span-7" height={220} />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-12">
                    <PanelSkeleton className="lg:col-span-8" height={340} />
                    <PanelSkeleton className="lg:col-span-4" height={340} />
                  </div>
                </div>
              ) : (
                <div className={`space-y-4 ${overview.loading ? 'opacity-70 transition-opacity' : ''}`}>
                  {overview.error ? <ErrorMessage message={overview.error} /> : null}
                  <OverviewHeroMetrics overview={o} />

                  <div className="grid gap-4 lg:grid-cols-12">
                    <ChartPanel
                      className="lg:col-span-8"
                      title={t('coreHr.reports.overview.headcountEvolution')}
                      subtitle={t('coreHr.reports.overview.headcountEvolutionSub')}
                    >
                      <HeadcountEvolutionChart data={o.headcountEvolution} name={t('coreHr.reports.kpi.totalEmployees')} />
                    </ChartPanel>
                    <ChartPanel className="lg:col-span-4" title={t('coreHr.reports.overview.byDepartment')} subtitle={t('coreHr.reports.overview.byDepartmentSub')}>
                      <div className="flex min-h-[220px] items-center">
                        <WorkforceDonutChart slices={o.workforceByDepartment} centerLabel={t('coreHr.reports.overview.employees')} />
                      </div>
                    </ChartPanel>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-12">
                    <ChartPanel className="lg:col-span-4" title={t('coreHr.reports.overview.quickReports')} subtitle={t('coreHr.reports.overview.quickReportsSub')}>
                      <QuickReportsPanel reports={o.quickReports} onSelect={selectQuickReport} onOpenTab={setTab} availableTabs={availableTabs} />
                    </ChartPanel>
                    <div className="grid gap-4 md:grid-cols-3 lg:col-span-8 lg:grid-cols-1 xl:grid-cols-3">
                      <PerformanceGaugeCard
                        title={t('coreHr.reports.overview.onboarding')}
                        percent={o.onboarding.completionPct}
                        color="#7C3AED"
                        stats={[
                          { label: t('coreHr.reports.overview.avgDays'), value: t('coreHr.reports.overview.daysValue', { value: formatNumber(o.onboarding.averageCompletionDays, i18n.language, 1) }) },
                          { label: t('coreHr.reports.overview.activeCount'), value: formatNumber(o.onboarding.active, i18n.language, 0) },
                        ]}
                        note={
                          o.onboarding.previousAverageCompletionDays != null
                            ? t('coreHr.reports.overview.daysDelta', { value: formatDeltaPct({ value: 0, previousValue: null, delta: null, deltaPct: o.onboarding.completionDaysDeltaPct, unit: null }, i18n.language) })
                            : null
                        }
                        noteTone={o.onboarding.completionDaysDeltaPct <= 0 ? 'good' : 'bad'}
                        actionLabel={availableTabs.includes('onboarding') ? t('coreHr.reports.overview.details') : undefined}
                        onAction={() => setTab('onboarding')}
                      />
                      <PerformanceGaugeCard
                        title={t('coreHr.reports.overview.offboarding')}
                        percent={o.offboarding.completionPct}
                        color="#F59E0B"
                        stats={[
                          { label: t('coreHr.reports.overview.avgDays'), value: t('coreHr.reports.overview.daysValue', { value: formatNumber(o.offboarding.averageCompletionDays, i18n.language, 1) }) },
                          { label: t('coreHr.reports.overview.activeCount'), value: formatNumber(o.offboarding.active, i18n.language, 0) },
                        ]}
                        note={
                          o.offboarding.previousAverageCompletionDays != null
                            ? t('coreHr.reports.overview.daysDelta', { value: formatDeltaPct({ value: 0, previousValue: null, delta: null, deltaPct: o.offboarding.completionDaysDeltaPct, unit: null }, i18n.language) })
                            : null
                        }
                        noteTone={o.offboarding.completionDaysDeltaPct <= 0 ? 'good' : 'bad'}
                        actionLabel={availableTabs.includes('offboarding') ? t('coreHr.reports.overview.details') : undefined}
                        onAction={() => setTab('offboarding')}
                      />
                      <PerformanceGaugeCard
                        title={t('coreHr.reports.overview.documents')}
                        percent={o.documents.completenessPct}
                        color="#0D9488"
                        stats={[
                          { label: t('coreHr.reports.kpi.expiring30'), value: formatNumber(o.documents.expiringIn30Days, i18n.language, 0) },
                          { label: t('coreHr.reports.kpi.openRequests'), value: formatNumber(o.documents.openRequests, i18n.language, 0) },
                        ]}
                        note={o.documents.expired > 0 ? t('coreHr.reports.overview.expiredNote', { count: o.documents.expired }) : null}
                        noteTone="bad"
                        actionLabel={availableTabs.includes('documents') ? t('coreHr.reports.overview.details') : undefined}
                        onAction={() => setTab('documents')}
                      />
                    </div>
                  </div>

                  <ChartPanel title={t('coreHr.reports.overview.insights')} subtitle={t('coreHr.reports.overview.insightsSub')}>
                    <InsightsList insights={o.insights} />
                  </ChartPanel>
                </div>
              )
            ) : null}

            {tab === 'workforce' ? <WorkforceSection filters={filters} reloadKey={reloadKey} canViewRetention={caps.has(P.ViewRetention)} /> : null}
            {tab === 'onboarding' ? <OnboardingSection filters={filters} reloadKey={reloadKey} /> : null}
            {tab === 'offboarding' ? <OffboardingSection filters={filters} reloadKey={reloadKey} /> : null}
            {tab === 'organization' ? <OrganizationSection filters={filters} reloadKey={reloadKey} /> : null}
            {tab === 'documents' ? <DocumentsSection filters={filters} reloadKey={reloadKey} /> : null}
            {tab === 'compensation' ? <CompensationSection filters={filters} reloadKey={reloadKey} /> : null}

            {tab === 'library' ? (
              <>
                {library.error ? (
                  <div className="space-y-3">
                    <ErrorMessage message={library.error} />
                    <Button variant="outline" size="sm" onClick={library.reload}>
                      {t('coreHr.reports.actions.retry')}
                    </Button>
                  </div>
                ) : (
                  <ReportLibraryGrid
                    reports={reports}
                    loading={library.loading}
                    search={search}
                    onSearchChange={setSearch}
                    category={category}
                    onCategoryChange={setCategory}
                    favoritesOnly={favoritesOnly}
                    onFavoritesOnlyChange={setFavoritesOnly}
                    canEdit={canEdit}
                    canCreate={canCreate}
                    onRun={setRunTarget}
                    onToggleFavorite={(r) => void toggleFavorite(r)}
                    onEdit={openBuilder}
                    onDuplicate={(r) => void duplicate(r)}
                    onArchive={setArchiveTarget}
                  />
                )}
              </>
            ) : null}

            {tab === 'builder' ? (
              <ReportBuilder
                datasets={datasets.data ?? []}
                loading={datasets.loading}
                error={datasets.error}
                onRetry={datasets.reload}
                hasPermission={hasPermission}
                editing={editing}
                canSave={editing ? canEdit : canCreate}
                filters={filters}
                onSaved={(report, created) => {
                  setEditing(null);
                  setLibraryReload((n) => n + 1);
                  notify('success', created ? t('coreHr.reports.builder.created') : t('coreHr.reports.builder.updated', { name: report.name }));
                  setTab('library');
                }}
                onCancelEdit={() => setEditing(null)}
              />
            ) : null}

            {tab === 'dashboards' ? <DashboardsPanel reports={reports} canManage={canManageDashboards} onNotify={notify} /> : null}
            {tab === 'schedules' ? <SchedulesPanel reports={reports} canSchedule={canSchedule} canViewHistory={canViewHistory} onNotify={notify} /> : null}
          </div>
        </div>
      )}

      <ReportRunModal report={runTarget} onClose={() => setRunTarget(null)} canExport={canExport} exporting={exporting} onExport={(r) => void exportReport(r)} />

      <ConfirmModal
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
        title={t('coreHr.reports.library.archiveTitle')}
        description={t('coreHr.reports.library.archiveDescription', { name: archiveTarget?.name ?? '' })}
        confirmLabel={t('coreHr.reports.library.archive')}
        tone="danger"
        busy={archiving}
      />
    </CoreHrPageShell>
  );
}

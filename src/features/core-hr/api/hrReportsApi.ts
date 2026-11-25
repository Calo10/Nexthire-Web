import { apiClient } from '../../../lib/api';
import { buildQuery } from '../../../lib/buildQuery';
import { normalizeListResponse, unwrapPayload } from '../../../lib/normalizeApiResponse';
import type {
  CompensationAnalytics,
  DocumentsAnalytics,
  DocumentsCompliance,
  ExportFormat,
  Insight,
  InsightSeverity,
  MetricValue,
  NamedCount,
  OffboardingAnalytics,
  OffboardingPerf,
  OnboardingAnalytics,
  OnboardingPerf,
  OrganizationAnalytics,
  QuickReport,
  ReportDashboard,
  ReportDashboardWidget,
  ReportDataset,
  ReportDefinition,
  ReportExecution,
  ReportExecutionResult,
  ReportExportResult,
  ReportField,
  ReportFieldType,
  ReportListQuery,
  ReportPreviewRequest,
  ReportSchedule,
  ReportsFilters,
  ReportsOverview,
  RetentionAnalytics,
  SaveDashboardRequest,
  SaveReportRequest,
  SaveScheduleRequest,
  TimeSeriesPoint,
  WorkforceAnalytics,
} from '../models/hrReports';

const BASE = '/hr/reports';
const DASHBOARDS_BASE = ['/hr/report-dashboards', `${BASE}/dashboards`];
const SCHEDULES_BASE = ['/hr/report-schedules', `${BASE}/schedules`];

/* ------------------------------------------------------------------ */
/* Defensive mappers                                                   */
/* ------------------------------------------------------------------ */

type Rec = Record<string, unknown>;

function rec(v: unknown): Rec {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Rec) : {};
}
function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v);
}
function strOrNull(v: unknown): string | null {
  return v == null || v === '' ? null : String(v);
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function bool(v: unknown): boolean {
  return v === true || v === 'true';
}

function mapMetric(raw: unknown): MetricValue {
  const r = rec(raw);
  return {
    value: num(r.value),
    previousValue: numOrNull(r.previousValue),
    delta: numOrNull(r.delta),
    deltaPct: numOrNull(r.deltaPct),
    unit: strOrNull(r.unit),
  };
}

function mapNamedCount(raw: unknown): NamedCount {
  const r = rec(raw);
  return {
    key: str(r.key ?? r.id ?? r.label),
    label: str(r.label ?? r.name ?? r.key),
    value: num(r.value ?? r.count),
    percent: numOrNull(r.percent ?? r.percentage),
  };
}
const namedCounts = (raw: unknown): NamedCount[] => arr(raw).map(mapNamedCount);

function mapPoint(raw: unknown): TimeSeriesPoint {
  const r = rec(raw);
  return {
    label: str(r.label ?? r.period),
    periodStart: str(r.periodStart ?? r.date),
    value: num(r.value ?? r.count),
  };
}
const points = (raw: unknown): TimeSeriesPoint[] => arr(raw).map(mapPoint);

function mapInsight(raw: unknown): Insight {
  const r = rec(raw);
  const sev = str(r.severity, 'Info');
  const severity: InsightSeverity = sev === 'Positive' || sev === 'Warning' ? sev : 'Info';
  return { code: str(r.code), severity, title: str(r.title), message: str(r.message) };
}

function mapPerf(raw: unknown): OnboardingPerf & OffboardingPerf {
  const r = rec(raw);
  return {
    completionPct: num(r.completionPct),
    previousCompletionPct: numOrNull(r.previousCompletionPct),
    averageCompletionDays: num(r.averageCompletionDays),
    previousAverageCompletionDays: numOrNull(r.previousAverageCompletionDays),
    completionDaysDeltaPct: num(r.completionDaysDeltaPct),
    active: num(r.active),
    completedInPeriod: num(r.completedInPeriod),
  };
}

function mapCompliance(raw: unknown): DocumentsCompliance {
  const r = rec(raw);
  return {
    completenessPct: num(r.completenessPct),
    totalDocuments: num(r.totalDocuments),
    validDocuments: num(r.validDocuments),
    expired: num(r.expired),
    expiringIn30Days: num(r.expiringIn30Days),
    openRequests: num(r.openRequests),
  };
}

function mapQuickReport(raw: unknown): QuickReport {
  const r = rec(raw);
  return { key: str(r.key), name: str(r.name), category: str(r.category), path: str(r.path) };
}

function mapOverview(raw: unknown): ReportsOverview {
  const r = rec(unwrapPayload(raw));
  return {
    periodStart: str(r.periodStart),
    periodEnd: str(r.periodEnd),
    comparisonMode: str(r.comparisonMode, 'PreviousPeriod'),
    totalEmployees: mapMetric(r.totalEmployees),
    newHires: mapMetric(r.newHires),
    turnoverRate: mapMetric(r.turnoverRate),
    averageTenureYears: mapMetric(r.averageTenureYears),
    headcountEvolution: points(r.headcountEvolution),
    workforceByDepartment: namedCounts(r.workforceByDepartment),
    onboarding: mapPerf(r.onboarding),
    offboarding: mapPerf(r.offboarding),
    documents: mapCompliance(r.documents),
    insights: arr(r.insights).map(mapInsight),
    quickReports: arr(r.quickReports).map(mapQuickReport),
  };
}

function mapWorkforce(raw: unknown): WorkforceAnalytics {
  const r = rec(unwrapPayload(raw));
  return {
    totalEmployees: mapMetric(r.totalEmployees),
    activeEmployees: mapMetric(r.activeEmployees),
    onLeave: mapMetric(r.onLeave),
    newHires: mapMetric(r.newHires),
    departures: mapMetric(r.departures),
    netGrowth: mapMetric(r.netGrowth),
    averageTenureYears: mapMetric(r.averageTenureYears),
    retentionRate: mapMetric(r.retentionRate),
    turnoverRate: mapMetric(r.turnoverRate),
    headcountEvolution: points(r.headcountEvolution),
    arrivals: points(r.arrivalsVsDeparturesArrivals ?? r.arrivals),
    departuresSeries: points(r.arrivalsVsDeparturesDepartures ?? r.departuresSeries),
    byDepartment: namedCounts(r.byDepartment),
    byLocation: namedCounts(r.byLocation),
    byEmploymentType: namedCounts(r.byEmploymentType),
    byStatus: namedCounts(r.byStatus),
    byWorkModality: namedCounts(r.byWorkModality),
    tenureBuckets: namedCounts(r.tenureBuckets),
  };
}

function mapRetention(raw: unknown): RetentionAnalytics {
  const r = rec(unwrapPayload(raw));
  return {
    turnoverRate: mapMetric(r.turnoverRate),
    retentionRate: mapMetric(r.retentionRate),
    averageTenureAtDeparture: mapMetric(r.averageTenureAtDeparture),
    departuresInPeriod: num(r.departuresInPeriod),
    monthlyTurnover: points(r.monthlyTurnover),
    departuresByDepartment: namedCounts(r.departuresByDepartment),
    departuresByEmploymentType: namedCounts(r.departuresByEmploymentType),
    separationReasons: namedCounts(r.separationReasons),
    retentionMilestones: namedCounts(r.retentionMilestones),
    separationReasonsRestricted: bool(r.separationReasonsRestricted),
  };
}

function mapOnboardingAnalytics(raw: unknown): OnboardingAnalytics {
  const r = rec(unwrapPayload(raw));
  return {
    performance: mapPerf(r.performance),
    overdueTasks: num(r.overdueTasks),
    overdueOnboardings: num(r.overdueOnboardings),
    averageProgressPercent: num(r.averageProgressPercent),
    byStatus: namedCounts(r.byStatus),
    byDepartment: namedCounts(r.byDepartment),
    completionTrend: points(r.completionTrend),
  };
}

function mapOffboardingAnalytics(raw: unknown): OffboardingAnalytics {
  const r = rec(unwrapPayload(raw));
  return {
    performance: mapPerf(r.performance),
    pendingAssetReturns: num(r.pendingAssetReturns),
    pendingAccessRevocations: num(r.pendingAccessRevocations),
    pendingClearance: num(r.pendingClearance),
    byStatus: namedCounts(r.byStatus),
    bySeparationType: namedCounts(r.bySeparationType),
    byDepartment: namedCounts(r.byDepartment),
    completionTrend: points(r.completionTrend),
  };
}

function mapOrganizationAnalytics(raw: unknown): OrganizationAnalytics {
  const r = rec(unwrapPayload(raw));
  return {
    totalDepartments: num(r.totalDepartments),
    totalTeams: num(r.totalTeams),
    totalPositions: num(r.totalPositions),
    approvedHeadcount: num(r.approvedHeadcount),
    actualHeadcount: num(r.actualHeadcount),
    occupiedPositions: num(r.occupiedPositions),
    vacantPositions: num(r.vacantPositions),
    headcountUtilizationPct: num(r.headcountUtilizationPct),
    averageSpanOfControl: num(r.averageSpanOfControl),
    organizationalDepth: num(r.organizationalDepth),
    employeesWithoutManager: num(r.employeesWithoutManager),
    employeesWithoutPosition: num(r.employeesWithoutPosition),
    utilizationByDepartment: namedCounts(r.utilizationByDepartment),
    vacanciesByDepartment: namedCounts(r.vacanciesByDepartment),
  };
}

function mapDocumentsAnalytics(raw: unknown): DocumentsAnalytics {
  const r = rec(unwrapPayload(raw));
  return {
    compliance: mapCompliance(r.compliance),
    byCategory: namedCounts(r.byCategory),
    completenessByDepartment: namedCounts(r.completenessByDepartment),
    expiringIn7Days: num(r.expiringIn7Days),
    expiringIn60Days: num(r.expiringIn60Days),
  };
}

function mapCompensation(raw: unknown): CompensationAnalytics {
  const r = rec(unwrapPayload(raw));
  return {
    available: bool(r.available),
    unavailableReason: strOrNull(r.unavailableReason),
    employeeCount: num(r.employeeCount),
    averageAnnualized: numOrNull(r.averageAnnualized),
    medianAnnualized: numOrNull(r.medianAnnualized),
    currency: strOrNull(r.currency),
    byDepartment: namedCounts(r.byDepartment),
    byJobTitle: namedCounts(r.byJobTitle),
    restrictedByCohortSize: bool(r.restrictedByCohortSize),
  };
}

function mapField(raw: unknown): ReportField {
  const r = rec(raw);
  const t = str(r.dataType, 'string').toLowerCase();
  const dataType: ReportFieldType = t === 'number' || t === 'date' || t === 'boolean' ? t : 'string';
  return {
    key: str(r.key),
    label: str(r.label ?? r.key),
    dataType,
    isDimension: bool(r.isDimension),
    isMeasure: bool(r.isMeasure),
    filterable: bool(r.filterable),
    requiredPermission: strOrNull(r.requiredPermission),
  };
}

function mapDataset(raw: unknown): ReportDataset {
  const r = rec(raw);
  return {
    key: str(r.key),
    name: str(r.name ?? r.key),
    description: str(r.description),
    requiredPermission: str(r.requiredPermission),
    fields: arr(r.fields).map(mapField),
  };
}

function mapReport(raw: unknown): ReportDefinition {
  const r = rec(unwrapPayload(raw));
  return {
    id: str(r.id),
    name: str(r.name),
    description: strOrNull(r.description),
    category: str(r.category, 'Custom'),
    datasetKey: str(r.datasetKey),
    configurationJson: str(r.configurationJson, '{}'),
    visualizationJson: strOrNull(r.visualizationJson),
    visibility: str(r.visibility, 'Private'),
    isSystem: bool(r.isSystem),
    isFavorite: bool(r.isFavorite),
    lastViewedAt: strOrNull(r.lastViewedAt),
    createdAt: str(r.createdAt),
    updatedAt: strOrNull(r.updatedAt),
    ownerUserId: strOrNull(r.ownerUserId),
  };
}

function mapExecutionResult(raw: unknown): ReportExecutionResult {
  const r = rec(unwrapPayload(raw));
  const rows = arr(r.rows).map(rec);
  const columnsRaw = arr(r.columns).map(String);
  const columns = columnsRaw.length > 0 ? columnsRaw : rows[0] ? Object.keys(rows[0]) : [];
  return {
    executionId: strOrNull(r.executionId),
    datasetKey: str(r.datasetKey),
    columns,
    rows,
    rowCount: num(r.rowCount, rows.length),
    truncatedAt: num(r.truncatedAt),
    series: r.series ? namedCounts(r.series) : null,
  };
}

function mapWidget(raw: unknown): ReportDashboardWidget {
  const r = rec(raw);
  return {
    id: str(r.id),
    reportDefinitionId: strOrNull(r.reportDefinitionId),
    widgetType: str(r.widgetType, 'Chart'),
    title: strOrNull(r.title),
    configurationJson: str(r.configurationJson, '{}'),
    gridX: num(r.gridX),
    gridY: num(r.gridY),
    gridW: num(r.gridW, 4),
    gridH: num(r.gridH, 3),
    sortOrder: num(r.sortOrder),
  };
}

function mapDashboard(raw: unknown): ReportDashboard {
  const r = rec(unwrapPayload(raw));
  return {
    id: str(r.id),
    name: str(r.name),
    description: strOrNull(r.description),
    visibility: str(r.visibility, 'Private'),
    isDefault: bool(r.isDefault),
    globalFiltersJson: strOrNull(r.globalFiltersJson),
    layoutJson: strOrNull(r.layoutJson),
    widgets: arr(r.widgets).map(mapWidget),
    createdAt: str(r.createdAt),
  };
}

function mapSchedule(raw: unknown): ReportSchedule {
  const r = rec(unwrapPayload(raw));
  return {
    id: str(r.id),
    reportDefinitionId: str(r.reportDefinitionId),
    reportName: str(r.reportName),
    name: str(r.name),
    frequency: str(r.frequency, 'Weekly'),
    timezone: str(r.timezone, 'UTC'),
    outputFormat: str(r.outputFormat, 'Csv'),
    recipientsJson: str(r.recipientsJson, '[]'),
    isActive: r.isActive !== false,
    nextRunAt: strOrNull(r.nextRunAt),
    lastRunAt: strOrNull(r.lastRunAt),
    lastStatus: strOrNull(r.lastStatus),
  };
}

function mapExecution(raw: unknown): ReportExecution {
  const r = rec(raw);
  return {
    id: str(r.id),
    reportDefinitionId: strOrNull(r.reportDefinitionId),
    scheduleId: strOrNull(r.scheduleId),
    status: str(r.status),
    startedAt: str(r.startedAt),
    completedAt: strOrNull(r.completedAt),
    durationMs: numOrNull(r.durationMs),
    rowCount: numOrNull(r.rowCount),
    outputFormat: strOrNull(r.outputFormat),
    documentId: strOrNull(r.documentId),
    errorMessage: strOrNull(r.errorMessage),
    expiresAt: strOrNull(r.expiresAt),
  };
}

/* ------------------------------------------------------------------ */
/* Path resilience: the backend may nest routes differently.           */
/* ------------------------------------------------------------------ */

function httpStatus(err: unknown): number | undefined {
  return err && typeof err === 'object' && 'status' in err ? Number((err as { status?: unknown }).status) : undefined;
}

/** Tries each candidate path in order, moving on only for 404/405 (route not found). */
async function withPaths<T>(paths: string[], call: (path: string) => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < paths.length; i += 1) {
    try {
      return await call(paths[i]);
    } catch (err) {
      lastErr = err;
      const status = httpStatus(err);
      if (i < paths.length - 1 && (status === 404 || status === 405)) continue;
      throw err;
    }
  }
  throw lastErr;
}

function filtersQuery(f?: Partial<ReportsFilters>): string {
  if (!f) return '';
  return buildQuery({
    from: f.from,
    to: f.to,
    comparison: f.comparison,
    departmentId: f.departmentId,
    managerId: f.managerId,
    workLocationId: f.workLocationId,
    employmentTypeId: f.employmentTypeId,
    employmentStatus: f.employmentStatus,
  });
}

type Section = 'overview' | 'workforce' | 'retention' | 'onboarding' | 'offboarding' | 'organization' | 'documents' | 'compensation';

function analytics<T>(section: Section, filters: Partial<ReportsFilters> | undefined, map: (raw: unknown) => T): Promise<T> {
  const qs = filtersQuery(filters);
  return withPaths([`${BASE}/analytics/${section}`, `${BASE}/${section}`], async (p) => map(await apiClient.get<unknown>(`${p}${qs}`)));
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export const hrReportsApi = {
  capabilities: async (): Promise<string[]> => {
    const raw = unwrapPayload(await apiClient.get<unknown>(`${BASE}/capabilities`));
    if (Array.isArray(raw)) return raw.map(String);
    const r = rec(raw);
    return normalizeListResponse<string>(r.capabilities ?? r.permissions ?? []).map(String);
  },

  /* Analytics */
  overview: (filters?: Partial<ReportsFilters>): Promise<ReportsOverview> => analytics('overview', filters, mapOverview),
  workforce: (filters?: Partial<ReportsFilters>): Promise<WorkforceAnalytics> => analytics('workforce', filters, mapWorkforce),
  retention: (filters?: Partial<ReportsFilters>): Promise<RetentionAnalytics> => analytics('retention', filters, mapRetention),
  onboarding: (filters?: Partial<ReportsFilters>): Promise<OnboardingAnalytics> =>
    analytics('onboarding', filters, mapOnboardingAnalytics),
  offboarding: (filters?: Partial<ReportsFilters>): Promise<OffboardingAnalytics> =>
    analytics('offboarding', filters, mapOffboardingAnalytics),
  organization: (filters?: Partial<ReportsFilters>): Promise<OrganizationAnalytics> =>
    analytics('organization', filters, mapOrganizationAnalytics),
  documents: (filters?: Partial<ReportsFilters>): Promise<DocumentsAnalytics> => analytics('documents', filters, mapDocumentsAnalytics),
  compensation: (filters?: Partial<ReportsFilters>): Promise<CompensationAnalytics> =>
    analytics('compensation', filters, mapCompensation),

  /* Datasets */
  listDatasets: async (): Promise<ReportDataset[]> =>
    withPaths([`${BASE}/datasets`, `${BASE}/analytics/datasets`], async (p) =>
      normalizeListResponse<unknown>(await apiClient.get<unknown>(p)).map(mapDataset),
    ),
  getDataset: async (key: string): Promise<ReportDataset> =>
    withPaths([`${BASE}/datasets`, `${BASE}/analytics/datasets`], async (p) =>
      mapDataset(unwrapPayload(await apiClient.get<unknown>(`${p}/${encodeURIComponent(key)}`))),
    ),

  /* Report definitions */
  listReports: async (query: ReportListQuery = {}): Promise<ReportDefinition[]> => {
    const raw = await apiClient.get<unknown>(
      `${BASE}${buildQuery({ category: query.category, search: query.search, favoritesOnly: query.favoritesOnly ? true : undefined })}`,
    );
    return normalizeListResponse<unknown>(raw).map(mapReport);
  },
  getReport: async (id: string): Promise<ReportDefinition> => mapReport(await apiClient.get<unknown>(`${BASE}/${id}`)),
  createReport: async (body: SaveReportRequest): Promise<ReportDefinition> =>
    mapReport(await apiClient.post<unknown>(BASE, body)),
  updateReport: async (id: string, body: SaveReportRequest): Promise<ReportDefinition> =>
    mapReport(await apiClient.put<unknown>(`${BASE}/${id}`, body)),
  duplicateReport: async (id: string): Promise<ReportDefinition> =>
    mapReport(await apiClient.post<unknown>(`${BASE}/${id}/duplicate`)),
  archiveReport: async (id: string): Promise<void> => {
    try {
      await apiClient.post<unknown>(`${BASE}/${id}/archive`);
    } catch (err) {
      const status = httpStatus(err);
      if (status !== 404 && status !== 405) throw err;
      await apiClient.delete<unknown>(`${BASE}/${id}`);
    }
  },
  favoriteReport: async (id: string): Promise<void> => {
    await apiClient.post<unknown>(`${BASE}/${id}/favorite`);
  },
  unfavoriteReport: async (id: string): Promise<void> => {
    await apiClient.delete<unknown>(`${BASE}/${id}/favorite`);
  },

  /* Execution */
  preview: async (body: ReportPreviewRequest): Promise<ReportExecutionResult> =>
    withPaths([`${BASE}/preview`, `${BASE}/analytics/preview`], async (p) => mapExecutionResult(await apiClient.post<unknown>(p, body))),
  execute: async (id: string): Promise<ReportExecutionResult> =>
    mapExecutionResult(await apiClient.post<unknown>(`${BASE}/${id}/execute`)),
  /**
   * Exports a saved report. CSV bodies come back as text (apiClient) and are rebuilt into a Blob (UTF-8 BOM re-added for Excel);
   * JSON bodies (generated document link) are returned as a `link` result.
   */
  exportReport: async (id: string, format: ExportFormat = 'Csv'): Promise<ReportExportResult> => {
    const raw = await apiClient.post<unknown>(`${BASE}/${id}/export`, { format });
    if (typeof raw === 'string') {
      return { kind: 'blob', blob: new Blob(['\uFEFF', raw], { type: 'text/csv;charset=utf-8' }), filename: `report-${id}.csv` };
    }
    const r = rec(unwrapPayload(raw));
    return {
      kind: 'link',
      executionId: str(r.executionId),
      format: str(r.format, format),
      documentId: strOrNull(r.documentId),
      downloadPath: strOrNull(r.downloadPath),
      rowCount: num(r.rowCount),
      expiresAt: strOrNull(r.expiresAt),
    };
  },

  /* Dashboards */
  listDashboards: async (): Promise<ReportDashboard[]> =>
    withPaths(DASHBOARDS_BASE, async (p) => normalizeListResponse<unknown>(await apiClient.get<unknown>(p)).map(mapDashboard)),
  getDashboard: async (id: string): Promise<ReportDashboard> =>
    withPaths(DASHBOARDS_BASE, async (p) => mapDashboard(await apiClient.get<unknown>(`${p}/${id}`))),
  saveDashboard: async (body: SaveDashboardRequest, id?: string): Promise<ReportDashboard> =>
    withPaths(DASHBOARDS_BASE, async (p) =>
      mapDashboard(id ? await apiClient.put<unknown>(`${p}/${id}`, body) : await apiClient.post<unknown>(p, body)),
    ),
  deleteDashboard: async (id: string): Promise<void> => {
    await withPaths(DASHBOARDS_BASE, (p) => apiClient.delete<unknown>(`${p}/${id}`));
  },

  /* Schedules */
  listSchedules: async (): Promise<ReportSchedule[]> =>
    withPaths(SCHEDULES_BASE, async (p) => normalizeListResponse<unknown>(await apiClient.get<unknown>(p)).map(mapSchedule)),
  saveSchedule: async (body: SaveScheduleRequest): Promise<ReportSchedule> => {
    const { id, ...payload } = body;
    return withPaths(SCHEDULES_BASE, async (p) =>
      mapSchedule(id ? await apiClient.put<unknown>(`${p}/${id}`, payload) : await apiClient.post<unknown>(p, payload)),
    );
  },
  pauseSchedule: async (id: string): Promise<void> => {
    await withPaths(SCHEDULES_BASE, (p) => apiClient.post<unknown>(`${p}/${id}/pause`));
  },
  resumeSchedule: async (id: string): Promise<void> => {
    await withPaths(SCHEDULES_BASE, (p) => apiClient.post<unknown>(`${p}/${id}/resume`));
  },
  runSchedule: async (id: string): Promise<void> => {
    await withPaths(SCHEDULES_BASE, (p) => apiClient.post<unknown>(`${p}/${id}/run`));
  },
  scheduleHistory: async (id: string): Promise<ReportExecution[]> =>
    withPaths(
      SCHEDULES_BASE.flatMap((p) => [`${p}/${id}/history`, `${p}/${id}/executions`]),
      async (p) => normalizeListResponse<unknown>(await apiClient.get<unknown>(p)).map(mapExecution),
    ),
};

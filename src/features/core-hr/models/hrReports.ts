/* ------------------------------------------------------------------ */
/* Permissions / tabs                                                  */
/* ------------------------------------------------------------------ */

export const REPORTS_PERMISSIONS = {
  View: 'Reports.View',
  ViewWorkforce: 'Reports.ViewWorkforce',
  ViewRetention: 'Reports.ViewRetention',
  ViewOnboarding: 'Reports.ViewOnboarding',
  ViewOffboarding: 'Reports.ViewOffboarding',
  ViewOrganization: 'Reports.ViewOrganization',
  ViewCompliance: 'Reports.ViewCompliance',
  ViewCompensation: 'Reports.ViewCompensation',
  Create: 'Reports.Create',
  Edit: 'Reports.Edit',
  Share: 'Reports.Share',
  Export: 'Reports.Export',
  Schedule: 'Reports.Schedule',
  ManageDashboards: 'Reports.ManageDashboards',
  ManageOrganizationReports: 'Reports.ManageOrganizationReports',
  ViewExecutionHistory: 'Reports.ViewExecutionHistory',
} as const;

export type ReportsPermission = (typeof REPORTS_PERMISSIONS)[keyof typeof REPORTS_PERMISSIONS];

export const REPORTS_TABS = [
  'overview',
  'workforce',
  'onboarding',
  'offboarding',
  'organization',
  'documents',
  'compensation',
  'library',
  'builder',
  'dashboards',
  'schedules',
] as const;

export type ReportsTab = (typeof REPORTS_TABS)[number];

export const ANALYTICS_TABS = ['overview', 'workforce', 'onboarding', 'offboarding', 'organization', 'documents', 'compensation'] as const;
export type AnalyticsTab = (typeof ANALYTICS_TABS)[number];

export function isReportsTab(v: string | null | undefined): v is ReportsTab {
  return !!v && (REPORTS_TABS as readonly string[]).includes(v);
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

export const DATE_PRESETS = ['thisMonth', 'lastMonth', 'last3Months', 'last6Months', 'last12Months', 'thisYear', 'custom'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export const COMPARISON_MODES = ['PreviousPeriod', 'PreviousMonth', 'PreviousQuarter', 'PreviousYear', 'None'] as const;
export type ComparisonMode = (typeof COMPARISON_MODES)[number];

export type ReportsFilters = {
  /** ISO date (yyyy-MM-dd). */
  from: string;
  to: string;
  comparison: ComparisonMode;
  departmentId: string;
  managerId: string;
  workLocationId: string;
  employmentTypeId: string;
  employmentStatus: string;
};

/* ------------------------------------------------------------------ */
/* Shared analytics shapes                                             */
/* ------------------------------------------------------------------ */

export type MetricValue = {
  value: number;
  previousValue: number | null;
  delta: number | null;
  deltaPct: number | null;
  unit: string | null;
};

export type NamedCount = {
  key: string;
  label: string;
  value: number;
  percent: number | null;
};

export type TimeSeriesPoint = {
  label: string;
  periodStart: string;
  value: number;
};

export type InsightSeverity = 'Info' | 'Positive' | 'Warning';

export type Insight = {
  code: string;
  severity: InsightSeverity;
  title: string;
  message: string;
};

export type OnboardingPerf = {
  completionPct: number;
  previousCompletionPct: number | null;
  averageCompletionDays: number;
  previousAverageCompletionDays: number | null;
  completionDaysDeltaPct: number;
  active: number;
  completedInPeriod: number;
};

export type OffboardingPerf = OnboardingPerf;

export type DocumentsCompliance = {
  completenessPct: number;
  totalDocuments: number;
  validDocuments: number;
  expired: number;
  expiringIn30Days: number;
  openRequests: number;
};

export type QuickReport = {
  key: string;
  name: string;
  category: string;
  path: string;
};

/* ------------------------------------------------------------------ */
/* Analytics sections                                                  */
/* ------------------------------------------------------------------ */

export type ReportsOverview = {
  periodStart: string;
  periodEnd: string;
  comparisonMode: string;
  totalEmployees: MetricValue;
  newHires: MetricValue;
  turnoverRate: MetricValue;
  averageTenureYears: MetricValue;
  headcountEvolution: TimeSeriesPoint[];
  workforceByDepartment: NamedCount[];
  onboarding: OnboardingPerf;
  offboarding: OffboardingPerf;
  documents: DocumentsCompliance;
  insights: Insight[];
  quickReports: QuickReport[];
};

export type WorkforceAnalytics = {
  totalEmployees: MetricValue;
  activeEmployees: MetricValue;
  onLeave: MetricValue;
  newHires: MetricValue;
  departures: MetricValue;
  netGrowth: MetricValue;
  averageTenureYears: MetricValue;
  retentionRate: MetricValue;
  turnoverRate: MetricValue;
  headcountEvolution: TimeSeriesPoint[];
  arrivals: TimeSeriesPoint[];
  departuresSeries: TimeSeriesPoint[];
  byDepartment: NamedCount[];
  byLocation: NamedCount[];
  byEmploymentType: NamedCount[];
  byStatus: NamedCount[];
  byWorkModality: NamedCount[];
  tenureBuckets: NamedCount[];
};

export type RetentionAnalytics = {
  turnoverRate: MetricValue;
  retentionRate: MetricValue;
  averageTenureAtDeparture: MetricValue;
  departuresInPeriod: number;
  monthlyTurnover: TimeSeriesPoint[];
  departuresByDepartment: NamedCount[];
  departuresByEmploymentType: NamedCount[];
  separationReasons: NamedCount[];
  retentionMilestones: NamedCount[];
  separationReasonsRestricted: boolean;
};

export type OnboardingAnalytics = {
  performance: OnboardingPerf;
  overdueTasks: number;
  overdueOnboardings: number;
  averageProgressPercent: number;
  byStatus: NamedCount[];
  byDepartment: NamedCount[];
  completionTrend: TimeSeriesPoint[];
};

export type OffboardingAnalytics = {
  performance: OffboardingPerf;
  pendingAssetReturns: number;
  pendingAccessRevocations: number;
  pendingClearance: number;
  byStatus: NamedCount[];
  bySeparationType: NamedCount[];
  byDepartment: NamedCount[];
  completionTrend: TimeSeriesPoint[];
};

export type OrganizationAnalytics = {
  totalDepartments: number;
  totalTeams: number;
  totalPositions: number;
  approvedHeadcount: number;
  actualHeadcount: number;
  occupiedPositions: number;
  vacantPositions: number;
  headcountUtilizationPct: number;
  averageSpanOfControl: number;
  organizationalDepth: number;
  employeesWithoutManager: number;
  employeesWithoutPosition: number;
  utilizationByDepartment: NamedCount[];
  vacanciesByDepartment: NamedCount[];
};

export type DocumentsAnalytics = {
  compliance: DocumentsCompliance;
  byCategory: NamedCount[];
  completenessByDepartment: NamedCount[];
  expiringIn7Days: number;
  expiringIn60Days: number;
};

export type CompensationAnalytics = {
  available: boolean;
  unavailableReason: string | null;
  employeeCount: number;
  averageAnnualized: number | null;
  medianAnnualized: number | null;
  currency: string | null;
  byDepartment: NamedCount[];
  byJobTitle: NamedCount[];
  restrictedByCohortSize: boolean;
};

/* ------------------------------------------------------------------ */
/* Datasets / report definitions                                       */
/* ------------------------------------------------------------------ */

export type ReportFieldType = 'string' | 'number' | 'date' | 'boolean';

export type ReportField = {
  key: string;
  label: string;
  dataType: ReportFieldType;
  isDimension: boolean;
  isMeasure: boolean;
  filterable: boolean;
  requiredPermission: string | null;
};

export type ReportDataset = {
  key: string;
  name: string;
  description: string;
  requiredPermission: string;
  fields: ReportField[];
};

export type ReportVisibility = 'Private' | 'Organization' | string;

export type ReportDefinition = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  datasetKey: string;
  configurationJson: string;
  visualizationJson: string | null;
  visibility: ReportVisibility;
  isSystem: boolean;
  isFavorite: boolean;
  lastViewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  ownerUserId: string | null;
};

export type SaveReportRequest = {
  name: string;
  description?: string | null;
  category: string;
  datasetKey: string;
  configurationJson: string;
  visualizationJson?: string | null;
  visibility: ReportVisibility;
};

export type ReportListQuery = {
  category?: string;
  search?: string;
  favoritesOnly?: boolean;
};

export type ReportPreviewRequest = {
  datasetKey: string;
  configurationJson: string;
  from?: string;
  to?: string;
  departmentId?: string;
  limit?: number;
};

export type ReportExecutionResult = {
  executionId: string | null;
  datasetKey: string;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  truncatedAt: number;
  series: NamedCount[] | null;
};

export type ExportFormat = 'Csv' | 'Excel';

export type ReportExportResult =
  | { kind: 'blob'; blob: Blob; filename: string }
  | { kind: 'link'; executionId: string; format: string; documentId: string | null; downloadPath: string | null; rowCount: number; expiresAt: string | null };

/** Builder configuration (serialized into `ConfigurationJson`). */
export type ReportChartType = 'table' | 'bar' | 'line' | 'area' | 'donut';

export type ReportFilterOperator = 'eq' | 'neq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte';

export type ReportFilterClause = { field: string; operator: ReportFilterOperator; value: string };

export type ReportConfiguration = {
  dimensions: string[];
  measures: string[];
  filters: ReportFilterClause[];
  chartType: ReportChartType;
  limit?: number;
};

export const EMPTY_REPORT_CONFIG: ReportConfiguration = {
  dimensions: [],
  measures: [],
  filters: [],
  chartType: 'table',
};

/* ------------------------------------------------------------------ */
/* Dashboards / schedules                                              */
/* ------------------------------------------------------------------ */

export type ReportDashboardWidget = {
  id: string;
  reportDefinitionId: string | null;
  widgetType: string;
  title: string | null;
  configurationJson: string;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  sortOrder: number;
};

export type ReportDashboard = {
  id: string;
  name: string;
  description: string | null;
  visibility: ReportVisibility;
  isDefault: boolean;
  globalFiltersJson: string | null;
  layoutJson: string | null;
  widgets: ReportDashboardWidget[];
  createdAt: string;
};

export type SaveDashboardWidgetRequest = {
  id?: string | null;
  reportDefinitionId?: string | null;
  widgetType: string;
  title?: string | null;
  configurationJson: string;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  sortOrder: number;
};

export type SaveDashboardRequest = {
  name: string;
  description?: string | null;
  visibility: ReportVisibility;
  isDefault: boolean;
  globalFiltersJson?: string | null;
  layoutJson?: string | null;
  widgets?: SaveDashboardWidgetRequest[];
};

export const SCHEDULE_FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly'] as const;
export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];

export type ReportSchedule = {
  id: string;
  reportDefinitionId: string;
  reportName: string;
  name: string;
  frequency: string;
  timezone: string;
  outputFormat: string;
  recipientsJson: string;
  isActive: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastStatus: string | null;
};

export type SaveScheduleRequest = {
  id?: string;
  reportDefinitionId: string;
  name: string;
  frequency: string;
  scheduleJson?: string | null;
  timezone: string;
  outputFormat: string;
  recipientsJson: string;
  isActive: boolean;
  nextRunAt?: string | null;
};

export type ReportExecution = {
  id: string;
  reportDefinitionId: string | null;
  scheduleId: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  rowCount: number | null;
  outputFormat: string | null;
  documentId: string | null;
  errorMessage: string | null;
  expiresAt: string | null;
};

export const ORGANIZATION_PERMISSIONS = {
  View: 'Organization.View',
  ViewPeople: 'Organization.ViewPeople',
  ManageDepartments: 'Organization.ManageDepartments',
  ManagePositions: 'Organization.ManagePositions',
  ManageReporting: 'Organization.ManageReporting',
  ManageLocations: 'Organization.ManageLocations',
  ManageLevels: 'Organization.ManageLevels',
  ManageHeadcount: 'Organization.ManageHeadcount',
  AssignEmployees: 'Organization.AssignEmployees',
  TransferEmployees: 'Organization.TransferEmployees',
  ViewAnalytics: 'Organization.ViewAnalytics',
  ViewHistory: 'Organization.ViewHistory',
  Import: 'Organization.Import',
  Export: 'Organization.Export',
  ManageSettings: 'Organization.ManageSettings',
} as const;

export type OrganizationPermission = (typeof ORGANIZATION_PERMISSIONS)[keyof typeof ORGANIZATION_PERMISSIONS];

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

export type OrgPersonRef = {
  id: string;
  name: string;
  jobTitle?: string | null;
  photoUrl?: string | null;
};

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

export interface OrganizationSummary {
  totalEmployees: number;
  totalDepartments: number;
  totalPositions: number;
  averageSpanOfControl: number;
  openPositions?: number;
  vacantHeadcount?: number;
  totalLocations?: number;
  employeesWithoutManager?: number;
  maxDepth?: number;
}

/* ------------------------------------------------------------------ */
/* Departments                                                         */
/* ------------------------------------------------------------------ */

export interface DepartmentNode {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parentDepartmentId?: string | null;
  headEmployeeId?: string | null;
  headName?: string | null;
  headPhotoUrl?: string | null;
  headJobTitle?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  /** Employees in this department including descendants. */
  employeeCount: number;
  /** Employees directly assigned to this department. */
  directEmployeeCount: number;
  positionCount: number;
  openPositionCount: number;
  /** Approved headcount budget (null when not configured). */
  budgetedHeadcount?: number | null;
  /** Filled / budgeted headcount, 0..100+ (null when no budget). */
  utilizationPercent?: number | null;
  isActive: boolean;
  members: OrgPersonRef[];
  children: DepartmentNode[];
}

export interface DepartmentChartRoot {
  id?: string | null;
  name: string;
  totalEmployees: number;
  totalDepartments: number;
  logoUrl?: string | null;
}

export interface DepartmentChart {
  root: DepartmentChartRoot;
  departments: DepartmentNode[];
}

export interface DepartmentSummary {
  departmentId: string;
  employeeCount: number;
  directEmployeeCount: number;
  subDepartmentCount: number;
  positionCount: number;
  openPositionCount: number;
  filledPositionCount: number;
  budgetedHeadcount?: number | null;
  utilizationPercent?: number | null;
  averageSpanOfControl?: number | null;
  recentHires?: number;
  recentExits?: number;
}

export interface DepartmentDetail extends Omit<DepartmentNode, 'children' | 'members'> {
  children?: DepartmentNode[];
  members?: OrgPersonRef[];
  parentDepartmentName?: string | null;
}

export interface DepartmentListItem extends Omit<DepartmentNode, 'children'> {
  parentDepartmentName?: string | null;
}

export interface CreateDepartmentRequest {
  name: string;
  code?: string | null;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  parentDepartmentId?: string | null;
  headEmployeeId?: string | null;
  locationId?: string | null;
  budgetedHeadcount?: number | null;
}

export type UpdateDepartmentRequest = Partial<CreateDepartmentRequest>;

export interface MoveDepartmentRequest {
  newParentDepartmentId: string | null;
}

/* ------------------------------------------------------------------ */
/* People chart                                                        */
/* ------------------------------------------------------------------ */

export interface PeopleChartNode {
  employeeId: string;
  name: string;
  jobTitle?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  photoUrl?: string | null;
  managerId?: string | null;
  directReports: number;
  totalReports: number;
  children: PeopleChartNode[];
}

export interface PeopleChart {
  root: PeopleChartNode | null;
  /** Additional roots when several employees have no manager. */
  roots: PeopleChartNode[];
  truncated?: boolean;
}

export interface PeopleChartParams {
  rootEmployeeId?: string;
  maxDepth?: number;
}

/* ------------------------------------------------------------------ */
/* Positions                                                           */
/* ------------------------------------------------------------------ */

export const POSITION_STATUSES = ['Open', 'Filled', 'Partial', 'Archived'] as const;
export type PositionStatus = (typeof POSITION_STATUSES)[number];

export interface PositionOccupant {
  employeeId: string;
  name: string;
  jobTitle?: string | null;
  photoUrl?: string | null;
  startDate?: string | null;
}

export interface OrgPosition {
  id: string;
  title: string;
  code?: string | null;
  description?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  levelId?: string | null;
  levelName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  reportsToPositionId?: string | null;
  reportsToPositionName?: string | null;
  headcount: number;
  filledCount: number;
  openCount: number;
  status: string;
  isActive: boolean;
  occupants: OrgPersonRef[];
}

export interface PositionChartNode {
  id: string;
  title: string;
  departmentId?: string | null;
  departmentName?: string | null;
  levelName?: string | null;
  headcount: number;
  filledCount: number;
  reportsToPositionId?: string | null;
  occupants: OrgPersonRef[];
  children: PositionChartNode[];
}

export interface PositionChart {
  roots: PositionChartNode[];
}

export interface PositionChartParams {
  departmentId?: string;
}

export interface PositionListQuery {
  search?: string;
  departmentId?: string;
  levelId?: string;
  locationId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CreatePositionRequest {
  title: string;
  code?: string | null;
  description?: string | null;
  departmentId: string;
  levelId?: string | null;
  locationId?: string | null;
  reportsToPositionId?: string | null;
  headcount?: number | null;
}

export type UpdatePositionRequest = Partial<CreatePositionRequest>;

export interface AssignPositionRequest {
  employeeId: string;
  effectiveDate?: string | null;
}

export interface UnassignPositionRequest {
  employeeId: string;
  reason?: string | null;
}

/* ------------------------------------------------------------------ */
/* Levels / locations                                                  */
/* ------------------------------------------------------------------ */

export interface OrgLevel {
  id: string;
  name: string;
  code?: string | null;
  rank: number;
  description?: string | null;
  positionCount: number;
  isActive: boolean;
}

export interface OrgLocation {
  id: string;
  name: string;
  code?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  timezone?: string | null;
  isHeadquarters: boolean;
  isRemote: boolean;
  employeeCount: number;
  departmentCount: number;
  isActive: boolean;
}

export interface SaveOrgLocationRequest {
  name: string;
  code?: string | null;
  addressLine?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  timezone?: string | null;
  isHeadquarters?: boolean;
  isRemote?: boolean;
}

/* ------------------------------------------------------------------ */
/* Reporting                                                           */
/* ------------------------------------------------------------------ */

export interface ReportingManager extends OrgPersonRef {
  departmentName?: string | null;
  directReports: number;
  totalReports: number;
}

export interface ReportingOrphan extends OrgPersonRef {
  departmentName?: string | null;
}

export interface ReportingOverview {
  averageSpanOfControl: number;
  maxSpanOfControl: number;
  maxDepth: number;
  managerCount: number;
  orphanCount: number;
  managers: ReportingManager[];
  orphans: ReportingOrphan[];
}

export interface ChangeManagerRequest {
  employeeId: string;
  newManagerId: string | null;
  effectiveDate?: string | null;
  reason?: string | null;
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

export interface OrganizationActivity {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  entityName?: string | null;
  description?: string | null;
  actorName?: string | null;
  createdAt: string;
}

export interface OrganizationActivityQuery {
  entityType?: string;
  entityId?: string;
  page?: number;
  pageSize?: number;
}

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */

export const ORG_CHART_MODES = ['departments', 'people', 'positions'] as const;
export type OrgChartMode = (typeof ORG_CHART_MODES)[number];

export const ORG_TABS = ['chart', 'departments', 'positions', 'reporting', 'locations', 'settings'] as const;
export type OrgTab = (typeof ORG_TABS)[number];

export type OrgSelection =
  | { kind: 'company' }
  | { kind: 'department'; id: string }
  | { kind: 'person'; id: string }
  | { kind: 'position'; id: string };

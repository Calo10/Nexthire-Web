import { apiClient } from '../../../lib/api';
import { buildQuery } from '../../../lib/buildQuery';
import {
  normalizeListResponse,
  normalizePagedResult,
  unwrapPayload,
  type PagedResult,
} from '../../../lib/normalizeApiResponse';
import type {
  AssignPositionRequest,
  ChangeManagerRequest,
  CreateDepartmentRequest,
  CreatePositionRequest,
  DepartmentChart,
  DepartmentDetail,
  DepartmentListItem,
  DepartmentNode,
  DepartmentSummary,
  MoveDepartmentRequest,
  OrgLevel,
  OrgLocation,
  OrgPersonRef,
  OrgPosition,
  OrganizationActivity,
  OrganizationActivityQuery,
  OrganizationSummary,
  PeopleChart,
  PeopleChartNode,
  PeopleChartParams,
  PositionChart,
  PositionChartNode,
  PositionChartParams,
  PositionListQuery,
  ReportingManager,
  ReportingOrphan,
  ReportingOverview,
  SaveOrgLocationRequest,
  UnassignPositionRequest,
  UpdateDepartmentRequest,
  UpdatePositionRequest,
} from '../models/organization';

const BASE = '/hr/organization';

/* ------------------------------------------------------------------ */
/* Defensive mappers: the backend may omit optional fields.            */
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
function str(v: unknown): string {
  return v == null ? '' : String(v);
}
function strOrNull(v: unknown): string | null {
  return v == null || v === '' ? null : String(v);
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function personRef(raw: unknown): OrgPersonRef {
  const r = rec(raw);
  return {
    id: str(r.id ?? r.employeeId),
    name: str(r.name ?? r.displayName ?? r.fullName),
    jobTitle: strOrNull(r.jobTitle ?? r.title),
    photoUrl: strOrNull(r.photoUrl ?? r.avatarUrl),
  };
}

function mapSummary(raw: unknown): OrganizationSummary {
  const r = rec(unwrapPayload(raw));
  return {
    totalEmployees: num(r.totalEmployees),
    totalDepartments: num(r.totalDepartments ?? r.departmentCount),
    totalPositions: num(r.totalPositions ?? r.positionCount),
    averageSpanOfControl: num(r.averageSpanOfControl ?? r.avgSpanOfControl),
    openPositions: r.openPositions != null ? num(r.openPositions) : undefined,
    vacantHeadcount: r.vacantHeadcount != null ? num(r.vacantHeadcount) : undefined,
    totalLocations: r.totalLocations != null ? num(r.totalLocations) : undefined,
    employeesWithoutManager: r.employeesWithoutManager != null ? num(r.employeesWithoutManager) : undefined,
    maxDepth: r.maxDepth != null ? num(r.maxDepth) : undefined,
  };
}

function mapDepartmentBase(raw: unknown): Omit<DepartmentNode, 'children'> {
  const r = rec(raw);
  const head = rec(r.head);
  return {
    id: str(r.id),
    name: str(r.name),
    code: strOrNull(r.code),
    description: strOrNull(r.description),
    color: strOrNull(r.color),
    icon: strOrNull(r.icon),
    parentDepartmentId: strOrNull(r.parentDepartmentId ?? r.parentId),
    headEmployeeId: strOrNull(r.headEmployeeId ?? head.id ?? head.employeeId),
    headName: strOrNull(r.headName ?? r.headEmployeeName ?? head.name),
    headPhotoUrl: strOrNull(r.headPhotoUrl ?? head.photoUrl),
    headJobTitle: strOrNull(r.headJobTitle ?? head.jobTitle),
    locationId: strOrNull(r.locationId),
    locationName: strOrNull(r.locationName),
    employeeCount: num(r.employeeCount ?? r.totalEmployeeCount ?? r.headcount),
    directEmployeeCount: num(r.directEmployeeCount ?? r.employeeCount ?? r.headcount),
    positionCount: num(r.positionCount),
    openPositionCount: num(r.openPositionCount ?? r.openPositions),
    budgetedHeadcount: numOrNull(r.budgetedHeadcount),
    utilizationPercent: numOrNull(r.utilizationPercent ?? r.utilization),
    isActive: r.isActive !== false,
    members: arr(r.members ?? r.topMembers).map(personRef).filter((p) => p.id || p.name),
  };
}

function mapDepartmentNode(raw: unknown): DepartmentNode {
  const r = rec(raw);
  return {
    ...mapDepartmentBase(raw),
    children: arr(r.children ?? r.subDepartments).map(mapDepartmentNode),
  };
}

/** If the backend returns a flat list (parentDepartmentId only), nest it. Already-nested payloads pass through. */
function nestDepartments(list: DepartmentNode[]): DepartmentNode[] {
  if (list.some((d) => d.children.length > 0)) return list;
  const byId = new Map(list.map((d) => [d.id, d]));
  const roots: DepartmentNode[] = [];
  for (const d of list) {
    const parent = d.parentDepartmentId ? byId.get(d.parentDepartmentId) : undefined;
    if (parent && parent !== d) parent.children.push(d);
    else roots.push(d);
  }
  return roots;
}

function mapDepartmentChart(raw: unknown): DepartmentChart {
  const r = rec(unwrapPayload(raw));
  const root = rec(r.root);
  const departments = nestDepartments(arr(r.departments).map(mapDepartmentNode));
  return {
    root: {
      id: strOrNull(root.id),
      name: str(root.name ?? root.companyName),
      totalEmployees: num(root.totalEmployees ?? root.employeeCount),
      totalDepartments: num(root.totalDepartments ?? root.departmentCount),
      logoUrl: strOrNull(root.logoUrl),
    },
    departments,
  };
}

function mapPeopleNode(raw: unknown): PeopleChartNode {
  const r = rec(raw);
  const children = arr(r.children ?? r.reports ?? r.directReportNodes).map(mapPeopleNode);
  return {
    employeeId: str(r.employeeId ?? r.id),
    name: str(r.name ?? r.displayName ?? r.fullName),
    jobTitle: strOrNull(r.jobTitle ?? r.title),
    departmentId: strOrNull(r.departmentId),
    departmentName: strOrNull(r.departmentName),
    photoUrl: strOrNull(r.photoUrl ?? r.avatarUrl),
    managerId: strOrNull(r.managerId),
    directReports: num(r.directReports ?? r.directReportCount, children.length),
    totalReports: num(r.totalReports ?? r.totalReportCount, children.length),
    children,
  };
}

function mapPeopleChart(raw: unknown): PeopleChart {
  const r = rec(unwrapPayload(raw));
  const rootsRaw = Array.isArray(r.roots) ? r.roots : r.root ? [r.root] : Array.isArray(unwrapPayload(raw)) ? (unwrapPayload(raw) as unknown[]) : [];
  const roots = rootsRaw.map(mapPeopleNode).filter((n) => n.employeeId);
  return { root: roots[0] ?? null, roots, truncated: r.truncated === true };
}

function mapPositionChartNode(raw: unknown): PositionChartNode {
  const r = rec(raw);
  const headcount = num(r.headcount ?? r.budgetedHeadcount, 1);
  const occupants = arr(r.occupants ?? r.employees).map(personRef);
  return {
    id: str(r.id),
    title: str(r.title ?? r.name),
    departmentId: strOrNull(r.departmentId),
    departmentName: strOrNull(r.departmentName),
    levelName: strOrNull(r.levelName),
    headcount,
    filledCount: num(r.filledCount ?? r.occupiedCount, occupants.length),
    reportsToPositionId: strOrNull(r.reportsToPositionId ?? r.parentPositionId),
    occupants,
    children: arr(r.children).map(mapPositionChartNode),
  };
}

/** Accepts either nested (`roots`/`root` with children) or flat (`positions` with reportsToPositionId) shapes. */
function mapPositionChart(raw: unknown): PositionChart {
  const u = unwrapPayload(raw);
  const r = rec(u);
  if (Array.isArray(r.roots)) return { roots: r.roots.map(mapPositionChartNode) };
  if (r.root) return { roots: [mapPositionChartNode(r.root)] };
  const list = Array.isArray(r.positions) ? r.positions : Array.isArray(u) ? (u as unknown[]) : [];
  const nodes = list.map(mapPositionChartNode);
  const hasNested = nodes.some((n) => n.children.length > 0);
  if (hasNested) return { roots: nodes.filter((n) => !n.reportsToPositionId) };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots: PositionChartNode[] = [];
  for (const n of nodes) {
    const parent = n.reportsToPositionId ? byId.get(n.reportsToPositionId) : undefined;
    if (parent && parent !== n) parent.children.push(n);
    else roots.push(n);
  }
  return { roots };
}

function mapPosition(raw: unknown): OrgPosition {
  const r = rec(unwrapPayload(raw));
  const headcount = num(r.headcount ?? r.budgetedHeadcount, 1);
  const occupants = arr(r.occupants ?? r.employees).map(personRef);
  const filled = num(r.filledCount ?? r.occupiedCount, occupants.length);
  return {
    id: str(r.id),
    title: str(r.title ?? r.name),
    code: strOrNull(r.code),
    description: strOrNull(r.description),
    departmentId: strOrNull(r.departmentId),
    departmentName: strOrNull(r.departmentName),
    levelId: strOrNull(r.levelId),
    levelName: strOrNull(r.levelName),
    locationId: strOrNull(r.locationId),
    locationName: strOrNull(r.locationName),
    reportsToPositionId: strOrNull(r.reportsToPositionId),
    reportsToPositionName: strOrNull(r.reportsToPositionName),
    headcount,
    filledCount: filled,
    openCount: num(r.openCount ?? r.vacancies, Math.max(0, headcount - filled)),
    status: str(r.status) || (filled >= headcount ? 'Filled' : filled > 0 ? 'Partial' : 'Open'),
    isActive: r.isActive !== false,
    occupants,
  };
}

function mapLevel(raw: unknown): OrgLevel {
  const r = rec(raw);
  return {
    id: str(r.id),
    name: str(r.name),
    code: strOrNull(r.code),
    rank: num(r.rank ?? r.order ?? r.sortOrder),
    description: strOrNull(r.description),
    positionCount: num(r.positionCount),
    isActive: r.isActive !== false,
  };
}

function mapLocation(raw: unknown): OrgLocation {
  const r = rec(unwrapPayload(raw));
  return {
    id: str(r.id),
    name: str(r.name),
    code: strOrNull(r.code),
    addressLine: strOrNull(r.addressLine ?? r.address),
    city: strOrNull(r.city),
    state: strOrNull(r.state),
    country: strOrNull(r.country),
    timezone: strOrNull(r.timezone),
    isHeadquarters: r.isHeadquarters === true,
    isRemote: r.isRemote === true,
    employeeCount: num(r.employeeCount),
    departmentCount: num(r.departmentCount),
    isActive: r.isActive !== false,
  };
}

function mapReporting(raw: unknown): ReportingOverview {
  const r = rec(unwrapPayload(raw));
  const managers: ReportingManager[] = arr(r.managers).map((m) => {
    const x = rec(m);
    return {
      ...personRef(m),
      departmentName: strOrNull(x.departmentName),
      directReports: num(x.directReports ?? x.directReportCount),
      totalReports: num(x.totalReports ?? x.totalReportCount),
    };
  });
  const orphans: ReportingOrphan[] = arr(r.orphans ?? r.employeesWithoutManager).map((o) => ({
    ...personRef(o),
    departmentName: strOrNull(rec(o).departmentName),
  }));
  return {
    averageSpanOfControl: num(r.averageSpanOfControl ?? r.avgSpanOfControl),
    maxSpanOfControl: num(r.maxSpanOfControl),
    maxDepth: num(r.maxDepth),
    managerCount: num(r.managerCount, managers.length),
    orphanCount: num(r.orphanCount, orphans.length),
    managers,
    orphans,
  };
}

function mapActivity(raw: unknown): OrganizationActivity {
  const r = rec(raw);
  return {
    id: str(r.id),
    action: str(r.action),
    entityType: strOrNull(r.entityType),
    entityId: strOrNull(r.entityId),
    entityName: strOrNull(r.entityName),
    description: strOrNull(r.description),
    actorName: strOrNull(r.actorName),
    createdAt: str(r.createdAt),
  };
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

export const organizationApi = {
  capabilities: async (): Promise<string[]> => {
    const raw = await apiClient.get<unknown>(`${BASE}/capabilities`);
    return normalizeListResponse<string>(raw).map(String);
  },

  summary: async (): Promise<OrganizationSummary> => mapSummary(await apiClient.get<unknown>(`${BASE}/summary`)),

  /* Charts */
  departmentChart: async (): Promise<DepartmentChart> =>
    mapDepartmentChart(await apiClient.get<unknown>(`${BASE}/chart/departments`)),

  peopleChart: async (params?: PeopleChartParams): Promise<PeopleChart> =>
    mapPeopleChart(await apiClient.get<unknown>(`${BASE}/chart/people${buildQuery({ ...params })}`)),

  positionChart: async (params?: PositionChartParams): Promise<PositionChart> =>
    mapPositionChart(await apiClient.get<unknown>(`${BASE}/chart/positions${buildQuery({ ...params })}`)),

  /* Departments */
  listDepartments: async (): Promise<DepartmentListItem[]> => {
    const raw = await apiClient.get<unknown>(`${BASE}/departments`);
    return normalizeListResponse<unknown>(raw).map((d) => {
      const r = rec(d);
      return { ...mapDepartmentBase(d), parentDepartmentName: strOrNull(r.parentDepartmentName) };
    });
  },

  getDepartment: async (id: string): Promise<DepartmentDetail> => {
    const raw = unwrapPayload(await apiClient.get<unknown>(`${BASE}/departments/${id}`));
    const r = rec(raw);
    return { ...mapDepartmentBase(raw), parentDepartmentName: strOrNull(r.parentDepartmentName) };
  },

  getDepartmentSummary: async (id: string): Promise<DepartmentSummary> => {
    const r = rec(unwrapPayload(await apiClient.get<unknown>(`${BASE}/departments/${id}/summary`)));
    return {
      departmentId: str(r.departmentId ?? id),
      employeeCount: num(r.employeeCount),
      directEmployeeCount: num(r.directEmployeeCount),
      subDepartmentCount: num(r.subDepartmentCount),
      positionCount: num(r.positionCount),
      openPositionCount: num(r.openPositionCount),
      filledPositionCount: num(r.filledPositionCount),
      budgetedHeadcount: numOrNull(r.budgetedHeadcount),
      utilizationPercent: numOrNull(r.utilizationPercent),
      averageSpanOfControl: numOrNull(r.averageSpanOfControl),
      recentHires: r.recentHires != null ? num(r.recentHires) : undefined,
      recentExits: r.recentExits != null ? num(r.recentExits) : undefined,
    };
  },

  createDepartment: async (body: CreateDepartmentRequest): Promise<DepartmentDetail> => {
    const raw = unwrapPayload(await apiClient.post<unknown>(`${BASE}/departments`, body));
    return mapDepartmentBase(raw);
  },

  updateDepartment: async (id: string, body: UpdateDepartmentRequest): Promise<DepartmentDetail> => {
    const raw = unwrapPayload(await apiClient.put<unknown>(`${BASE}/departments/${id}`, body));
    return mapDepartmentBase(raw);
  },

  moveDepartment: async (id: string, body: MoveDepartmentRequest): Promise<void> => {
    await apiClient.post<unknown>(`${BASE}/departments/${id}/move`, body);
  },

  archiveDepartment: async (id: string): Promise<void> => {
    await apiClient.post<unknown>(`${BASE}/departments/${id}/archive`);
  },

  /* Positions */
  listPositions: async (query: PositionListQuery = {}): Promise<PagedResult<OrgPosition>> => {
    const raw = await apiClient.get<unknown>(`${BASE}/positions${buildQuery({ ...query })}`);
    const paged = normalizePagedResult<unknown>(raw);
    return { ...paged, items: paged.items.map(mapPosition) };
  },

  getPosition: async (id: string): Promise<OrgPosition> =>
    mapPosition(await apiClient.get<unknown>(`${BASE}/positions/${id}`)),

  createPosition: async (body: CreatePositionRequest): Promise<OrgPosition> =>
    mapPosition(await apiClient.post<unknown>(`${BASE}/positions`, body)),

  updatePosition: async (id: string, body: UpdatePositionRequest): Promise<OrgPosition> =>
    mapPosition(await apiClient.put<unknown>(`${BASE}/positions/${id}`, body)),

  assignPosition: async (id: string, body: AssignPositionRequest): Promise<OrgPosition> =>
    mapPosition(await apiClient.post<unknown>(`${BASE}/positions/${id}/assign`, body)),

  unassignPosition: async (id: string, body: UnassignPositionRequest): Promise<OrgPosition> =>
    mapPosition(await apiClient.post<unknown>(`${BASE}/positions/${id}/unassign`, body)),

  archivePosition: async (id: string): Promise<void> => {
    await apiClient.post<unknown>(`${BASE}/positions/${id}/archive`);
  },

  /* Levels */
  listLevels: async (): Promise<OrgLevel[]> => {
    const raw = await apiClient.get<unknown>(`${BASE}/levels`);
    return normalizeListResponse<unknown>(raw)
      .map(mapLevel)
      .sort((a, b) => a.rank - b.rank);
  },

  /* Locations */
  listLocations: async (): Promise<OrgLocation[]> => {
    const raw = await apiClient.get<unknown>(`${BASE}/locations`);
    return normalizeListResponse<unknown>(raw).map(mapLocation);
  },

  createLocation: async (body: SaveOrgLocationRequest): Promise<OrgLocation> =>
    mapLocation(await apiClient.post<unknown>(`${BASE}/locations`, body)),

  updateLocation: async (id: string, body: SaveOrgLocationRequest): Promise<OrgLocation> =>
    mapLocation(await apiClient.put<unknown>(`${BASE}/locations/${id}`, body)),

  /* Reporting */
  reportingOverview: async (): Promise<ReportingOverview> =>
    mapReporting(await apiClient.get<unknown>(`${BASE}/reporting`)),

  changeManager: async (body: ChangeManagerRequest): Promise<void> => {
    await apiClient.post<unknown>(`${BASE}/reporting/change-manager`, body);
  },

  /* Activity */
  listActivity: async (query: OrganizationActivityQuery = {}): Promise<PagedResult<OrganizationActivity>> => {
    const raw = await apiClient.get<unknown>(`${BASE}/activity${buildQuery({ ...query })}`);
    const paged = normalizePagedResult<unknown>(raw);
    return { ...paged, items: paged.items.map(mapActivity) };
  },
};

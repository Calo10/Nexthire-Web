import { apiClient } from '../../../lib/api';
import { buildQuery, type QueryParams } from '../../../lib/buildQuery';
import {
  normalizeListResponse,
  normalizePagedResult,
  unwrapPayload,
  type PagedResult,
} from '../../../lib/normalizeApiResponse';
import type {
  ChangeEmployeeStatusRequest,
  Compensation,
  ConvertCandidateRequest,
  EmployeeActivity,
  EmployeeDetail,
  EmployeeDocument,
  EmployeeImportResult,
  EmployeeListItem,
  EmployeeListQuery,
  EmployeeRequest,
  EmployeeSummary,
  EmploymentHistoryEntry,
  UpsertCompensationRequest,
  UpsertEmployeeDocumentRequest,
} from '../models/employee';

const BASE = '/employees';

function toQueryParams(query: EmployeeListQuery): QueryParams {
  return {
    search: query.search?.trim(),
    departmentId: query.departmentId,
    jobTitleId: query.jobTitleId,
    employmentStatus: query.employmentStatus,
    employmentTypeId: query.employmentTypeId,
    workLocationId: query.workLocationId,
    managerId: query.managerId,
    hireFrom: query.hireFrom,
    hireTo: query.hireTo,
    includeArchived: query.includeArchived ? true : undefined,
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort,
    dir: query.dir,
  };
}

function detail(raw: unknown): EmployeeDetail {
  const d = unwrapPayload(raw) as EmployeeDetail;
  return {
    ...d,
    emergencyContacts: Array.isArray(d?.emergencyContacts) ? d.emergencyContacts : [],
    upcomingDocumentExpirations: Array.isArray(d?.upcomingDocumentExpirations) ? d.upcomingDocumentExpirations : [],
  };
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dict(v: unknown): Record<string, number> {
  if (!v || typeof v !== 'object') return {};
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, num(val)]));
}

function summary(raw: unknown): EmployeeSummary {
  const r = (unwrapPayload(raw) ?? {}) as Record<string, unknown>;
  return {
    totalEmployees: num(r.totalEmployees),
    activeEmployees: num(r.activeEmployees),
    newHires: num(r.newHires),
    previousNewHires: num(r.previousNewHires),
    turnoverRate: num(r.turnoverRate),
    previousTurnoverRate: num(r.previousTurnoverRate),
    averageTenureYears: num(r.averageTenureYears),
    previousAverageTenureYears: num(r.previousAverageTenureYears),
    byStatus: dict(r.byStatus),
    byDepartment: dict(r.byDepartment),
    byLocation: dict(r.byLocation),
    byEmploymentType: dict(r.byEmploymentType),
  };
}

export const employeesApi = {
  capabilities: async (): Promise<string[]> => {
    const raw = await apiClient.get<unknown>(`${BASE}/capabilities`);
    return normalizeListResponse<string>(raw).map(String);
  },

  list: async (query: EmployeeListQuery): Promise<PagedResult<EmployeeListItem>> => {
    const raw = await apiClient.get<unknown>(`${BASE}${buildQuery(toQueryParams(query))}`);
    return normalizePagedResult<EmployeeListItem>(raw);
  },

  summary: async (range?: { from?: string; to?: string }): Promise<EmployeeSummary> =>
    summary(await apiClient.get<unknown>(`${BASE}/summary${buildQuery({ from: range?.from, to: range?.to })}`)),

  get: async (id: string): Promise<EmployeeDetail> => detail(await apiClient.get<unknown>(`${BASE}/${id}`)),

  create: async (body: EmployeeRequest): Promise<EmployeeDetail> =>
    detail(await apiClient.post<unknown>(BASE, body)),

  update: async (id: string, body: EmployeeRequest): Promise<EmployeeDetail> =>
    detail(await apiClient.put<unknown>(`${BASE}/${id}`, body)),

  archive: async (id: string): Promise<void> => {
    await apiClient.delete<unknown>(`${BASE}/${id}`);
  },

  restore: async (id: string): Promise<EmployeeDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/restore`)),

  changeStatus: async (id: string, body: ChangeEmployeeStatusRequest): Promise<EmployeeDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/status`, body)),

  activity: async (id: string, take = 50): Promise<EmployeeActivity[]> =>
    normalizeListResponse<EmployeeActivity>(await apiClient.get<unknown>(`${BASE}/${id}/activity?take=${take}`)),

  history: async (id: string): Promise<EmploymentHistoryEntry[]> =>
    normalizeListResponse<EmploymentHistoryEntry>(await apiClient.get<unknown>(`${BASE}/${id}/history`)),

  documents: async (id: string, includeArchived = false): Promise<EmployeeDocument[]> =>
    normalizeListResponse<EmployeeDocument>(
      await apiClient.get<unknown>(`${BASE}/${id}/documents${buildQuery({ includeArchived: includeArchived || undefined })}`),
    ),

  addDocument: async (id: string, body: UpsertEmployeeDocumentRequest): Promise<EmployeeDocument> =>
    unwrapPayload(await apiClient.post<unknown>(`${BASE}/${id}/documents`, body)) as EmployeeDocument,

  deleteDocument: async (id: string, documentId: string): Promise<void> => {
    await apiClient.delete<unknown>(`${BASE}/${id}/documents/${documentId}`);
  },

  compensation: async (id: string): Promise<Compensation[]> =>
    normalizeListResponse<Compensation>(await apiClient.get<unknown>(`${BASE}/${id}/compensation`)),

  addCompensation: async (id: string, body: UpsertCompensationRequest): Promise<Compensation> =>
    unwrapPayload(await apiClient.post<unknown>(`${BASE}/${id}/compensation`, body)) as Compensation,

  convertFromCandidate: async (body: ConvertCandidateRequest): Promise<EmployeeDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/convert-from-candidate`, body)),

  /** Uploads a CSV file (multipart). */
  importCsv: async (file: File): Promise<EmployeeImportResult> => {
    const form = new FormData();
    form.append('file', file);
    const r = (unwrapPayload(await apiClient.post<unknown>(`${BASE}/import`, form)) ?? {}) as Record<string, unknown>;
    return {
      totalRows: num(r.totalRows),
      created: num(r.created),
      skipped: num(r.skipped),
      errors: Array.isArray(r.errors)
        ? (r.errors as Array<Record<string, unknown>>).map((e) => ({
            rowNumber: num(e.rowNumber),
            message: String(e.message ?? ''),
          }))
        : [],
    };
  },

  /**
   * Exports the filtered list as CSV. `apiClient` returns non-JSON bodies as text, so we rebuild a Blob here
   * (re-adding the UTF-8 BOM that `Response.text()` strips so Excel keeps accents intact).
   */
  exportCsv: async (query: EmployeeListQuery): Promise<Blob> => {
    const text = await apiClient.get<unknown>(
      `${BASE}/export${buildQuery(toQueryParams({ ...query, page: undefined, pageSize: undefined }))}`,
    );
    if (typeof text !== 'string') {
      throw { message: 'Unexpected export response.' };
    }
    return new Blob(['\uFEFF', text], { type: 'text/csv;charset=utf-8' });
  },
};

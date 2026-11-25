import { apiClient } from '../../../lib/api';
import { buildQuery } from '../../../lib/buildQuery';
import {
  normalizeListResponse,
  normalizePagedResult,
  unwrapPayload,
  type PagedResult,
} from '../../../lib/normalizeApiResponse';
import type {
  CreateHrDocumentRequestBody,
  HrDocumentCategoryCount,
  HrDocumentDetail,
  HrDocumentListItem,
  HrDocumentListQuery,
  HrDocumentRequest,
  HrDocumentRequestBody,
  HrDocumentSummary,
  HrDocumentUploadInput,
} from '../models/hrDocument';

const BASE = '/hr/documents';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string | null {
  return v == null || v === '' ? null : String(v);
}

function mapDocument(raw: unknown): HrDocumentListItem {
  const r = (unwrapPayload(raw) ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    employeeId: String(r.employeeId ?? ''),
    employeeName: String(r.employeeName ?? ''),
    employeeJobTitle: str(r.jobTitle),
    employeeDepartment: str(r.department),
    employeeAvatarUrl: str(r.profilePictureUrl),
    category: String(r.category ?? 'Other'),
    name: String(r.name ?? ''),
    documentId: str(r.documentId),
    externalUrl: str(r.externalUrl),
    contentType: str(r.contentType),
    fileSizeBytes: r.fileSizeBytes != null ? num(r.fileSizeBytes) : null,
    status: String(r.status ?? 'Active'),
    displayStatus: str(r.displayStatus),
    expiresAt: str(r.expiresAt),
    createdAt: String(r.createdAt ?? ''),
    uploadedByName: str(r.createdByName),
    isArchived: r.isArchived === true,
  };
}

function mapDetail(raw: unknown): HrDocumentDetail {
  const r = (unwrapPayload(raw) ?? {}) as Record<string, unknown>;
  const activity = Array.isArray(r.activity) ? (r.activity as Record<string, unknown>[]) : [];
  return {
    ...mapDocument(r),
    activity: activity.map((a) => ({
      id: String(a.id ?? ''),
      activityType: String(a.activityType ?? ''),
      summary: String(a.summary ?? ''),
      createdAt: String(a.createdAt ?? ''),
      createdByName: str(a.createdByName),
    })),
  };
}

function mapCategories(raw: unknown): HrDocumentCategoryCount[] {
  return normalizeListResponse<Record<string, unknown>>(raw)
    .map((c) => ({ category: String(c.category ?? ''), count: num(c.count) }))
    .filter((c) => c.category);
}

function mapSummary(raw: unknown): HrDocumentSummary {
  const r = (unwrapPayload(raw) ?? {}) as Record<string, unknown>;
  const total = num(r.totalDocuments);
  const valid = num(r.completedOrValid);
  return {
    total,
    valid,
    validPercent: total > 0 ? (valid / total) * 100 : 0,
    expiringSoon: num(r.expiringIn30Days),
    expired: num(r.expired),
    pending: num(r.pending),
    openRequests: num(r.openRequests),
  };
}

function mapRequest(raw: unknown): HrDocumentRequest {
  const r = (unwrapPayload(raw) ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    employeeId: String(r.employeeId ?? ''),
    employeeName: String(r.employeeName ?? ''),
    employeeAvatarUrl: str(r.profilePictureUrl),
    category: String(r.category ?? 'Other'),
    title: String(r.title ?? ''),
    notes: str(r.notes),
    status: String(r.status ?? 'Open'),
    dueAt: str(r.dueAt),
    fulfilledDocumentId: str(r.fulfilledDocumentId),
    createdAt: String(r.createdAt ?? ''),
    completedAt: str(r.completedAt),
  };
}

export const hrDocumentsApi = {
  list: async (query: HrDocumentListQuery): Promise<PagedResult<HrDocumentListItem>> => {
    const raw = await apiClient.get<unknown>(
      `${BASE}${buildQuery({
        search: query.search?.trim(),
        category: query.category,
        status: query.status,
        departmentId: query.departmentId,
        employeeId: query.employeeId,
        page: query.page,
        pageSize: query.pageSize,
        sort: query.sort,
        dir: query.dir,
      })}`,
    );
    const paged = normalizePagedResult<unknown>(raw);
    return { ...paged, items: paged.items.map(mapDocument) };
  },

  summary: async (): Promise<HrDocumentSummary> => mapSummary(await apiClient.get<unknown>(`${BASE}/summary`)),

  categories: async (): Promise<HrDocumentCategoryCount[]> =>
    mapCategories(await apiClient.get<unknown>(`${BASE}/categories`)),

  get: async (id: string): Promise<HrDocumentDetail> => mapDetail(await apiClient.get<unknown>(`${BASE}/${id}`)),

  create: async (body: HrDocumentRequestBody): Promise<HrDocumentDetail> =>
    mapDetail(await apiClient.post<unknown>(BASE, body)),

  /** Multipart upload: fields `employeeId`, `category`, `name`, `expiresAt`, `file`. */
  upload: async (input: HrDocumentUploadInput): Promise<HrDocumentDetail> => {
    const form = new FormData();
    form.append('employeeId', input.employeeId);
    form.append('category', input.category);
    form.append('name', input.name);
    if (input.expiresAt) form.append('expiresAt', input.expiresAt);
    form.append('file', input.file);
    return mapDetail(await apiClient.post<unknown>(`${BASE}/upload`, form));
  },

  update: async (id: string, body: HrDocumentRequestBody): Promise<HrDocumentDetail> =>
    mapDetail(await apiClient.put<unknown>(`${BASE}/${id}`, body)),

  archive: async (id: string): Promise<void> => {
    await apiClient.delete<unknown>(`${BASE}/${id}`);
  },

  /** `status`: omit for open (Open + Overdue), `all`, or a specific status. */
  requests: async (status?: string): Promise<HrDocumentRequest[]> =>
    normalizeListResponse<unknown>(await apiClient.get<unknown>(`${BASE}/requests${buildQuery({ status })}`)).map(mapRequest),

  createRequest: async (body: CreateHrDocumentRequestBody): Promise<HrDocumentRequest> =>
    mapRequest(await apiClient.post<unknown>(`${BASE}/requests`, body)),

  fulfillRequest: async (id: string, documentId?: string | null): Promise<HrDocumentRequest> =>
    mapRequest(await apiClient.post<unknown>(`${BASE}/requests/${id}/fulfill`, documentId ? { documentRowId: documentId } : {})),

  cancelRequest: async (id: string): Promise<HrDocumentRequest> =>
    mapRequest(await apiClient.post<unknown>(`${BASE}/requests/${id}/cancel`, {})),
};

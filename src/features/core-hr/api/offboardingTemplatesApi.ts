import { apiClient } from '../../../lib/api';
import { buildQuery } from '../../../lib/buildQuery';
import { normalizeListResponse, unwrapPayload } from '../../../lib/normalizeApiResponse';
import type {
  OffboardingTemplateDetail,
  OffboardingTemplateListItem,
  OffboardingTemplateListQuery,
  UpsertOffboardingTemplateRequest,
} from '../models/offboarding';

const BASE = '/offboarding/templates';

function detail(raw: unknown): OffboardingTemplateDetail {
  const d = (unwrapPayload(raw) ?? {}) as OffboardingTemplateDetail;
  return { ...d, tasks: Array.isArray(d.tasks) ? [...d.tasks].sort((a, b) => a.displayOrder - b.displayOrder) : [] };
}

export const offboardingTemplatesApi = {
  list: async (query: OffboardingTemplateListQuery = {}): Promise<OffboardingTemplateListItem[]> =>
    normalizeListResponse<OffboardingTemplateListItem>(
      await apiClient.get<unknown>(
        `${BASE}${buildQuery({
          search: query.search?.trim(),
          departmentId: query.departmentId,
          separationType: query.separationType,
          isActive: query.isActive,
          includeArchived: query.includeArchived ? true : undefined,
        })}`,
      ),
    ),

  get: async (id: string): Promise<OffboardingTemplateDetail> => detail(await apiClient.get<unknown>(`${BASE}/${id}`)),

  create: async (body: UpsertOffboardingTemplateRequest): Promise<OffboardingTemplateDetail> =>
    detail(await apiClient.post<unknown>(BASE, body)),

  update: async (id: string, body: UpsertOffboardingTemplateRequest): Promise<OffboardingTemplateDetail> =>
    detail(await apiClient.put<unknown>(`${BASE}/${id}`, body)),

  duplicate: async (id: string, name?: string): Promise<OffboardingTemplateDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/duplicate`, { name: name ?? null })),

  archive: async (id: string): Promise<void> => {
    await apiClient.post<unknown>(`${BASE}/${id}/archive`);
  },
};

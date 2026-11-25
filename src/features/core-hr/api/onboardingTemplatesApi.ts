import { apiClient } from '../../../lib/api';
import { buildQuery } from '../../../lib/buildQuery';
import { normalizeListResponse, unwrapPayload } from '../../../lib/normalizeApiResponse';
import type {
  OnboardingTemplateDetail,
  OnboardingTemplateListItem,
  OnboardingTemplateListQuery,
  UpsertOnboardingTemplateRequest,
} from '../models/onboarding';

const BASE = '/onboarding/templates';

function detail(raw: unknown): OnboardingTemplateDetail {
  const d = (unwrapPayload(raw) ?? {}) as OnboardingTemplateDetail;
  return { ...d, tasks: Array.isArray(d.tasks) ? [...d.tasks].sort((a, b) => a.displayOrder - b.displayOrder) : [] };
}

export const onboardingTemplatesApi = {
  list: async (query: OnboardingTemplateListQuery = {}): Promise<OnboardingTemplateListItem[]> =>
    normalizeListResponse<OnboardingTemplateListItem>(
      await apiClient.get<unknown>(
        `${BASE}${buildQuery({
          search: query.search?.trim(),
          departmentId: query.departmentId,
          isActive: query.isActive,
          includeArchived: query.includeArchived ? true : undefined,
        })}`,
      ),
    ),

  get: async (id: string): Promise<OnboardingTemplateDetail> => detail(await apiClient.get<unknown>(`${BASE}/${id}`)),

  create: async (body: UpsertOnboardingTemplateRequest): Promise<OnboardingTemplateDetail> =>
    detail(await apiClient.post<unknown>(BASE, body)),

  update: async (id: string, body: UpsertOnboardingTemplateRequest): Promise<OnboardingTemplateDetail> =>
    detail(await apiClient.put<unknown>(`${BASE}/${id}`, body)),

  duplicate: async (id: string, name?: string): Promise<OnboardingTemplateDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/duplicate`, { name: name ?? null })),

  archive: async (id: string): Promise<void> => {
    await apiClient.post<unknown>(`${BASE}/${id}/archive`);
  },
};

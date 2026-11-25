import { apiClient } from '../../../lib/api';
import { normalizeListResponse, unwrapPayload } from '../../../lib/normalizeApiResponse';
import type { CreateHrLookupRequest, HrLookup, WorkLocation } from '../models/employee';

const BASE = '/hr/lookups';

function mapLookup<T extends HrLookup>(raw: unknown): T {
  const r = (unwrapPayload(raw) ?? {}) as Record<string, unknown>;
  return {
    ...(r as object),
    id: String(r.id ?? ''),
    name: String(r.name ?? ''),
    code: r.code != null ? String(r.code) : null,
    isActive: r.isActive !== false,
  } as T;
}

async function list<T extends HrLookup>(path: string): Promise<T[]> {
  const raw = await apiClient.get<unknown>(`${BASE}/${path}`);
  return normalizeListResponse<unknown>(raw)
    .map((item) => mapLookup<T>(item))
    .filter((item) => item.id);
}

export const hrLookupsApi = {
  departments: () => list<HrLookup>('departments'),
  jobTitles: () => list<HrLookup>('job-titles'),
  locations: () => list<WorkLocation>('locations'),
  employmentTypes: () => list<HrLookup>('employment-types'),

  createDepartment: async (body: CreateHrLookupRequest) =>
    mapLookup<HrLookup>(await apiClient.post<unknown>(`${BASE}/departments`, body)),
  createJobTitle: async (body: CreateHrLookupRequest) =>
    mapLookup<HrLookup>(await apiClient.post<unknown>(`${BASE}/job-titles`, body)),
  createLocation: async (body: CreateHrLookupRequest) =>
    mapLookup<WorkLocation>(await apiClient.post<unknown>(`${BASE}/locations`, body)),
};

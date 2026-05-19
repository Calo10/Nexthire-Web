/**
 * Normalizes varied backend envelope shapes (raw array, paged, ResponseModel) for stable UI usage.
 */

export function unwrapPayload(raw: unknown): unknown {
  if (raw == null) return raw;
  if (typeof raw !== 'object') return raw;
  const o = raw as Record<string, unknown>;
  if ('responseObject' in o && o.responseObject != null) return unwrapPayload(o.responseObject);
  if ('data' in o && o.data != null) return unwrapPayload(o.data);
  return raw;
}

export function normalizeListResponse<T>(raw: unknown): T[] {
  const u = unwrapPayload(raw);
  if (Array.isArray(u)) return u as T[];
  if (u && typeof u === 'object') {
    const o = u as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.results)) return o.results as T[];
    if (Array.isArray(o.records)) return o.records as T[];
    if (Array.isArray(o.leads)) return o.leads as T[];
    if (Array.isArray(o.campaigns)) return o.campaigns as T[];
  }
  return [];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function normalizePagedResult<T>(raw: unknown): PagedResult<T> {
  const u = unwrapPayload(raw);
  const items = normalizeListResponse<T>(u);
  if (u && typeof u === 'object') {
    const o = u as Record<string, unknown>;
    const total = Number(o.totalCount ?? o.total ?? o.count ?? items.length) || items.length;
    const page = Number(o.page ?? o.currentPage ?? 1) || 1;
    const pageSize = Number(o.pageSize ?? o.limit ?? o.take ?? 10) || 10;
    return { items, total, page, pageSize };
  }
  return { items, total: items.length, page: 1, pageSize: items.length || 10 };
}

export function asRecord(raw: unknown): Record<string, unknown> | null {
  const u = unwrapPayload(raw);
  if (u && typeof u === 'object' && !Array.isArray(u)) return u as Record<string, unknown>;
  return null;
}

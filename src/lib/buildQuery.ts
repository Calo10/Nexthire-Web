type Primitive = string | number | boolean | null | undefined;

export type QueryValue = Primitive | Date | Primitive[] | Date[];

export type QueryParams = Record<string, QueryValue>;

function toStringValue(value: Exclude<QueryValue, undefined | null>): string[] {
  // Arrays
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => (v === null || v === undefined ? [] : toStringValue(v as any)))
      .filter((v) => v !== '');
  }

  // Dates
  if (value instanceof Date) {
    return [value.toISOString()];
  }

  // Primitives
  if (typeof value === 'string') return [value];
  if (typeof value === 'number') return [String(value)];
  if (typeof value === 'boolean') return [value ? 'true' : 'false'];

  return [];
}

/**
 * buildQuery:
 * - removes undefined/null/empty-string
 * - serializes Date to ISO
 * - supports arrays by repeating the key
 */
export function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const qp = new URLSearchParams();

  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;

    // drop empty strings
    if (typeof raw === 'string' && raw.trim() === '') continue;

    const values = toStringValue(raw as any);
    for (const v of values) {
      if (v === undefined || v === null) continue;
      const s = String(v);
      if (s.trim() === '') continue;
      qp.append(key, s);
    }
  }

  const qs = qp.toString();
  return qs ? `?${qs}` : '';
}


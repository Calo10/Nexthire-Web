/**
 * Only these source type codes exist for public apply leads in the backend.
 * Keep dropdown values and API filter in sync with the DB.
 */
export const PUBLIC_APPLY_ALLOWED_SOURCE_CODES = new Set([
  'meta_ads',
  'tiktok_ads',
  'linkedin_ads',
  'whatsapp',
]);

export const PUBLIC_APPLY_SOURCE_ORDER = [
  'meta_ads',
  'tiktok_ads',
  'linkedin_ads',
  'whatsapp',
] as const;

/** Fallback when GET public source-types fails or returns no allowed types. */
export const FALLBACK_PUBLIC_APPLY_SOURCE_TYPES = [
  { code: 'meta_ads', labelKey: 'publicJobs.apply.sources.metaAds' },
  { code: 'tiktok_ads', labelKey: 'publicJobs.apply.sources.tikTokAds' },
  { code: 'linkedin_ads', labelKey: 'publicJobs.apply.sources.linkedInAds' },
  { code: 'whatsapp', labelKey: 'publicJobs.apply.sources.whatsApp' },
] as const;

/** Not offered on the public apply form (internal / automation). */
export const HIDDEN_PUBLIC_APPLY_SOURCE_CODES = new Set(['manual_entry', 'manual', 'qr_code']);

const ORDER_INDEX = new Map<string, number>(
  PUBLIC_APPLY_SOURCE_ORDER.map((code, i) => [code, i])
);

export function filterAndOrderPublicApplySources(
  rows: { code: string; name: string }[]
): { code: string; name: string }[] {
  const filtered = rows.filter((r) => PUBLIC_APPLY_ALLOWED_SOURCE_CODES.has(r.code.toLowerCase()));
  return [...filtered].sort((a, b) => {
    const ia = ORDER_INDEX.get(a.code.toLowerCase()) ?? 99;
    const ib = ORDER_INDEX.get(b.code.toLowerCase()) ?? 99;
    return ia - ib;
  });
}

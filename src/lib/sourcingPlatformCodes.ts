import type { TFunction } from 'i18next';

/** Canonical sourcing/campaign platform codes (filters + campaign creation). */
export const SOURCING_PLATFORM_CODES = ['meta_ads', 'tiktok_ads', 'linkedin_ads', 'twilio', 'whatsapp'] as const;

export type SourcingPlatformCode = (typeof SOURCING_PLATFORM_CODES)[number];

/** Map API/display values ("Meta Ads", "meta") to canonical platform codes. */
export function normalizeSourcingPlatformCode(raw: string | null | undefined): string {
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (!s) return '';
  if (s === 'meta' || s === 'meta_ads' || s === 'facebook_ads' || s.startsWith('meta_')) return 'meta_ads';
  if (s.includes('twilio')) return 'twilio';
  if (s.includes('whatsapp')) return 'whatsapp';
  if (s.includes('tiktok')) return 'tiktok_ads';
  if (s.includes('linkedin')) return 'linkedin_ads';
  if ((SOURCING_PLATFORM_CODES as readonly string[]).includes(s)) return s;
  return s;
}

export function sourcingPlatformSelectLabels(t: TFunction): { value: string; label: string }[] {
  return SOURCING_PLATFORM_CODES.map((code) => ({
    value: code,
    label: t(`sourcing.campaign.platforms.${code}`),
  }));
}

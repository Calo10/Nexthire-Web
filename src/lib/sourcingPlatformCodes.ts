import type { TFunction } from 'i18next';

/** Canonical sourcing/campaign platform codes (filters + campaign creation). */
export const SOURCING_PLATFORM_CODES = ['meta_ads', 'tiktok_ads', 'linkedin_ads', 'whatsapp'] as const;

export type SourcingPlatformCode = (typeof SOURCING_PLATFORM_CODES)[number];

export function sourcingPlatformSelectLabels(t: TFunction): { value: string; label: string }[] {
  return SOURCING_PLATFORM_CODES.map((code) => ({
    value: code,
    label: t(`sourcing.campaign.platforms.${code}`),
  }));
}

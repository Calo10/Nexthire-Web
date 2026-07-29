import type { Job } from './dashboard';

export type MetaDestinationType = 'whatsapp' | 'job_post_url' | 'calendly';

export type MetaCtaType = 'LEARN_MORE' | 'APPLY_NOW' | 'SIGN_UP';

export interface MetaLinkDataCallToAction {
  type: MetaCtaType;
}

export const META_CAMPAIGN_OBJECTIVES = [
  'OUTCOME_TRAFFIC',
  'OUTCOME_LEADS',
  'OUTCOME_AWARENESS',
  'OUTCOME_ENGAGEMENT',
] as const;

export type MetaCampaignObjective = (typeof META_CAMPAIGN_OBJECTIVES)[number];

export const META_CAMPAIGN_STATUSES = ['PAUSED', 'ACTIVE'] as const;

export const META_BILLING_EVENTS = ['IMPRESSIONS', 'LINK_CLICKS'] as const;

export const META_OPTIMIZATION_GOALS = [
  'LINK_CLICKS',
  'REACH',
  'IMPRESSIONS',
  'LANDING_PAGE_VIEWS',
  'CONVERSATIONS',
] as const;

export const META_BID_STRATEGIES = [
  'LOWEST_COST_WITHOUT_CAP',
  'LOWEST_COST_WITH_BID_CAP',
  'COST_CAP',
] as const;

export interface MetaGeoCity {
  key: string;
  radius?: number;
  distance_unit?: 'mile' | 'kilometer';
}

export interface MetaGeoRegion {
  key: string;
}

export interface MetaGeoLocationsPayload {
  countries?: string[];
  cities?: MetaGeoCity[];
  regions?: MetaGeoRegion[];
}

export interface MetaGeoResolveCandidate {
  key: string;
  name: string;
  type?: string;
  countryCode?: string;
}

export interface MetaGeoResolveResponse {
  candidates: MetaGeoResolveCandidate[];
  best?: MetaGeoResolveCandidate | null;
}

export interface MetaGeoSelection {
  label: string;
  countryCode: string;
  geoLocations: MetaGeoLocationsPayload;
  /** Audience radius in miles (Meta city targeting). */
  radiusMiles?: number;
}

/** Meta city targeting allows 10–50 miles. */
export const META_GEO_RADIUS_MI_MIN = 10;
export const META_GEO_RADIUS_MI_MAX = 50;
export const META_GEO_RADIUS_MI_DEFAULT = 25;

export function clampMetaGeoRadiusMiles(miles: number): number {
  return Math.max(
    META_GEO_RADIUS_MI_MIN,
    Math.min(META_GEO_RADIUS_MI_MAX, Math.round(miles))
  );
}

export function applyRadiusToSelection(sel: MetaGeoSelection, radiusMiles: number): MetaGeoSelection {
  const r = clampMetaGeoRadiusMiles(radiusMiles);
  const geo = { ...sel.geoLocations };
  if (geo.cities?.length) {
    geo.cities = geo.cities.map((c) => ({
      ...c,
      radius: r,
      distance_unit: 'mile' as const,
    }));
    delete geo.countries;
  }
  return { ...sel, radiusMiles: r, geoLocations: geo };
}

/** City map picks: Meta expects `cities` (+ radius), not `countries`. */
export function geoLocationsForMetaTargeting(geo: MetaGeoLocationsPayload): MetaGeoLocationsPayload {
  if (!geo.cities?.length) return geo;
  const { countries: _countries, ...rest } = geo;
  return { ...rest, cities: geo.cities };
}

export interface MetaCampaignTargetingPayload {
  geoLocations: MetaGeoLocationsPayload;
  ageMin: number;
  ageMax: number;
  publisherPlatforms: ('facebook' | 'instagram')[];
  targetingAutomation: { advantageAudience: number };
}

export interface MetaCampaignCreatePayload {
  tenantId: string;
  jobId: string;
  destinationType: MetaDestinationType;
  whatsappMessage?: string | null;
  /** Creative image as raw base64 — stored locally with campaign metadata (not sent to Meta Graph). */
  imageBase64?: string | null;
  imageContentType?: string | null;
  persistLocalRecord: boolean;
  campaign: {
    name: string;
    objective: string;
    status: string;
    specialAdCategories: string[];
    /** ISO 3166-1 alpha-2; required when specialAdCategories includes employment/housing/credit. */
    specialAdCategoryCountry: string[];
    isAdsetBudgetSharingEnabled: boolean;
  };
  adSet: {
    name: string;
    billingEvent: string;
    optimizationGoal: string;
    dailyBudget: number;
    bidStrategy: string;
    targeting: MetaCampaignTargetingPayload;
    status: string;
  };
  creative: {
    name: string;
    objectStorySpec: {
      linkData: {
        message: string;
        link: string;
        imageHash: string;
        callToAction: MetaLinkDataCallToAction;
      };
    };
  };
  ad: {
    name: string;
    status: string;
  };
}

export interface MetaCampaignCreateResult {
  /** Local sourcing row GUID — use for pause/delete. */
  localRecordId: string;
  campaignId: string;
  adSetId: string;
  creativeId: string;
  adId: string;
  adAccountId: string;
  adsManagerUrl?: string;
}

export interface MetaCampaignPauseResult {
  localRecordId?: string;
  status?: string;
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaAdId?: string;
}

export interface GenerateMetaCreativePreviewRequest {
  jobId: string;
  /** Ad primary text — included in the AI image prompt when present. */
  creativeMessage?: string;
  /** Optional free-form instructions that steer AI image generation. */
  aiInstructions?: string;
}

export interface GenerateMetaCreativePreviewResponse {
  imageBase64: string;
  contentType: string;
  width: number;
  height: number;
  metaCreativeHint: string;
  imagePrompt: string;
  imageHash?: string;
  imageUrl?: string;
}

export interface GeneratedMetaCreativePreview {
  dataUrl: string;
  contentType: string;
  width: number;
  height: number;
  imagePrompt: string;
  metaCreativeHint: string;
}

export function metaDefaultsForDestination(_destinationType: MetaDestinationType): {
  objective: MetaCampaignObjective;
  billingEvent: (typeof META_BILLING_EVENTS)[number];
  optimizationGoal: (typeof META_OPTIMIZATION_GOALS)[number];
  bidStrategy: (typeof META_BID_STRATEGIES)[number];
} {
  return {
    objective: 'OUTCOME_TRAFFIC',
    billingEvent: 'IMPRESSIONS',
    optimizationGoal: 'LINK_CLICKS',
    bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
  };
}

export const META_EMPLOYMENT_SPECIAL_AD_CATEGORIES = ['EMPLOYMENT'] as const;

export const META_SPECIAL_AD_CATEGORIES_REQUIRING_COUNTRY = [
  'EMPLOYMENT',
  'HOUSING',
  'FINANCIAL_PRODUCTS_SERVICES',
] as const;

/** Meta requires 18–65+ for employment / housing / credit special ad categories. */
export const META_SPECIAL_AD_AGE_MIN = 18;
export const META_SPECIAL_AD_AGE_MAX = 65;

export function specialAdCategoriesRequireCountry(categories: readonly string[]): boolean {
  const required = META_SPECIAL_AD_CATEGORIES_REQUIRING_COUNTRY as readonly string[];
  return categories.some((cat) => required.includes(cat));
}

export function specialAdCategoriesRequireFixedAge(categories: readonly string[]): boolean {
  return specialAdCategoriesRequireCountry(categories);
}

export function targetingAgesForSpecialAdCategories(
  categories: readonly string[],
  ageMin: number,
  ageMax: number
): { ageMin: number; ageMax: number } {
  if (specialAdCategoriesRequireFixedAge(categories)) {
    return { ageMin: META_SPECIAL_AD_AGE_MIN, ageMax: META_SPECIAL_AD_AGE_MAX };
  }
  return { ageMin, ageMax };
}

export function formatMetaTargetingAgeRange(ageMin: number, ageMax: number, fixedSpecialAd = false): string {
  if (fixedSpecialAd || (ageMin === META_SPECIAL_AD_AGE_MIN && ageMax === META_SPECIAL_AD_AGE_MAX)) {
    return `${META_SPECIAL_AD_AGE_MIN} – ${META_SPECIAL_AD_AGE_MAX}+`;
  }
  return `${ageMin} – ${ageMax}`;
}

/** Country ISO from geo resolve selection (must match ad set audience country). */
export function specialAdCategoryCountryFromGeo(geo: MetaGeoSelection | null | undefined): string[] {
  const cc = geo?.countryCode?.trim().toUpperCase();
  if (!cc || !/^[A-Z]{2}$/.test(cc)) return [];
  return [cc];
}

/** https://wa.me/... link for WhatsApp traffic ads. */
export function isValidWhatsappMeUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return host === 'wa.me' || host === 'api.whatsapp.com';
  } catch {
    return false;
  }
}

/** Any absolute http(s) URL — allows localhost for local Generated URL defaults. */
export function isAbsoluteHttpUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Public https job URL — rejects localhost and private networks. */
export function isPublicHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
      return false;
    }
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

export interface MetaCampaignBuildInput {
  tenantId: string;
  jobId: string;
  destinationType: MetaDestinationType;
  activateOnCreate: boolean;
  campaignName: string;
  dailyBudgetUsd: number;
  geoSelection: MetaGeoSelection;
  ageMin: number;
  ageMax: number;
  publisherPlatforms: ('facebook' | 'instagram')[];
  /** Public https job URL (job_post_url). */
  jobPostLink?: string;
  /** https://wa.me/... (whatsapp destinationType). */
  whatsappLink?: string;
  /** Stored locally with the campaign record. */
  whatsappMessage?: string;
  creativeMessage: string;
  imageHash: string;
  /** Raw base64 (no data-URL prefix) archived with the local marketing row. */
  imageBase64?: string;
  imageContentType?: string;
  adSetName?: string;
  creativeName?: string;
  adName?: string;
}

export function buildMetaCampaignPayload(input: MetaCampaignBuildInput): MetaCampaignCreatePayload | null {
  const {
    tenantId,
    jobId,
    destinationType,
    activateOnCreate,
    campaignName,
    dailyBudgetUsd,
    geoSelection,
    ageMin,
    ageMax,
    publisherPlatforms,
    jobPostLink,
    whatsappLink,
    whatsappMessage,
    creativeMessage,
    imageHash,
    imageBase64,
    imageContentType,
    adSetName,
    creativeName,
    adName,
  } = input;

  if (!tenantId || !jobId || !geoSelection || !publisherPlatforms.length) return null;

  const isWeb = destinationType === 'job_post_url' || destinationType === 'calendly';
  const isWhatsapp = destinationType === 'whatsapp';

  if (isWeb) {
    const jobUrl = (jobPostLink ?? '').trim();
    // Accept Generated URL (incl. local http) or a custom public https override.
    if (!jobUrl || !isAbsoluteHttpUrl(jobUrl)) return null;
  }
  let creativeLink = '';
  if (isWeb) {
    creativeLink = (jobPostLink ?? '').trim();
  } else if (isWhatsapp) {
    creativeLink = (whatsappLink ?? '').trim();
    if (!creativeLink || !isValidWhatsappMeUrl(creativeLink)) return null;
  }

  const metaDefaults = metaDefaultsForDestination(destinationType);
  const callToAction = metaCallToActionForDestination();
  const status = activateOnCreate ? 'ACTIVE' : 'PAUSED';
  const name = campaignName.trim();
  const derived = derivedCampaignChildNames(name);
  const specialAdCategories = [...META_EMPLOYMENT_SPECIAL_AD_CATEGORIES];
  const specialAdCategoryCountry = specialAdCategoryCountryFromGeo(geoSelection);
  if (specialAdCategoriesRequireCountry(specialAdCategories) && !specialAdCategoryCountry.length) {
    return null;
  }

  const { ageMin: targetingAgeMin, ageMax: targetingAgeMax } = targetingAgesForSpecialAdCategories(
    specialAdCategories,
    ageMin,
    ageMax
  );

  return {
    tenantId,
    jobId,
    destinationType,
    whatsappMessage: destinationType === 'whatsapp' ? whatsappMessage?.trim() || null : null,
    imageBase64: imageBase64?.trim() || null,
    imageContentType: imageContentType?.trim() || null,
    persistLocalRecord: true,
    campaign: {
      name,
      objective: metaDefaults.objective,
      status,
      specialAdCategories,
      specialAdCategoryCountry,
      isAdsetBudgetSharingEnabled: false,
    },
    adSet: {
      name: adSetName?.trim() || derived.adSetName,
      dailyBudget: dailyBudgetUsdToCents(dailyBudgetUsd),
      billingEvent: metaDefaults.billingEvent,
      optimizationGoal: metaDefaults.optimizationGoal,
      bidStrategy: metaDefaults.bidStrategy,
      status,
      targeting: {
        geoLocations: geoLocationsForMetaTargeting(geoSelection.geoLocations),
        ageMin: targetingAgeMin,
        ageMax: targetingAgeMax,
        publisherPlatforms,
        targetingAutomation: { advantageAudience: 0 },
      },
    },
    creative: {
      name: creativeName?.trim() || derived.creativeName,
      objectStorySpec: {
        linkData: {
          message: creativeMessage.trim(),
          link: creativeLink,
          imageHash: imageHash.trim(),
          callToAction,
        },
      },
    },
    ad: {
      name: adName?.trim() || derived.adName,
      status,
    },
  };
}

export function geoLocationsFromCandidate(candidate: MetaGeoResolveCandidate): MetaGeoLocationsPayload {
  const cc = (candidate.countryCode || 'US').toUpperCase();
  const type = (candidate.type || 'country').toLowerCase();
  if (type === 'city') {
    return { cities: [{ key: candidate.key }] };
  }
  if (type === 'region') {
    return { countries: [cc], regions: [{ key: candidate.key }] };
  }
  return { countries: [cc] };
}

export function selectionFromGeoResolve(
  candidate: MetaGeoResolveCandidate,
  queryLabel?: string
): MetaGeoSelection {
  const base: MetaGeoSelection = {
    label: queryLabel?.trim() || candidate.name,
    countryCode: (candidate.countryCode || 'US').toUpperCase(),
    geoLocations: geoLocationsFromCandidate(candidate),
    radiusMiles: META_GEO_RADIUS_MI_DEFAULT,
  };
  return applyRadiusToSelection(base, META_GEO_RADIUS_MI_DEFAULT);
}

export function dailyBudgetUsdToCents(dollars: number): number {
  return Math.round(Number((dollars * 100).toFixed(2)));
}

export function formatDailyBudgetUsd(dollars: number): string {
  return `$${dollars.toFixed(2)} / day`;
}

export function jobCodeFromJob(job: Job): string {
  const j = job as Job & { code?: string; jobCode?: string };
  const c = j.code ?? j.jobCode;
  return String(c ?? job.id).trim();
}

export function derivedCampaignChildNames(campaignName: string) {
  const base = campaignName.trim() || 'Campaign';
  return {
    adSetName: `${base} - AdSet`,
    creativeName: `${base} - Creative`,
    adName: `${base} - Ad`,
  };
}

/** Traffic link ads (web job URL or wa.me). */
export function metaCallToActionForDestination(): MetaLinkDataCallToAction {
  return { type: 'LEARN_MORE' };
}

/** @deprecated Use metaCallToActionForDestination */
export function ctaForDestination(_destinationType: MetaDestinationType): MetaCtaType {
  return 'LEARN_MORE';
}

export interface MetaInsightAction {
  actionType: string;
  value: number;
}

/** Live Meta Ads Insights for one campaign. */
export interface MetaCampaignInsights {
  localRecordId?: string;
  metaCampaignId?: string;
  campaignName?: string;
  datePreset: string;
  dateStart?: string;
  dateStop?: string;
  impressions?: number | null;
  reach?: number | null;
  clicks?: number | null;
  uniqueClicks?: number | null;
  inlineLinkClicks?: number | null;
  outboundClicks?: number | null;
  spend?: number | null;
  cpc?: number | null;
  cpm?: number | null;
  cpp?: number | null;
  ctr?: number | null;
  frequency?: number | null;
  costPerInlineLinkClick?: number | null;
  metaLeads?: number | null;
  costPerLead?: number | null;
  actions: MetaInsightAction[];
  costPerActionType: MetaInsightAction[];
  empty?: boolean;
}

export interface MetaCampaignInsightsList {
  datePreset: string;
  items: MetaCampaignInsights[];
}

/** Weekly snapshot metrics for historical compare. */
export interface MetaInsightsSnapshotMetrics {
  spend?: number | null;
  impressions?: number | null;
  reach?: number | null;
  clicks?: number | null;
  inlineLinkClicks?: number | null;
  cpc?: number | null;
  cpm?: number | null;
  ctr?: number | null;
  metaLeads?: number | null;
  costPerLead?: number | null;
  nexthireLeadsCount?: number;
  costPerCandidate?: number | null;
  datePreset?: string;
  capturedAtUtc?: string;
  source?: string;
}

export interface MetaInsightsHistoryCampaignCompare {
  metaCampaignId: string;
  campaignName: string;
  platform?: string;
  localCampaignId?: string;
  weekA?: MetaInsightsSnapshotMetrics | null;
  weekB?: MetaInsightsSnapshotMetrics | null;
  delta?: MetaInsightsSnapshotMetrics | null;
}

export interface MetaInsightsHistory {
  weeks: string[];
  weekA?: string | null;
  weekB?: string | null;
  campaigns: MetaInsightsHistoryCampaignCompare[];
  totalsWeekA?: MetaInsightsSnapshotMetrics | null;
  totalsWeekB?: MetaInsightsSnapshotMetrics | null;
  totalsDelta?: MetaInsightsSnapshotMetrics | null;
}

export type MetaAdAccountStatusKey =
  | 'active'
  | 'disabled'
  | 'unsettled'
  | 'pending'
  | 'grace'
  | 'closed'
  | 'unknown';

export interface MetaAdAccountStatus {
  adAccountId: string;
  name?: string;
  currency: string;
  accountStatus: number;
  statusKey: MetaAdAccountStatusKey | string;
  statusLabel: string;
  isHealthy: boolean;
  isPaymentIssue: boolean;
  disableReason?: number | null;
  disableReasonLabel?: string | null;
  amountSpent?: number | null;
  balance?: number | null;
  spendCap?: number | null;
  fundingSourceDisplay?: string | null;
}

import { apiClient } from '../lib/api';
import type { SourcingCampaign } from '../types/sourcing';
import type {
  GenerateMetaCreativePreviewRequest,
  GenerateMetaCreativePreviewResponse,
  MetaCampaignCreatePayload,
  MetaCampaignCreateResult,
  MetaCampaignInsights,
  MetaCampaignInsightsList,
  MetaInsightsHistory,
  MetaInsightsSnapshotMetrics,
  MetaCampaignPauseResult,
  MetaAdAccountStatus,
  MetaGeoResolveCandidate,
  MetaGeoResolveResponse,
  MetaInsightAction,
} from '../types/metaCampaign';

export async function createMetaCampaign(payload: MetaCampaignCreatePayload): Promise<MetaCampaignCreateResult> {
  const raw = await apiClient.post<unknown>('/marketing/meta/campaigns', payload, true);
  return normalizeCreateResponse(raw);
}

/** One row from marketing_meta_campaigns (includes creative imageBase64 when stored). */
export async function getMetaMarketingCampaign(localRecordId: string | number): Promise<{
  id: string;
  imageBase64?: string;
  imageContentType?: string;
  imageHash?: string;
  adText?: string;
  destinationUrl?: string;
  campaignName?: string;
} | null> {
  try {
    const raw = await apiClient.get<unknown>(
      `/marketing/meta/campaigns/${encodeCampaignRef(localRecordId)}`,
      true
    );
    const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const id = String(o.id ?? o.Id ?? '').trim();
    if (!id) return null;
    return {
      id,
      imageBase64: String(o.imageBase64 ?? o.ImageBase64 ?? o.image_base64 ?? '').trim() || undefined,
      imageContentType:
        String(o.imageContentType ?? o.ImageContentType ?? o.image_content_type ?? '').trim() || undefined,
      imageHash: String(o.imageHash ?? o.ImageHash ?? o.image_hash ?? '').trim() || undefined,
      adText: String(o.adText ?? o.AdText ?? o.ad_text ?? '').trim() || undefined,
      destinationUrl:
        String(o.destinationUrl ?? o.DestinationUrl ?? o.destination_url ?? '').trim() || undefined,
      campaignName: String(o.campaignName ?? o.CampaignName ?? o.campaign_name ?? '').trim() || undefined,
    };
  } catch {
    return null;
  }
}

export async function publishMetaCampaignPagePost(
  campaignRef: string | number,
  payload: {
    message: string;
    link: string;
    imageBase64?: string;
    imageContentType?: string;
  }
): Promise<{ postId: string; pageId: string; permalinkUrl?: string }> {
  const raw = await apiClient.post<unknown>(
    `/marketing/meta/campaigns/${encodeCampaignRef(campaignRef)}/page-post`,
    payload,
    true
  );
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    postId: String(o.postId ?? o.PostId ?? o.post_id ?? '').trim(),
    pageId: String(o.pageId ?? o.PageId ?? o.page_id ?? '').trim(),
    permalinkUrl: String(o.permalinkUrl ?? o.PermalinkUrl ?? o.permalink_url ?? '').trim() || undefined,
  };
}

function encodeCampaignRef(campaignRef: string | number): string {
  return encodeURIComponent(String(campaignRef).trim());
}

/** localRecordId (GUID) or Meta campaignId — both accepted by the API. */
export function metaCampaignRef(c: SourcingCampaign): string | number | null {
  if (c.id != null && String(c.id).trim()) return c.id;
  const metaId = c.externalCampaignId;
  if (metaId != null && String(metaId).trim()) return String(metaId).trim();
  return null;
}

/** Prefer Meta campaign id when present so insights hit Graph by Meta id. */
export function metaCampaignInsightsRef(c: SourcingCampaign): string | number | null {
  const metaId = c.externalCampaignId;
  if (metaId != null && String(metaId).trim()) return String(metaId).trim();
  return metaCampaignRef(c);
}

/** Pause campaign in Meta and update local sourcing record (backend handles both). */
export async function pauseMetaCampaign(campaignRef: string | number): Promise<MetaCampaignPauseResult> {
  const raw = await apiClient.post<unknown>(
    `/marketing/meta/campaigns/${encodeCampaignRef(campaignRef)}/pause`,
    undefined,
    true
  );
  return normalizePauseResponse(raw);
}

/** Delete campaign in Meta and remove local sourcing record. */
export async function deleteMetaCampaign(campaignRef: string | number): Promise<void> {
  await apiClient.delete(`/marketing/meta/campaigns/${encodeCampaignRef(campaignRef)}`, true);
}

/** Live Meta Insights for one campaign (local GUID or Meta campaign id). */
export async function getMetaCampaignInsights(
  campaignRef: string | number,
  datePreset = 'maximum'
): Promise<MetaCampaignInsights> {
  const q = datePreset ? `?datePreset=${encodeURIComponent(datePreset)}` : '';
  const raw = await apiClient.get<unknown>(
    `/marketing/meta/campaigns/${encodeCampaignRef(campaignRef)}/insights${q}`,
    true
  );
  return normalizeInsights(raw);
}

/** Live Meta Insights for all org Meta campaigns (table summary). */
export async function listMetaCampaignInsights(datePreset = 'maximum'): Promise<MetaCampaignInsightsList> {
  const q = datePreset ? `?datePreset=${encodeURIComponent(datePreset)}` : '';
  const raw = await apiClient.get<unknown>(`/marketing/meta/insights${q}`, true);
  return normalizeInsightsList(raw);
}

/** Week-over-week historical snapshots (captured on insights fetch + delete). */
export async function getMetaInsightsHistory(params?: {
  weekA?: string;
  weekB?: string;
}): Promise<MetaInsightsHistory> {
  const q = new URLSearchParams();
  if (params?.weekA) q.set('weekA', params.weekA);
  if (params?.weekB) q.set('weekB', params.weekB);
  const qs = q.toString();
  const raw = await apiClient.get<unknown>(`/marketing/meta/insights/history${qs ? `?${qs}` : ''}`, true);
  return normalizeInsightsHistory(raw);
}

/** Live Meta Ad Account status (payment / disable / active). */
export async function getMetaAdAccountStatus(): Promise<MetaAdAccountStatus> {
  const raw = await apiClient.get<unknown>('/marketing/meta/ad-account/status', true);
  return normalizeAdAccountStatus(raw);
}

export async function resolveMetaGeo(payload: {
  query: string;
  countryCode?: string;
  locationTypes?: string[];
  limit?: number;
}): Promise<MetaGeoResolveResponse> {
  try {
    const raw = await apiClient.post<unknown>('/marketing/meta/geo/resolve', payload, true);
    return normalizeGeoResolveResponse(raw);
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'status' in e && (e as { status: number }).status === 404) {
      throw Object.assign(new Error('Geo resolve endpoint is not available on the server.'), { status: 404 });
    }
    throw e;
  }
}

export async function uploadMetaCreativeImage(file: File): Promise<{ imageHash: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const raw = await apiClient.post<unknown>('/marketing/meta/creative-image', fd, true);
  return normalizeImageResponse(raw);
}

export async function generateMetaCreativePreview(
  payload: GenerateMetaCreativePreviewRequest
): Promise<GenerateMetaCreativePreviewResponse> {
  const raw = await apiClient.post<unknown>('/marketing/meta/creative-image/demo', payload, true);
  return normalizeCreativePreviewResponse(raw);
}

function normalizeCreateResponse(raw: unknown): MetaCampaignCreateResult {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pick = (snake: string, camel: string) => String(o[snake] ?? o[camel] ?? '').trim();
  const adAccountId = pick('ad_account_id', 'adAccountId');
  const adsManagerUrl =
    String(o.adsManagerUrl ?? o.ads_manager_url ?? '').trim() ||
    (adAccountId
      ? `https://adsmanager.facebook.com/adsmanager/manage/ads?act=${encodeURIComponent(adAccountId)}`
      : '');
  const localRecordId = pick('local_record_id', 'localRecordId');
  const campaignId =
    pick('campaign_id', 'campaignId') || pick('meta_campaign_id', 'metaCampaignId');
  const adSetId = pick('ad_set_id', 'adSetId') || pick('meta_ad_set_id', 'metaAdSetId');
  const adId = pick('ad_id', 'adId') || pick('meta_ad_id', 'metaAdId');
  return {
    localRecordId,
    campaignId,
    adSetId,
    creativeId: pick('creative_id', 'creativeId'),
    adId,
    adAccountId,
    adsManagerUrl: adsManagerUrl || undefined,
  };
}

function normalizePauseResponse(raw: unknown): MetaCampaignPauseResult {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pick = (snake: string, camel: string) => String(o[snake] ?? o[camel] ?? '').trim() || undefined;
  return {
    localRecordId: pick('local_record_id', 'localRecordId'),
    status: pick('status', 'status'),
    metaCampaignId: pick('meta_campaign_id', 'metaCampaignId'),
    metaAdSetId: pick('meta_ad_set_id', 'metaAdSetId'),
    metaAdId: pick('meta_ad_id', 'metaAdId'),
  };
}

function asNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeInsightActions(raw: unknown): MetaInsightAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const actionType = String(o.actionType ?? o.action_type ?? '').trim();
      const value = asNum(o.value);
      if (!actionType || value == null) return null;
      return { actionType, value };
    })
    .filter((x): x is MetaInsightAction => x != null);
}

function normalizeInsights(raw: unknown): MetaCampaignInsights {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pickStr = (...keys: string[]) => {
    for (const k of keys) {
      const v = o[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return undefined;
  };
  return {
    localRecordId: pickStr('localRecordId', 'local_record_id'),
    metaCampaignId: pickStr('metaCampaignId', 'meta_campaign_id'),
    campaignName: pickStr('campaignName', 'campaign_name'),
    datePreset: pickStr('datePreset', 'date_preset') || 'maximum',
    dateStart: pickStr('dateStart', 'date_start'),
    dateStop: pickStr('dateStop', 'date_stop'),
    impressions: asNum(o.impressions),
    reach: asNum(o.reach),
    clicks: asNum(o.clicks),
    uniqueClicks: asNum(o.uniqueClicks ?? o.unique_clicks),
    inlineLinkClicks: asNum(o.inlineLinkClicks ?? o.inline_link_clicks),
    outboundClicks: asNum(o.outboundClicks ?? o.outbound_clicks),
    spend: asNum(o.spend),
    cpc: asNum(o.cpc),
    cpm: asNum(o.cpm),
    cpp: asNum(o.cpp),
    ctr: asNum(o.ctr),
    frequency: asNum(o.frequency),
    costPerInlineLinkClick: asNum(o.costPerInlineLinkClick ?? o.cost_per_inline_link_click),
    metaLeads: asNum(o.metaLeads ?? o.meta_leads),
    costPerLead: asNum(o.costPerLead ?? o.cost_per_lead),
    actions: normalizeInsightActions(o.actions),
    costPerActionType: normalizeInsightActions(o.costPerActionType ?? o.cost_per_action_type),
    empty: Boolean(o.empty),
  };
}

function normalizeInsightsList(raw: unknown): MetaCampaignInsightsList {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(o.items) ? o.items : Array.isArray(raw) ? raw : [];
  return {
    datePreset: String(o.datePreset ?? o.date_preset ?? 'maximum').trim() || 'maximum',
    items: list.map(normalizeInsights),
  };
}

function normalizeSnapshotMetrics(raw: unknown): MetaInsightsSnapshotMetrics | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  return {
    spend: asNum(o.spend),
    impressions: asNum(o.impressions),
    reach: asNum(o.reach),
    clicks: asNum(o.clicks),
    inlineLinkClicks: asNum(o.inlineLinkClicks ?? o.inline_link_clicks),
    cpc: asNum(o.cpc),
    cpm: asNum(o.cpm),
    ctr: asNum(o.ctr),
    metaLeads: asNum(o.metaLeads ?? o.meta_leads),
    costPerLead: asNum(o.costPerLead ?? o.cost_per_lead),
    nexthireLeadsCount: asNum(o.nexthireLeadsCount ?? o.nexthire_leads_count) ?? 0,
    costPerCandidate: asNum(o.costPerCandidate ?? o.cost_per_candidate),
    datePreset:
      o.datePreset != null || o.date_preset != null ? String(o.datePreset ?? o.date_preset) : undefined,
    capturedAtUtc:
      o.capturedAtUtc != null || o.captured_at_utc != null
        ? String(o.capturedAtUtc ?? o.captured_at_utc)
        : undefined,
    source: o.source != null ? String(o.source) : undefined,
  };
}

function normalizeInsightsHistory(raw: unknown): MetaInsightsHistory {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const weeksRaw = Array.isArray(o.weeks) ? o.weeks : [];
  const campaignsRaw = Array.isArray(o.campaigns) ? o.campaigns : [];
  return {
    weeks: weeksRaw.map((w) => String(w).trim()).filter(Boolean),
    weekA: o.weekA != null || o.week_a != null ? String(o.weekA ?? o.week_a) : null,
    weekB: o.weekB != null || o.week_b != null ? String(o.weekB ?? o.week_b) : null,
    campaigns: campaignsRaw.map((item) => {
      const c = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      return {
        metaCampaignId: String(c.metaCampaignId ?? c.meta_campaign_id ?? '').trim(),
        campaignName: String(c.campaignName ?? c.campaign_name ?? '').trim(),
        platform: String(c.platform ?? 'meta_ads').trim() || 'meta_ads',
        localCampaignId:
          c.localCampaignId != null || c.local_campaign_id != null
            ? String(c.localCampaignId ?? c.local_campaign_id)
            : undefined,
        weekA: normalizeSnapshotMetrics(c.weekA ?? c.week_a),
        weekB: normalizeSnapshotMetrics(c.weekB ?? c.week_b),
        delta: normalizeSnapshotMetrics(c.delta),
      };
    }),
    totalsWeekA: normalizeSnapshotMetrics(o.totalsWeekA ?? o.totals_week_a),
    totalsWeekB: normalizeSnapshotMetrics(o.totalsWeekB ?? o.totals_week_b),
    totalsDelta: normalizeSnapshotMetrics(o.totalsDelta ?? o.totals_delta),
  };
}

function normalizeAdAccountStatus(raw: unknown): MetaAdAccountStatus {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pickStr = (...keys: string[]) => {
    for (const k of keys) {
      const v = o[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return undefined;
  };
  return {
    adAccountId: pickStr('adAccountId', 'ad_account_id') || '',
    name: pickStr('name'),
    currency: pickStr('currency') || 'USD',
    accountStatus: asNum(o.accountStatus ?? o.account_status) ?? 0,
    statusKey: pickStr('statusKey', 'status_key') || 'unknown',
    statusLabel: pickStr('statusLabel', 'status_label') || 'Unknown',
    isHealthy: Boolean(o.isHealthy ?? o.is_healthy),
    isPaymentIssue: Boolean(o.isPaymentIssue ?? o.is_payment_issue),
    disableReason: asNum(o.disableReason ?? o.disable_reason),
    disableReasonLabel: pickStr('disableReasonLabel', 'disable_reason_label') || null,
    amountSpent: asNum(o.amountSpent ?? o.amount_spent),
    balance: asNum(o.balance),
    spendCap: asNum(o.spendCap ?? o.spend_cap),
    fundingSourceDisplay: pickStr('fundingSourceDisplay', 'funding_source_display') || null,
  };
}

function normalizeGeoCandidate(raw: unknown): MetaGeoResolveCandidate | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const key = String(o.key ?? o.id ?? '').trim();
  const name = String(o.name ?? o.label ?? o.title ?? '').trim();
  if (!key || !name) return null;
  return {
    key,
    name,
    type: String(o.type ?? o.locationType ?? o.location_type ?? '').trim() || undefined,
    countryCode: String(o.countryCode ?? o.country_code ?? '').trim() || undefined,
  };
}

function normalizeGeoResolveResponse(raw: unknown): MetaGeoResolveResponse {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(o.candidates) ? o.candidates : [];
  const candidates = list.map(normalizeGeoCandidate).filter((x): x is MetaGeoResolveCandidate => x !== null);
  const bestRaw = o.best ?? o.selected ?? null;
  const best = normalizeGeoCandidate(bestRaw);
  return { candidates, best: best ?? candidates[0] ?? null };
}

function normalizeImageResponse(raw: unknown): { imageHash: string } {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const hash = String(o.imageHash ?? o.image_hash ?? o.hash ?? '').trim();
  return { imageHash: hash };
}

function normalizeCreativePreviewResponse(raw: unknown): GenerateMetaCreativePreviewResponse {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    imageBase64: String(o.imageBase64 ?? o.image_base64 ?? '').trim(),
    contentType: String(o.contentType ?? o.content_type ?? 'image/png').trim() || 'image/png',
    width: Number(o.width ?? 0) || 0,
    height: Number(o.height ?? 0) || 0,
    metaCreativeHint: String(o.metaCreativeHint ?? o.meta_creative_hint ?? '').trim(),
    imagePrompt: String(o.imagePrompt ?? o.image_prompt ?? '').trim(),
    imageHash: String(o.imageHash ?? o.image_hash ?? '').trim() || undefined,
    imageUrl: String(o.imageUrl ?? o.image_url ?? '').trim() || undefined,
  };
}

function pickMetaErrorFields(source: Record<string, unknown>): {
  title: string;
  userMsg: string;
} {
  return {
    title: String(source.metaErrorUserTitle ?? source.meta_error_user_title ?? '').trim(),
    userMsg: String(source.metaErrorUserMsg ?? source.meta_error_user_msg ?? '').trim(),
  };
}

/** Prefer Meta's user-facing title + message over generic "Invalid parameter". */
export function metaErrorMessageFromUnknown(e: unknown): string | null {
  if (!e || typeof e !== 'object') return null;
  const o = e as Record<string, unknown>;
  const details =
    o.details && typeof o.details === 'object' && !Array.isArray(o.details)
      ? (o.details as Record<string, unknown>)
      : null;

  const fromDetails = details ? pickMetaErrorFields(details) : { title: '', userMsg: '' };
  const fromRoot = pickMetaErrorFields(o);
  const title = fromDetails.title || fromRoot.title;
  const userMsg = fromDetails.userMsg || fromRoot.userMsg;

  if (title && userMsg) return `${title}: ${userMsg}`;
  if (userMsg) return userMsg;
  if (title) return title;

  const permissionError =
    Boolean(details?.permissionError) || Boolean(o.permissionError) || o.status === 403;
  if (permissionError) {
    const permMsg = String(details?.error ?? o.error ?? o.message ?? '').trim();
    if (permMsg) return permMsg;
  }

  const msg = String(o.message ?? details?.message ?? details?.error ?? o.error ?? '').trim();
  return msg || null;
}

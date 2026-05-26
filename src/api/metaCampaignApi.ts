import { apiClient } from '../lib/api';
import type { SourcingCampaign } from '../types/sourcing';
import type {
  GenerateMetaCreativePreviewRequest,
  GenerateMetaCreativePreviewResponse,
  MetaCampaignCreatePayload,
  MetaCampaignCreateResult,
  MetaCampaignPauseResult,
  MetaGeoResolveCandidate,
  MetaGeoResolveResponse,
} from '../types/metaCampaign';

export async function createMetaCampaign(payload: MetaCampaignCreatePayload): Promise<MetaCampaignCreateResult> {
  const raw = await apiClient.post<unknown>('/marketing/meta/campaigns', payload, true);
  return normalizeCreateResponse(raw);
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

export function metaErrorMessageFromUnknown(e: unknown): string | null {
  if (!e || typeof e !== 'object') return null;
  const o = e as Record<string, unknown>;
  const meta = String(o.metaErrorUserMsg ?? o.meta_error_user_msg ?? '').trim();
  if (meta) return meta;
  const msg = String(o.message ?? '').trim();
  return msg || null;
}

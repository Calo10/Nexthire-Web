import { apiClient } from '../lib/api';
import type {
  GenerateMetaCreativePreviewRequest,
  GenerateMetaCreativePreviewResponse,
  MetaCampaignCreatePayload,
  MetaCampaignCreateResult,
} from '../types/metaCampaign';

/**
 * Creates a Meta campaign stack (campaign, ad set, creative, ad) via NextHire API only.
 */
export async function createMetaCampaign(payload: MetaCampaignCreatePayload): Promise<MetaCampaignCreateResult> {
  const raw = await apiClient.post<unknown>('/marketing/meta/campaigns', payload, true);
  return normalizeCreateResponse(raw);
}

function normalizeCreateResponse(raw: unknown): MetaCampaignCreateResult {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pick = (snake: string, camel: string) =>
    String(o[snake] ?? o[camel] ?? '').trim();
  return {
    campaignId: pick('campaign_id', 'campaignId'),
    adSetId: pick('ad_set_id', 'adSetId'),
    creativeId: pick('creative_id', 'creativeId'),
    adId: pick('ad_id', 'adId'),
    adAccountId: pick('ad_account_id', 'adAccountId'),
  };
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
  const raw = await apiClient.post<unknown>('/marketing/meta/creative-image/demo', payload);
  return normalizeCreativePreviewResponse(raw);
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

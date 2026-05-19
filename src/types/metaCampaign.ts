import type { Job } from './dashboard';

export type MetaPlatformChoice = 'facebook' | 'instagram' | 'both';

export type MetaDestinationType = 'whatsapp' | 'job_post_url';

export type MetaCtaType = 'LEARN_MORE' | 'APPLY_NOW' | 'SIGN_UP';

export interface MetaCampaignCreatePayload {
  tenantId: string;
  jobId: string;
  campaignName: string;
  objective: string;
  dailyBudget: number;
  country: string;
  ageMin: number;
  ageMax: number;
  platforms: ('facebook' | 'instagram')[];
  destinationType: MetaDestinationType;
  destinationUrl: string;
  whatsappMessage: string;
  adText: string;
  ctaType: MetaCtaType;
  imageHash: string;
  status: string;
}

export interface MetaCampaignCreateResult {
  campaignId: string;
  adSetId: string;
  creativeId: string;
  adId: string;
  adAccountId: string;
}

export interface GenerateMetaCreativePreviewRequest {
  jobId: string;
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

export function platformsFromChoice(choice: MetaPlatformChoice): ('facebook' | 'instagram')[] {
  if (choice === 'both') return ['facebook', 'instagram'];
  if (choice === 'facebook') return ['facebook'];
  return ['instagram'];
}

export function jobCodeFromJob(job: Job): string {
  const j = job as Job & { code?: string; jobCode?: string };
  const c = j.code ?? j.jobCode;
  return String(c ?? job.id).trim();
}

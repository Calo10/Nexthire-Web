import { apiClient } from '../lib/api';
import {
  normalizeListResponse,
  normalizePagedResult,
  unwrapPayload,
  asRecord,
} from '../lib/normalizeApiResponse';
import { buildQuery, type QueryParams } from '../lib/buildQuery';
import type {
  SourcingLead,
  SourcingDashboard,
  SourcingCampaign,
  SourcingSourceType,
  SourcingSourceConnection,
} from '../types/sourcing';

const SKIP_UNAUTHORIZED = true;

function encodeId(id: string | number): string {
  return encodeURIComponent(String(id));
}

export async function getSourcingDashboard(): Promise<SourcingDashboard> {
  const raw = await apiClient.get<unknown>('/sourcing/dashboard', SKIP_UNAUTHORIZED);
  const u = unwrapPayload(raw);
  const rec = asRecord(u);
  return (rec || {}) as SourcingDashboard;
}

export interface GetSourcingLeadsParams extends QueryParams {
  page?: number;
  pageSize?: number;
  status?: string | string[];
  search?: string;
  jobId?: string | number;
  sourceType?: string;
  minFitScore?: number;
  from?: string;
  to?: string;
}

export async function getSourcingLeads(params?: GetSourcingLeadsParams) {
  const q = buildQuery(params as QueryParams);
  const raw = await apiClient.get<unknown>(`/sourcing/leads${q}`, SKIP_UNAUTHORIZED);
  return normalizePagedResult<SourcingLead>(raw);
}

export async function getSourcingLead(id: string | number): Promise<SourcingLead | null> {
  const raw = await apiClient.get<unknown>(`/sourcing/leads/${encodeId(id)}`, SKIP_UNAUTHORIZED);
  const u = unwrapPayload(raw);
  if (u && typeof u === 'object' && !Array.isArray(u)) return u as SourcingLead;
  return null;
}

export async function createSourcingLead(payload: Record<string, unknown> | FormData): Promise<unknown> {
  return apiClient.post('/sourcing/leads', payload);
}

export async function updateSourcingLead(id: string | number, payload: Record<string, unknown>): Promise<unknown> {
  return apiClient.put(`/sourcing/leads/${encodeId(id)}`, payload, SKIP_UNAUTHORIZED);
}

export async function updateSourcingLeadStatus(
  id: string | number,
  payload: { status: string }
): Promise<unknown> {
  return apiClient.patch(`/sourcing/leads/${encodeId(id)}/status`, payload, SKIP_UNAUTHORIZED);
}

export async function convertSourcingLeadToCandidate(id: string | number): Promise<unknown> {
  return apiClient.post(`/sourcing/leads/${encodeId(id)}/convert-to-candidate`, {}, SKIP_UNAUTHORIZED);
}

export interface GetSourcingCampaignsParams extends QueryParams {
  page?: number;
  pageSize?: number;
}

export async function getSourcingCampaigns(params?: GetSourcingCampaignsParams) {
  const q = buildQuery(params as QueryParams);
  const raw = await apiClient.get<unknown>(`/sourcing/campaigns${q}`, SKIP_UNAUTHORIZED);
  const u = unwrapPayload(raw);
  const items = normalizeListResponse<SourcingCampaign>(u);
  const rec = asRecord(u);
  const total = Number(rec?.totalCount ?? rec?.total ?? items.length) || items.length;
  return { items, total };
}

export async function getSourcingCampaign(id: string | number): Promise<SourcingCampaign | null> {
  const raw = await apiClient.get<unknown>(`/sourcing/campaigns/${encodeId(id)}`, SKIP_UNAUTHORIZED);
  const u = unwrapPayload(raw);
  if (u && typeof u === 'object' && !Array.isArray(u)) return u as SourcingCampaign;
  return null;
}

export async function createSourcingCampaign(payload: Record<string, unknown>): Promise<unknown> {
  return apiClient.post('/sourcing/campaigns', payload);
}

export async function updateSourcingCampaign(id: string | number, payload: Record<string, unknown>): Promise<unknown> {
  return apiClient.put(`/sourcing/campaigns/${encodeId(id)}`, payload, SKIP_UNAUTHORIZED);
}

export async function updateSourcingCampaignStatus(
  id: string | number,
  payload: { status: string }
): Promise<unknown> {
  return apiClient.patch(`/sourcing/campaigns/${encodeId(id)}/status`, payload, SKIP_UNAUTHORIZED);
}

export async function deleteSourcingCampaign(id: string | number): Promise<unknown> {
  return apiClient.delete(`/sourcing/campaigns/${encodeId(id)}`, SKIP_UNAUTHORIZED);
}

export async function postSourcingTrackingEvent(payload: Record<string, unknown>): Promise<unknown> {
  return apiClient.post('/sourcing/tracking-events', payload, SKIP_UNAUTHORIZED);
}

export async function getSourcingSourceTypes(): Promise<SourcingSourceType[]> {
  const raw = await apiClient.get<unknown>('/sourcing/source-types', SKIP_UNAUTHORIZED);
  return normalizeListResponse<SourcingSourceType>(unwrapPayload(raw));
}

export async function getSourcingSourceConnections(): Promise<SourcingSourceConnection[]> {
  const raw = await apiClient.get<unknown>('/sourcing/source-connections', SKIP_UNAUTHORIZED);
  return normalizeListResponse<SourcingSourceConnection>(unwrapPayload(raw));
}

export async function saveSourcingSourceConnection(payload: Record<string, unknown>): Promise<unknown> {
  return apiClient.post('/sourcing/source-connections', payload);
}

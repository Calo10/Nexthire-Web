import { publicRequest } from './publicApiClient';

export interface PublicCandidateCard {
  id: string;
  displayName: string;
  source?: string | null;
  tags: Array<{ id: string; name: string }>;
  createdAt: string;
}

export interface PublicCandidateList {
  id: string;
  name: string;
  items: PublicCandidateCard[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PublicCandidateAnalysis {
  summary?: string | null;
  language?: string | null;
  docType?: string | null;
  keyPoints: string[];
  warnings: string[];
}

export interface PublicCandidateDetail extends PublicCandidateCard {
  analysis: PublicCandidateAnalysis | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function text(value: unknown): string {
  return value == null ? '' : String(value);
}

function mapTags(raw: unknown): Array<{ id: string; name: string }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const tag = asRecord(item);
      return {
        id: text(tag.id ?? tag.Id),
        name: text(tag.name ?? tag.Name).trim(),
      };
    })
    .filter((tag) => tag.id && tag.name);
}

function mapCard(raw: unknown): PublicCandidateCard | null {
  const item = asRecord(raw);
  const id = text(item.id ?? item.Id).trim();
  if (!id) return null;
  return {
    id,
    displayName: text(item.displayName ?? item.DisplayName).trim(),
    source: text(item.source ?? item.Source).trim() || null,
    tags: mapTags(item.tags ?? item.Tags),
    createdAt: text(item.createdAt ?? item.CreatedAt),
  };
}

function mapAnalysis(raw: unknown): PublicCandidateAnalysis | null {
  const envelope = asRecord(raw);
  const analysis = asRecord(envelope.analysis ?? envelope.Analysis);
  if (!analysis || Object.keys(analysis).length === 0) return null;
  const keyPoints = analysis.keyPoints ?? analysis.KeyPoints;
  const warnings = analysis.warnings ?? analysis.Warnings;
  return {
    summary: text(analysis.summary ?? analysis.Summary).trim() || null,
    language: text(analysis.language ?? analysis.Language).trim() || null,
    docType: text(analysis.docType ?? analysis.DocType).trim() || null,
    keyPoints: Array.isArray(keyPoints) ? keyPoints.map((point) => text(point).trim()).filter(Boolean) : [],
    warnings: Array.isArray(warnings) ? warnings.map((point) => text(point).trim()).filter(Boolean) : [],
  };
}

export const publicCandidatesApi = {
  list: async (orgId: string, linkId: string, page = 1): Promise<PublicCandidateList> => {
    const query = new URLSearchParams({ orgId, page: String(page), pageSize: '25' });
    const raw = asRecord(await publicRequest<unknown>(`/candidate-links/${encodeURIComponent(linkId)}?${query.toString()}`));
    const itemsRaw = raw.items ?? raw.Items;
    return {
      id: text(raw.id ?? raw.Id),
      name: text(raw.name ?? raw.Name).trim(),
      items: Array.isArray(itemsRaw) ? itemsRaw.map(mapCard).filter((item): item is PublicCandidateCard => item != null) : [],
      page: Number(raw.page ?? raw.Page ?? page) || page,
      pageSize: Number(raw.pageSize ?? raw.PageSize ?? 25) || 25,
      total: Number(raw.total ?? raw.Total ?? 0) || 0,
    };
  },

  detail: async (orgId: string, linkId: string, candidateId: string): Promise<PublicCandidateDetail> => {
    const query = new URLSearchParams({ orgId });
    const raw = await publicRequest<unknown>(
      `/candidate-links/${encodeURIComponent(linkId)}/candidates/${encodeURIComponent(candidateId)}?${query.toString()}`,
      { timeoutMs: 60000 }
    );
    const card = mapCard(raw);
    if (!card) throw new Error('Candidate not found');
    const record = asRecord(raw);
    return {
      ...card,
      analysis: mapAnalysis(record.analysis ?? record.Analysis),
    };
  },
};

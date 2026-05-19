import { apiClient } from '../lib/api';
import type {
  Candidate,
  CandidatesListResponse,
  CreateCandidateFromApplyFormPayload,
  CreateCandidatePayload,
  GetCandidatesParams,
  UpdateCandidatePayload,
} from '../types/candidates';

function mapCandidateDto(raw: unknown): Candidate {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? r.Id ?? ''),
    firstName: String(r.firstName ?? r.FirstName ?? ''),
    lastName: String(r.lastName ?? r.LastName ?? ''),
    email: String(r.email ?? r.Email ?? ''),
    phone:
      (r.phone ?? r.Phone ?? r.phoneNumber ?? r.PhoneNumber ?? r.mobile ?? r.Mobile) != null
        ? String(r.phone ?? r.Phone ?? r.phoneNumber ?? r.PhoneNumber ?? r.mobile ?? r.Mobile)
        : undefined,
    source: (r.source ?? r.Source) != null ? String(r.source ?? r.Source) : undefined,
    resumeUrl: (r.resumeUrl ?? r.ResumeUrl) != null ? String(r.resumeUrl ?? r.ResumeUrl) : undefined,
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ''),
    updatedAt: String(r.updatedAt ?? r.UpdatedAt ?? ''),
  };
}

function buildQuery(params?: GetCandidatesParams): string {
  const qp = new URLSearchParams();
  if (params?.search) qp.set('search', params.search);
  if (params?.source) qp.set('source', params.source);
  if (params?.from) qp.set('from', params.from);
  if (params?.to) qp.set('to', params.to);
  qp.set('page', String(params?.page ?? 1));
  qp.set('pageSize', String(params?.pageSize ?? 25));
  const query = qp.toString();
  return query ? `?${query}` : '';
}

export const candidatesApi = {
  list: async (params?: GetCandidatesParams): Promise<CandidatesListResponse | Candidate[]> => {
    // Skip unauthorized handler so API issues don't force logout/navigation
    return apiClient.get(`/candidates${buildQuery(params)}`, true);
  },

  create: async (payload: CreateCandidatePayload): Promise<Candidate> => {
    const { firstName, lastName, email, phone, source, resumeUrl } = payload;
    const raw = await apiClient.post<unknown>(
      '/candidates',
      {
        firstName,
        lastName,
        email,
        ...(phone ? { phone } : {}),
        ...(source ? { source } : {}),
        ...(resumeUrl?.trim() ? { resumeUrl: resumeUrl.trim() } : {}),
      },
      true
    );
    return mapCandidateDto(raw);
  },

  /**
   * POST /api/candidates/from-apply-form — multipart, same fields as public apply (FirstName, LastName, Email, Phone, Source, Resume).
   */
  createFromApplyForm: async (payload: CreateCandidateFromApplyFormPayload): Promise<Candidate> => {
    const form = new FormData();
    form.append('FirstName', String(payload.firstName || ''));
    form.append('LastName', String(payload.lastName || ''));
    form.append('Email', String(payload.email || ''));
    form.append('Phone', String(payload.phone || ''));
    form.append('Source', String(payload.source || ''));
    form.append('Resume', payload.resume);
    const raw = await apiClient.post<unknown>('/candidates/from-apply-form', form, true);
    return mapCandidateDto(raw);
  },

  getById: async (id: string): Promise<Candidate> => {
    const raw = await apiClient.get<unknown>(`/candidates/${encodeURIComponent(id)}`, true);
    return mapCandidateDto(raw);
  },

  update: async (id: string, payload: UpdateCandidatePayload): Promise<Candidate> => {
    // Skip unauthorized handler so API issues don't force logout/navigation
    return apiClient.put(`/candidates/${encodeURIComponent(id)}`, payload, true);
  },

  delete: async (id: string): Promise<void> => {
    // Skip unauthorized handler so API issues don't force logout/navigation
    await apiClient.delete(`/candidates/${encodeURIComponent(id)}`, true);
  },

  /**
   * GET /api/candidates/{candidateId}/resume/download-url
   * Response can be a string URL or an object like { url: "..." }.
   */
  resumeDownloadUrl: async (candidateId: string): Promise<string | null> => {
    const result = await apiClient.get<unknown>(`/candidates/${encodeURIComponent(candidateId)}/resume/download-url`, true);
    if (!result) return null;
    if (typeof result === 'string') return result.trim() || null;
    if (typeof result === 'object') {
      const r: any = result;
      const url = r.url ?? r.downloadUrl ?? r.download_url ?? r.resumeUrl ?? r.resume_url ?? r.link;
      return url ? String(url).trim() || null : null;
    }
    return null;
  },

  /**
   * GET /api/candidates/{candidateId}/resume/analysis
   * Response example:
   * { cached: true, analysis: { summary, language, docType, keyPoints, warnings, extractedTextChars, createdAtUtc } }
   */
  resumeAnalysis: async (
    candidateId: string
  ): Promise<{
    cached: boolean;
    analysis: {
      summary?: string | null;
      language?: string | null;
      docType?: string | null;
      keyPoints?: string[];
      warnings?: string[];
      extractedTextChars?: number | null;
      createdAtUtc?: string | null;
    } | null;
  } | null> => {
    const result = await apiClient.get<unknown>(`/candidates/${encodeURIComponent(candidateId)}/resume/analysis`, true);
    if (!result || typeof result !== 'object') return null;
    const r: any = result;
    const analysis: any = r.analysis && typeof r.analysis === 'object' ? r.analysis : null;
    return {
      cached: !!r.cached,
      analysis: analysis
        ? {
            summary: analysis.summary ?? null,
            language: analysis.language ?? null,
            docType: analysis.docType ?? analysis.doc_type ?? null,
            keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints.map((x: any) => String(x)) : [],
            warnings: Array.isArray(analysis.warnings) ? analysis.warnings.map((x: any) => String(x)) : [],
            extractedTextChars:
              typeof analysis.extractedTextChars === 'number' ? analysis.extractedTextChars : analysis.extracted_text_chars ?? null,
            createdAtUtc: analysis.createdAtUtc ?? analysis.created_at_utc ?? null,
          }
        : null,
    };
  },
};


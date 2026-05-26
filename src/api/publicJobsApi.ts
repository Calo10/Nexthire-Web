import { buildQuery } from '../lib/buildQuery';
import { normalizeListResponse, unwrapPayload } from '../lib/normalizeApiResponse';
import {
  filterAndOrderPublicApplySources,
  HIDDEN_PUBLIC_APPLY_SOURCE_CODES,
  PUBLIC_APPLY_ALLOWED_SOURCE_CODES,
} from '../lib/publicApplySourceTypes';
import { publicApiRequest, publicRequest } from './publicApiClient';
import type { ApplyJobRequest, ApplyJobResponse, JobPublicDTO, ListPublicJobsParams } from '../types/publicJobs';

function normalizeJob(raw: any): JobPublicDTO | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id ?? raw.jobId;
  const title = String(raw.title ?? raw.name ?? '');
  if (!id || !title) return null;
  return {
    id,
    title,
    description: raw.description ?? raw.body ?? raw.content ?? null,
    location: raw.location ?? null,
    department: raw.department ?? null,
    type: raw.type ?? raw.jobType ?? null,
    status: raw.status ?? 'open',
    postedAt: raw.postedAt ?? raw.posted_at ?? raw.createdAt ?? raw.created_at ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    alreadyApplied: raw.alreadyApplied ?? raw.hasApplied ?? null,
  };
}

function normalizeList(result: unknown): JobPublicDTO[] {
  const rawItems: any[] = Array.isArray(result)
    ? (result as any[])
    : result && typeof result === 'object'
      ? Array.isArray((result as any).items)
        ? ((result as any).items as any[])
        : Array.isArray((result as any).data)
          ? ((result as any).data as any[])
          : []
      : [];
  return rawItems.map(normalizeJob).filter(Boolean) as JobPublicDTO[];
}

export const publicJobsApi = {
  list: async (orgId: string, params: ListPublicJobsParams): Promise<JobPublicDTO[]> => {
    const effectiveSearch = params.search ?? params.query;
    const query = buildQuery({
      orgId,
      status: params.status,
      // Support both param names (BE may expect `search`).
      search: effectiveSearch,
      query: effectiveSearch,
      location: params.location,
      department: params.department,
      type: params.type,
      page: params.page,
      pageSize: params.pageSize,
    });
    // GET /api/public/jobs?orgId=...&status=open&...
    const result = await publicRequest<unknown>(`/jobs${query}`, { method: 'GET' });
    return normalizeList(result);
  },

  /**
   * Source types the candidate can pick on the apply form (codes must exist for the org in the backend).
   * GET /api/public/sourcing/source-types?orgId=...
   */
  getSourceTypesForApply: async (orgId: string): Promise<{ code: string; name: string }[]> => {
    try {
      const q = buildQuery({ orgId: String(orgId) });
      const raw = await publicRequest<unknown>(`/sourcing/source-types${q}`, { method: 'GET' });
      const u = unwrapPayload(raw);
      const items = normalizeListResponse<Record<string, unknown>>(u);
      const out: { code: string; name: string }[] = [];
      for (const item of items) {
        const code = String(
          item.code ?? item.sourceTypeCode ?? item.Code ?? item.SourceTypeCode ?? ''
        ).trim();
        if (!code) continue;
        if (HIDDEN_PUBLIC_APPLY_SOURCE_CODES.has(code.toLowerCase())) continue;
        const name = String(item.displayName ?? item.name ?? item.Name ?? item.DisplayName ?? code).trim() || code;
        out.push({ code, name });
      }
      return filterAndOrderPublicApplySources(out);
    } catch {
      return [];
    }
  },

  getById: async (orgId: string, jobId: string): Promise<JobPublicDTO> => {
    // GET /api/public/jobs/{jobId}?orgId=...
    const query = buildQuery({ orgId });
    const result = await publicRequest<unknown>(`/jobs/${encodeURIComponent(jobId)}${query}`, {
      method: 'GET',
    });
    const job = normalizeJob(result);
    if (!job) throw new Error('Invalid job response');
    return job;
  },

  apply: async (orgId: string, jobId: string, payload: ApplyJobRequest): Promise<ApplyJobResponse> => {
    // Public apply now creates a sourcing lead.
    // Backend requires multipart/form-data and Resume file in "Resume".
    const sourceTypeCode = String(payload.source || '').trim();
    if (!PUBLIC_APPLY_ALLOWED_SOURCE_CODES.has(sourceTypeCode.toLowerCase())) {
      throw new Error('Invalid or missing source type for application.');
    }
    const leadPayload = {
      orgId: String(orgId),
      jobId: String(jobId),
      sourceTypeCode,
      firstName: String(payload.firstName || '').trim(),
      lastName: String(payload.lastName || '').trim(),
      fullName: `${String(payload.firstName || '').trim()} ${String(payload.lastName || '').trim()}`.trim(),
      email: payload.email ? String(payload.email).trim() : null,
      phone: payload.phone ? String(payload.phone).trim() : null,
      qualificationNotes: [
        'Lead created from public job apply.',
        `orgId: ${orgId}`,
        `jobId: ${jobId}`,
        `sourceTypeCode: ${sourceTypeCode}`,
      ].join(' '),
    };

    const form = new FormData();
    // Keep both naming conventions for BE compatibility.
    form.append('OrgId', leadPayload.orgId);
    form.append('orgId', leadPayload.orgId);
    form.append('JobId', leadPayload.jobId);
    form.append('jobId', leadPayload.jobId);
    form.append('SourceTypeCode', leadPayload.sourceTypeCode);
    form.append('sourceTypeCode', leadPayload.sourceTypeCode);
    form.append('FirstName', leadPayload.firstName);
    form.append('LastName', leadPayload.lastName);
    form.append('FullName', leadPayload.fullName);
    form.append('Email', String(leadPayload.email || ''));
    form.append('Phone', String(leadPayload.phone || ''));
    form.append('QualificationNotes', String(leadPayload.qualificationNotes || ''));
    form.append('Source', sourceTypeCode);
    if (payload.availability?.trim()) {
      form.append('Availability', payload.availability.trim());
      form.append('availability', payload.availability.trim());
    }
    if (payload.experienceYears != null && String(payload.experienceYears).trim()) {
      const experienceYears = String(payload.experienceYears).trim();
      form.append('ExperienceYears', experienceYears);
      form.append('experienceYears', experienceYears);
    }
    if (payload.englishLevel?.trim()) {
      form.append('EnglishLevel', payload.englishLevel.trim());
      form.append('englishLevel', payload.englishLevel.trim());
    }
    if (payload.spanishLevel?.trim()) {
      form.append('SpanishLevel', payload.spanishLevel.trim());
      form.append('spanishLevel', payload.spanishLevel.trim());
    }
    if (payload.resume) form.append('Resume', payload.resume);

    const result = await publicApiRequest<unknown>('/api/sourcing/leads', {
      method: 'POST',
      headers: {
        accept: 'application/json',
      },
      body: form,
    });

    const asObj = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
    return {
      success: true,
      message: typeof asObj.message === 'string' ? asObj.message : undefined,
    };
  },
};


import { buildQuery } from '../lib/buildQuery';
import { buildDynamicAnswersPayload, normalizePublicBotQuestions, sortActiveBotQuestions } from '../lib/publicBotQuestions';
import { PUBLIC_APPLY_DEFAULT_SOURCE_CODE } from '../lib/publicApplySourceTypes';
import { publicRequest } from './publicApiClient';
import type { ApplyJobRequest, ApplyJobResponse, JobPublicDTO, ListPublicJobsParams } from '../types/publicJobs';
import type { JobBotQuestion } from '../types/jobBotQuestions';

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
    language: raw.language ?? null,
    botQuestions: sortActiveBotQuestions(normalizePublicBotQuestions(raw.botQuestions)),
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

function appendFormField(form: FormData, name: string, value: string) {
  form.append(name, value);
}

/** Single JSON field — do not duplicate camelCase/PascalCase or the server may concatenate invalid JSON. */
function appendJsonPart(form: FormData, name: string, payload: unknown) {
  form.append(name, JSON.stringify(payload));
}

export const publicJobsApi = {
  list: async (orgId: string, params: ListPublicJobsParams): Promise<JobPublicDTO[]> => {
    const effectiveSearch = params.search ?? params.query;
    const query = buildQuery({
      orgId,
      status: params.status,
      search: effectiveSearch,
      query: effectiveSearch,
      location: params.location,
      department: params.department,
      type: params.type,
      page: params.page,
      pageSize: params.pageSize,
    });
    const result = await publicRequest<unknown>(`/jobs${query}`, { method: 'GET' });
    return normalizeList(result);
  },

  getById: async (orgId: string, jobId: string): Promise<JobPublicDTO> => {
    const query = buildQuery({ orgId });
    const result = await publicRequest<unknown>(`/jobs/${encodeURIComponent(jobId)}${query}`, {
      method: 'GET',
    });
    const job = normalizeJob(result);
    if (!job) throw new Error('Invalid job response');
    return job;
  },

  apply: async (
    orgId: string,
    jobId: string,
    payload: ApplyJobRequest,
    botQuestions: JobBotQuestion[] = []
  ): Promise<ApplyJobResponse> => {
    const questions = sortActiveBotQuestions(botQuestions);
    const values: Record<string, string> = {};
    const files: Record<string, File> = {};

    for (const answer of payload.botAnswers) {
      if (answer.file) {
        files[answer.questionId] = answer.file;
      } else {
        values[answer.questionId] = answer.value;
      }
    }

    const dynamicAnswersJson = buildDynamicAnswersPayload(questions, values, {});

    const form = new FormData();
    const jobIdStr = String(jobId);
    const sourceTypeCode = PUBLIC_APPLY_DEFAULT_SOURCE_CODE;
    const firstName = String(payload.firstName || '').trim();
    const lastName = String(payload.lastName || '').trim();
    const email = String(payload.email || '').trim();
    const phone = payload.phone ? String(payload.phone).trim() : '';

    appendFormField(form, 'jobId', jobIdStr);
    appendFormField(form, 'JobId', jobIdStr);
    appendFormField(form, 'sourceTypeCode', sourceTypeCode);
    appendFormField(form, 'SourceTypeCode', sourceTypeCode);
    appendFormField(form, 'firstName', firstName);
    appendFormField(form, 'FirstName', firstName);
    appendFormField(form, 'lastName', lastName);
    appendFormField(form, 'LastName', lastName);
    appendFormField(form, 'email', email);
    appendFormField(form, 'Email', email);
    appendFormField(form, 'phone', phone);
    appendFormField(form, 'Phone', phone);
    appendJsonPart(form, 'dynamicAnswersJson', dynamicAnswersJson);

    for (const q of questions) {
      if (q.answerType !== 'file') continue;
      const file = files[q.id];
      if (!file) continue;
      form.append(`AnswerFile_${q.questionKey}`, file);
      form.append(`AnswerFile_${q.id}`, file);
      form.append(`answerFile_${q.questionKey}`, file);
      form.append(`answerFile_${q.id}`, file);
    }

    const query = buildQuery({ orgId });
    const result = await publicRequest<unknown>(
      `/jobs/${encodeURIComponent(jobId)}/apply${query}`,
      {
        method: 'POST',
        headers: { accept: 'application/json' },
        body: form,
      }
    );

    const asObj = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
    return {
      success: true,
      message: typeof asObj.message === 'string' ? asObj.message : undefined,
      alreadyApplied: !!asObj.alreadyApplied,
    };
  },
};

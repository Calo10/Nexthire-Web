import { apiClient } from '../../../lib/api';
import { buildQuery, type QueryParams } from '../../../lib/buildQuery';
import {
  normalizeListResponse,
  normalizePagedResult,
  unwrapPayload,
  type PagedResult,
} from '../../../lib/normalizeApiResponse';
import type {
  CreateOnboardingRequest,
  CreateOnboardingTaskRequest,
  OnboardingActivity,
  OnboardingDetail,
  OnboardingDocument,
  OnboardingListItem,
  OnboardingListQuery,
  OnboardingNotificationSetting,
  OnboardingPipeline,
  OnboardingPipelineQuery,
  OnboardingSummary,
  OnboardingTask,
  StartOnboardingForEmployeeRequest,
  UpdateOnboardingNotificationSettingRequest,
  UpdateOnboardingRequest,
  UpdateOnboardingTaskRequest,
} from '../models/onboarding';

const BASE = '/onboardings';

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dict(v: unknown): Record<string, number> {
  if (!v || typeof v !== 'object') return {};
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, num(val)]));
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function detail(raw: unknown): OnboardingDetail {
  const d = (unwrapPayload(raw) ?? {}) as OnboardingDetail;
  return {
    ...d,
    progressPercent: num(d.progressPercent),
    canComplete: !!d.canComplete,
    completionBlockers: arr<string>(d.completionBlockers),
    tasks: arr(d.tasks),
    documents: arr(d.documents),
  };
}

function task(raw: unknown): OnboardingTask {
  return unwrapPayload(raw) as OnboardingTask;
}

function filterParams(q: OnboardingPipelineQuery): QueryParams {
  return {
    search: q.search?.trim(),
    departmentId: q.departmentId,
    ownerUserId: q.ownerUserId,
    templateId: q.templateId,
    startFrom: q.startFrom,
    startTo: q.startTo,
    overdueOnly: q.overdueOnly ? true : undefined,
  };
}

function summary(raw: unknown): OnboardingSummary {
  const r = (unwrapPayload(raw) ?? {}) as Record<string, unknown>;
  return {
    periodStart: String(r.periodStart ?? ''),
    periodEnd: String(r.periodEnd ?? ''),
    activeOnboardings: num(r.activeOnboardings),
    notStarted: num(r.notStarted),
    inProgress: num(r.inProgress),
    inReview: num(r.inReview),
    startedInPeriod: num(r.startedInPeriod),
    previousStartedInPeriod: num(r.previousStartedInPeriod),
    completedInPeriod: num(r.completedInPeriod),
    previousCompletedInPeriod: num(r.previousCompletedInPeriod),
    averageCompletionDays: num(r.averageCompletionDays),
    previousAverageCompletionDays: num(r.previousAverageCompletionDays),
    averageProgressPercent: num(r.averageProgressPercent),
    overdueTasks: num(r.overdueTasks),
    overdueOnboardings: num(r.overdueOnboardings),
    upcomingStarts: num(r.upcomingStarts),
    byStatus: dict(r.byStatus),
    byDepartment: dict(r.byDepartment),
  };
}

export const onboardingsApi = {
  capabilities: async (): Promise<string[]> => {
    const raw = await apiClient.get<unknown>(`${BASE}/capabilities`);
    return normalizeListResponse<string>(raw).map(String);
  },

  list: async (query: OnboardingListQuery): Promise<PagedResult<OnboardingListItem>> => {
    const raw = await apiClient.get<unknown>(
      `${BASE}${buildQuery({
        ...filterParams(query),
        status: query.status,
        page: query.page,
        pageSize: query.pageSize,
        sort: query.sort,
        dir: query.dir,
      })}`,
    );
    return normalizePagedResult<OnboardingListItem>(raw);
  },

  pipeline: async (query: OnboardingPipelineQuery = {}): Promise<OnboardingPipeline> => {
    const raw = (unwrapPayload(await apiClient.get<unknown>(`${BASE}/pipeline${buildQuery(filterParams(query))}`)) ??
      {}) as Record<string, unknown>;
    const columns = arr<Record<string, unknown>>(raw.columns).map((c) => ({
      status: String(c.status ?? ''),
      label: String(c.label ?? ''),
      count: num(c.count),
      cards: arr<OnboardingPipeline['columns'][number]['cards'][number]>(c.cards).map((card) => ({
        ...card,
        progressPercent: num(card.progressPercent),
        overdueCount: num(card.overdueCount),
      })),
    }));
    return { columns };
  },

  summary: async (range?: { from?: string; to?: string }): Promise<OnboardingSummary> =>
    summary(await apiClient.get<unknown>(`${BASE}/summary${buildQuery({ from: range?.from, to: range?.to })}`)),

  get: async (id: string): Promise<OnboardingDetail> => detail(await apiClient.get<unknown>(`${BASE}/${id}`)),

  activity: async (id: string, take = 50): Promise<OnboardingActivity[]> =>
    normalizeListResponse<OnboardingActivity>(await apiClient.get<unknown>(`${BASE}/${id}/activity?take=${take}`)),

  documents: async (id: string): Promise<OnboardingDocument[]> =>
    normalizeListResponse<OnboardingDocument>(await apiClient.get<unknown>(`${BASE}/${id}/documents`)),

  create: async (body: CreateOnboardingRequest): Promise<OnboardingDetail> =>
    detail(await apiClient.post<unknown>(BASE, body)),

  /** Idempotent: returns the active onboarding for the employee or creates one with the best matching template. */
  startForEmployee: async (employeeId: string, body?: StartOnboardingForEmployeeRequest): Promise<OnboardingDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/from-employee/${employeeId}`, body ?? {})),

  update: async (id: string, body: UpdateOnboardingRequest): Promise<OnboardingDetail> =>
    detail(await apiClient.put<unknown>(`${BASE}/${id}`, body)),

  // Status transitions
  start: async (id: string): Promise<OnboardingDetail> => detail(await apiClient.post<unknown>(`${BASE}/${id}/start`)),
  submitReview: async (id: string): Promise<OnboardingDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/submit-review`)),
  returnToProgress: async (id: string): Promise<OnboardingDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/return-to-progress`)),
  complete: async (id: string, body?: { completionDate?: string | null; notes?: string | null }): Promise<OnboardingDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/complete`, body ?? {})),
  cancel: async (id: string, reason: string): Promise<OnboardingDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/cancel`, { reason })),
  changeStatus: async (
    id: string,
    body: { status: string; reason?: string | null; notes?: string | null },
  ): Promise<OnboardingDetail> => detail(await apiClient.post<unknown>(`${BASE}/${id}/status`, body)),

  // Tasks
  addTask: async (id: string, body: CreateOnboardingTaskRequest): Promise<OnboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks`, body)),
  updateTask: async (id: string, taskId: string, body: UpdateOnboardingTaskRequest): Promise<OnboardingTask> =>
    task(await apiClient.put<unknown>(`${BASE}/${id}/tasks/${taskId}`, body)),
  cancelTask: async (id: string, taskId: string): Promise<void> => {
    await apiClient.delete<unknown>(`${BASE}/${id}/tasks/${taskId}`);
  },
  completeTask: async (id: string, taskId: string, notes?: string): Promise<OnboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks/${taskId}/complete`, { notes: notes ?? null })),
  reopenTask: async (id: string, taskId: string): Promise<OnboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks/${taskId}/reopen`)),
  approveTask: async (id: string, taskId: string, notes?: string): Promise<OnboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks/${taskId}/approve`, { notes: notes ?? null })),
  rejectTask: async (id: string, taskId: string, reason: string): Promise<OnboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks/${taskId}/reject`, { reason })),

  // Documents
  updateDocument: async (
    id: string,
    documentId: string,
    body: { status: string; employeeDocumentId?: string | null },
  ): Promise<OnboardingDocument> =>
    unwrapPayload(await apiClient.put<unknown>(`${BASE}/${id}/documents/${documentId}`, body)) as OnboardingDocument,

  // Notification settings
  notificationSettings: async (): Promise<OnboardingNotificationSetting[]> =>
    normalizeListResponse<OnboardingNotificationSetting>(await apiClient.get<unknown>(`${BASE}/notification-settings`)).map(
      (s) => ({ ...s, recipients: arr<string>(s.recipients) }),
    ),
  updateNotificationSettings: async (
    settings: UpdateOnboardingNotificationSettingRequest[],
  ): Promise<OnboardingNotificationSetting[]> =>
    normalizeListResponse<OnboardingNotificationSetting>(
      await apiClient.put<unknown>(`${BASE}/notification-settings`, { settings }),
    ).map((s) => ({ ...s, recipients: arr<string>(s.recipients) })),
};

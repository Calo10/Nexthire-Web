import { apiClient } from '../../../lib/api';
import { buildQuery, type QueryParams } from '../../../lib/buildQuery';
import {
  normalizeListResponse,
  normalizePagedResult,
  unwrapPayload,
  type PagedResult,
} from '../../../lib/normalizeApiResponse';
import type {
  CreateOffboardingRequest,
  CreateOffboardingTaskRequest,
  CreateOffboardingAccessItemRequest,
  CreateOffboardingAssetRequest,
  OffboardingAccessItem,
  OffboardingActivity,
  OffboardingAsset,
  OffboardingDetail,
  OffboardingDocument,
  OffboardingExitInterview,
  OffboardingListItem,
  OffboardingListQuery,
  OffboardingNotificationSetting,
  OffboardingPipeline,
  OffboardingPipelineQuery,
  OffboardingSettlementItem,
  OffboardingSummary,
  OffboardingTask,
  StartOffboardingForEmployeeRequest,
  UpdateOffboardingAccessItemRequest,
  UpdateOffboardingAccessStatusRequest,
  UpdateOffboardingAssetRequest,
  UpdateOffboardingAssetStatusRequest,
  UpdateOffboardingExitInterviewRequest,
  UpdateOffboardingNotificationSettingRequest,
  UpdateOffboardingRequest,
  UpdateOffboardingSettlementItemRequest,
  UpdateOffboardingTaskRequest,
} from '../models/offboarding';

const BASE = '/offboardings';

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

function detail(raw: unknown): OffboardingDetail {
  const d = (unwrapPayload(raw) ?? {}) as OffboardingDetail;
  return {
    ...d,
    progressPercent: num(d.progressPercent),
    notifyEmployee: !!d.notifyEmployee,
    canComplete: !!d.canComplete,
    canSubmitClearance: !!d.canSubmitClearance,
    clearanceBlockers: arr<string>(d.clearanceBlockers),
    completionBlockers: arr<string>(d.completionBlockers),
    pendingAssets: num(d.pendingAssets),
    pendingAccessItems: num(d.pendingAccessItems),
    tasks: arr(d.tasks),
    assets: arr(d.assets),
    accessItems: arr(d.accessItems),
    settlementItems: arr(d.settlementItems),
    exitInterview: d.exitInterview ?? null,
    documents: arr(d.documents),
  };
}

function task(raw: unknown): OffboardingTask {
  return unwrapPayload(raw) as OffboardingTask;
}

function filterParams(q: OffboardingPipelineQuery): QueryParams {
  return {
    search: q.search?.trim(),
    departmentId: q.departmentId,
    ownerUserId: q.ownerUserId,
    templateId: q.templateId,
    separationType: q.separationType,
    lastWorkingFrom: q.lastWorkingFrom,
    lastWorkingTo: q.lastWorkingTo,
    overdueOnly: q.overdueOnly ? true : undefined,
  };
}

function summary(raw: unknown): OffboardingSummary {
  const r = (unwrapPayload(raw) ?? {}) as Record<string, unknown>;
  return {
    periodStart: String(r.periodStart ?? ''),
    periodEnd: String(r.periodEnd ?? ''),
    activeOffboardings: num(r.activeOffboardings),
    scheduled: num(r.scheduled),
    inProgress: num(r.inProgress),
    pendingClearance: num(r.pendingClearance),
    startedInPeriod: num(r.startedInPeriod),
    previousStartedInPeriod: num(r.previousStartedInPeriod),
    averageProgressPercent: num(r.averageProgressPercent),
    completedInPeriod: num(r.completedInPeriod),
    previousCompletedInPeriod: num(r.previousCompletedInPeriod),
    averageCompletionDays: num(r.averageCompletionDays),
    previousAverageCompletionDays: num(r.previousAverageCompletionDays),
    upcomingDepartures: num(r.upcomingDepartures),
    pendingAssetReturns: num(r.pendingAssetReturns),
    pendingAccessRevocations: num(r.pendingAccessRevocations),
    overdueTasks: num(r.overdueTasks),
    overdueOffboardings: num(r.overdueOffboardings),
    byStatus: dict(r.byStatus),
    byDepartment: dict(r.byDepartment),
    bySeparationType: dict(r.bySeparationType),
  };
}

function setting(s: OffboardingNotificationSetting): OffboardingNotificationSetting {
  return { ...s, recipients: arr<string>(s.recipients) };
}

function exitInterview(raw: unknown): OffboardingExitInterview {
  return unwrapPayload(raw) as OffboardingExitInterview;
}

export const offboardingsApi = {
  capabilities: async (): Promise<string[]> => {
    const raw = await apiClient.get<unknown>(`${BASE}/capabilities`);
    return normalizeListResponse<string>(raw).map(String);
  },

  list: async (query: OffboardingListQuery): Promise<PagedResult<OffboardingListItem>> => {
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
    return normalizePagedResult<OffboardingListItem>(raw);
  },

  pipeline: async (query: OffboardingPipelineQuery = {}): Promise<OffboardingPipeline> => {
    const raw = (unwrapPayload(await apiClient.get<unknown>(`${BASE}/pipeline${buildQuery(filterParams(query))}`)) ??
      {}) as Record<string, unknown>;
    const columns = arr<Record<string, unknown>>(raw.columns).map((c) => ({
      status: String(c.status ?? ''),
      label: String(c.label ?? ''),
      count: num(c.count),
      cards: arr<OffboardingPipeline['columns'][number]['cards'][number]>(c.cards).map((card) => ({
        ...card,
        progressPercent: num(card.progressPercent),
        overdueCount: num(card.overdueCount),
        pendingAssets: num(card.pendingAssets),
        pendingAccessItems: num(card.pendingAccessItems),
      })),
    }));
    return { columns };
  },

  summary: async (range?: { from?: string; to?: string }): Promise<OffboardingSummary> =>
    summary(await apiClient.get<unknown>(`${BASE}/summary${buildQuery({ from: range?.from, to: range?.to })}`)),

  get: async (id: string): Promise<OffboardingDetail> => detail(await apiClient.get<unknown>(`${BASE}/${id}`)),

  activity: async (id: string, take = 50): Promise<OffboardingActivity[]> =>
    normalizeListResponse<OffboardingActivity>(await apiClient.get<unknown>(`${BASE}/${id}/activity?take=${take}`)),

  documents: async (id: string): Promise<OffboardingDocument[]> =>
    normalizeListResponse<OffboardingDocument>(await apiClient.get<unknown>(`${BASE}/${id}/documents`)),

  create: async (body: CreateOffboardingRequest): Promise<OffboardingDetail> =>
    detail(await apiClient.post<unknown>(BASE, body)),

  /** Creates an offboarding for an existing employee (the employee id comes from the route). */
  startForEmployee: async (employeeId: string, body: StartOffboardingForEmployeeRequest): Promise<OffboardingDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/from-employee/${employeeId}`, body)),

  update: async (id: string, body: UpdateOffboardingRequest): Promise<OffboardingDetail> =>
    detail(await apiClient.put<unknown>(`${BASE}/${id}`, body)),

  // Status transitions
  start: async (id: string): Promise<OffboardingDetail> => detail(await apiClient.post<unknown>(`${BASE}/${id}/start`)),
  submitClearance: async (id: string): Promise<OffboardingDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/submit-clearance`)),
  complete: async (id: string, body?: { completionDate?: string | null; notes?: string | null }): Promise<OffboardingDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/complete`, body ?? {})),
  cancel: async (id: string, reason: string): Promise<OffboardingDetail> =>
    detail(await apiClient.post<unknown>(`${BASE}/${id}/cancel`, { reason })),
  changeStatus: async (
    id: string,
    body: { status: string; reason?: string | null; notes?: string | null },
  ): Promise<OffboardingDetail> => detail(await apiClient.post<unknown>(`${BASE}/${id}/status`, body)),

  // Tasks
  addTask: async (id: string, body: CreateOffboardingTaskRequest): Promise<OffboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks`, body)),
  updateTask: async (id: string, taskId: string, body: UpdateOffboardingTaskRequest): Promise<OffboardingTask> =>
    task(await apiClient.put<unknown>(`${BASE}/${id}/tasks/${taskId}`, body)),
  cancelTask: async (id: string, taskId: string): Promise<void> => {
    await apiClient.delete<unknown>(`${BASE}/${id}/tasks/${taskId}`);
  },
  completeTask: async (id: string, taskId: string, notes?: string): Promise<OffboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks/${taskId}/complete`, { notes: notes ?? null })),
  reopenTask: async (id: string, taskId: string): Promise<OffboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks/${taskId}/reopen`)),
  approveTask: async (id: string, taskId: string, notes?: string): Promise<OffboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks/${taskId}/approve`, { notes: notes ?? null })),
  rejectTask: async (id: string, taskId: string, reason: string): Promise<OffboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks/${taskId}/reject`, { reason })),

  // Waive a task (clearance sign-off; requires Offboarding.ApproveClearance).
  waiveTask: async (id: string, taskId: string, reason: string): Promise<OffboardingTask> =>
    task(await apiClient.post<unknown>(`${BASE}/${id}/tasks/${taskId}/waive`, { reason })),

  // Assets (read through the offboarding detail)
  addAsset: async (id: string, body: CreateOffboardingAssetRequest): Promise<OffboardingAsset> =>
    unwrapPayload(await apiClient.post<unknown>(`${BASE}/${id}/assets`, body)) as OffboardingAsset,
  updateAsset: async (id: string, assetId: string, body: UpdateOffboardingAssetRequest): Promise<OffboardingAsset> =>
    unwrapPayload(await apiClient.put<unknown>(`${BASE}/${id}/assets/${assetId}`, body)) as OffboardingAsset,
  updateAssetStatus: async (id: string, assetId: string, body: UpdateOffboardingAssetStatusRequest): Promise<OffboardingAsset> =>
    unwrapPayload(await apiClient.post<unknown>(`${BASE}/${id}/assets/${assetId}/status`, body)) as OffboardingAsset,
  removeAsset: async (id: string, assetId: string): Promise<void> => {
    await apiClient.delete<unknown>(`${BASE}/${id}/assets/${assetId}`);
  },

  // System access
  addAccess: async (id: string, body: CreateOffboardingAccessItemRequest): Promise<OffboardingAccessItem> =>
    unwrapPayload(await apiClient.post<unknown>(`${BASE}/${id}/access`, body)) as OffboardingAccessItem,
  updateAccess: async (id: string, itemId: string, body: UpdateOffboardingAccessItemRequest): Promise<OffboardingAccessItem> =>
    unwrapPayload(await apiClient.put<unknown>(`${BASE}/${id}/access/${itemId}`, body)) as OffboardingAccessItem,
  updateAccessStatus: async (id: string, itemId: string, body: UpdateOffboardingAccessStatusRequest): Promise<OffboardingAccessItem> =>
    unwrapPayload(await apiClient.post<unknown>(`${BASE}/${id}/access/${itemId}/status`, body)) as OffboardingAccessItem,
  removeAccess: async (id: string, itemId: string): Promise<void> => {
    await apiClient.delete<unknown>(`${BASE}/${id}/access/${itemId}`);
  },

  // Final settlement checklist
  updateSettlementItem: async (
    id: string,
    itemId: string,
    body: UpdateOffboardingSettlementItemRequest,
  ): Promise<OffboardingSettlementItem> =>
    unwrapPayload(await apiClient.put<unknown>(`${BASE}/${id}/settlement/${itemId}`, body)) as OffboardingSettlementItem,

  // Exit interview
  updateExitInterview: async (id: string, body: UpdateOffboardingExitInterviewRequest): Promise<OffboardingExitInterview> =>
    exitInterview(await apiClient.put<unknown>(`${BASE}/${id}/exit-interview`, body)),

  // Documents
  updateDocument: async (
    id: string,
    documentId: string,
    body: { status: string; employeeDocumentId?: string | null },
  ): Promise<OffboardingDocument> =>
    unwrapPayload(await apiClient.put<unknown>(`${BASE}/${id}/documents/${documentId}`, body)) as OffboardingDocument,

  // Notification settings
  notificationSettings: async (): Promise<OffboardingNotificationSetting[]> =>
    normalizeListResponse<OffboardingNotificationSetting>(await apiClient.get<unknown>(`${BASE}/notification-settings`)).map(setting),
  updateNotificationSettings: async (
    settings: UpdateOffboardingNotificationSettingRequest[],
  ): Promise<OffboardingNotificationSetting[]> =>
    normalizeListResponse<OffboardingNotificationSetting>(
      await apiClient.put<unknown>(`${BASE}/notification-settings`, { settings }),
    ).map(setting),
};

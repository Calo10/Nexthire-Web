import { apiClient, type ApiError } from '../lib/api';
import { buildQuery } from '../lib/buildQuery';
import type {
  ApplicationListItem,
  ApplicationNote,
  ApplicationStageHistoryItem,
  ApplicationsKanbanResponse,
  ApplicationsListResponse,
  CreateApplicationPayload,
  KanbanApplicationCard,
  KanbanColumn,
  KanbanStage,
  ListApplicationsParams,
} from '../types/applications';
import { coerceTaskStatus, type Task } from '../types/task';

/** Kanban/API payloads use different keys for the candidate phone. */
function pickCandidatePhone(a: Record<string, any> | null | undefined): string | null {
  if (!a || typeof a !== 'object') return null;
  const cand = a.candidate && typeof a.candidate === 'object' ? (a.candidate as Record<string, any>) : null;
  const raw =
    a.candidatePhone ??
    a.phoneNumber ??
    a.mobilePhone ??
    a.mobile ??
    a.phone ??
    cand?.phone ??
    cand?.phoneNumber ??
    cand?.mobile ??
    cand?.mobilePhone ??
    null;
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  return s || null;
}

function pickFitScore(a: Record<string, unknown> | null | undefined): number | null {
  if (!a || typeof a !== 'object') return null;
  const raw = a.fitScore ?? a.fit_score ?? null;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function mapKanbanApplicationCard(a: Record<string, unknown>, stageId: string): KanbanApplicationCard {
  const candidate = a.candidate && typeof a.candidate === 'object' ? (a.candidate as Record<string, unknown>) : null;
  const job = a.job && typeof a.job === 'object' ? (a.job as Record<string, unknown>) : null;
  return {
    id: String(a.id ?? a.applicationId ?? ''),
    candidateId: String(a.candidateId ?? ''),
    candidateName: String(a.candidateName ?? candidate?.name ?? candidate?.fullName ?? ''),
    candidateEmail: (a.candidateEmail ?? candidate?.email ?? null) as string | null,
    candidatePhone: pickCandidatePhone(a as Record<string, any>),
    jobId: (a.jobId ?? job?.id ?? '') as string | number,
    jobTitle: (a.jobTitle ?? job?.title ?? null) as string | null,
    stageId: String(a.currentStageId ?? a.stageId ?? stageId),
    status: (a.status ?? null) as string | null,
    createdAt: (a.createdAt ?? a.appliedAt ?? a.created_at ?? null) as string | null,
    fitScore: pickFitScore(a),
  };
}

function normalizeListResponse(result: unknown): ApplicationListItem[] {
  const rawItems: any[] = Array.isArray(result)
    ? (result as any[])
    : result && typeof result === 'object'
    ? (Array.isArray((result as any).items)
        ? ((result as any).items as any[])
        : Array.isArray((result as any).data)
        ? ((result as any).data as any[])
        : [])
    : [];

  // Normalize id field (some backends may return applicationId instead of id)
  return rawItems
    .filter(Boolean)
    .map((r) => ({
      id: String(r.id ?? r.applicationId ?? ''),
      candidateId: r.candidateId ?? null,
      jobId: r.jobId ?? null,
      candidateName: r.candidateName ?? null,
      jobTitle: r.jobTitle ?? null,
      createdAt: r.createdAt ?? null,
    }))
    .filter((x) => !!x.id);
}

function normalizeKanbanResponse(result: unknown): ApplicationsKanbanResponse {
  const empty: ApplicationsKanbanResponse = { stages: [], columns: [] };
  if (!result || typeof result !== 'object') return empty;
  const r: any = result;

  const stages: KanbanStage[] = Array.isArray(r.stages)
    ? r.stages
        .filter(Boolean)
        .map((s: any) => ({
          id: String(s.id ?? s.stageId ?? ''),
          name: String(s.name ?? s.title ?? s.stageName ?? ''),
          order: s.order ?? s.sortOrder,
        }))
        .filter((s: KanbanStage) => !!s.id && !!s.name)
    : [];

  const stageMap = new Map(stages.map((s) => [s.id, s.name]));

  // BE may return columns as:
  // - array: [{ stageId, stageName, items: [...] }]
  // - map/object: { [stageId]: [...] }
  const columns: KanbanColumn[] = (() => {
    if (Array.isArray(r.columns)) {
      return (r.columns as any[])
        .filter(Boolean)
        .map((c: any) => {
          const stageId = String(c.stageId ?? c.id ?? '');
          const stageName = String(c.stageName ?? c.name ?? c.title ?? stageMap.get(stageId) ?? '');
          const itemsRaw: any[] = Array.isArray(c.items) ? c.items : Array.isArray(c.cards) ? c.cards : [];
          const items: KanbanApplicationCard[] = itemsRaw
            .filter(Boolean)
            .map((a: any) => mapKanbanApplicationCard(a, stageId))
            .filter((x: KanbanApplicationCard) => !!x.id && !!x.stageId);
          return { stageId, stageName, items };
        })
        .filter((c: KanbanColumn) => !!c.stageId && !!c.stageName);
    }

    if (r.columns && typeof r.columns === 'object') {
      return Object.entries(r.columns as Record<string, unknown>)
        .map(([stageId, itemsValue]) => {
          const itemsRaw: any[] = Array.isArray(itemsValue) ? (itemsValue as any[]) : [];
          const stageName = stageMap.get(stageId) || '';
          const items: KanbanApplicationCard[] = itemsRaw
            .filter(Boolean)
            .map((a: any) => mapKanbanApplicationCard(a, stageId))
            .filter((x: KanbanApplicationCard) => !!x.id && !!x.stageId);
          return { stageId: String(stageId), stageName, items };
        })
        .filter((c) => !!c.stageId && !!c.stageName);
    }

    const columnsRaw: any[] = Array.isArray(r.items) ? (r.items as any[]) : [];
    return columnsRaw
      .filter(Boolean)
      .map((c: any) => {
        const stageId = String(c.stageId ?? c.id ?? '');
        const stageName = String(c.stageName ?? c.name ?? c.title ?? stageMap.get(stageId) ?? '');
        const itemsRaw: any[] = Array.isArray(c.items) ? c.items : Array.isArray(c.cards) ? c.cards : [];
        const items: KanbanApplicationCard[] = itemsRaw
          .filter(Boolean)
          .map((a: any) => mapKanbanApplicationCard(a, stageId))
          .filter((x: KanbanApplicationCard) => !!x.id && !!x.stageId);
        return { stageId, stageName, items };
      })
      .filter((c: KanbanColumn) => !!c.stageId && !!c.stageName);
  })();

  // If BE only returns stages, synthesize empty columns
  const existing = new Set(columns.map((c) => c.stageId));
  const filledColumns = [...columns];
  for (const s of stages) {
    if (!existing.has(s.id)) filledColumns.push({ stageId: s.id, stageName: s.name, items: [] });
  }

  // Sort by stage.order if provided
  const orderByStageId = new Map(stages.map((s) => [s.id, s.order ?? 9999]));
  filledColumns.sort((a, b) => (orderByStageId.get(a.stageId) ?? 9999) - (orderByStageId.get(b.stageId) ?? 9999));

  return { stages, columns: filledColumns };
}

function normalizeStageHistoryResponse(result: unknown): ApplicationStageHistoryItem[] {
  const rawItems: any[] = Array.isArray(result)
    ? (result as any[])
    : result && typeof result === 'object'
      ? (Array.isArray((result as any).items)
          ? ((result as any).items as any[])
          : Array.isArray((result as any).data)
            ? ((result as any).data as any[])
            : Array.isArray((result as any).history)
              ? ((result as any).history as any[])
              : Array.isArray((result as any).events)
                ? ((result as any).events as any[])
                : [])
      : [];

  return rawItems
    .map((e, idx) => {
      if (!e || typeof e !== 'object') return null;
      const at = String((e as any).movedAt ?? (e as any).createdAt ?? (e as any).at ?? (e as any).timestamp ?? '');
      const fromStageId = (e as any).fromStageId ?? (e as any).fromStage?.id ?? (e as any).from?.id ?? null;
      const toStageId = (e as any).toStageId ?? (e as any).toStage?.id ?? (e as any).to?.id ?? (e as any).stageId ?? null;
      const fromStageName = (e as any).fromStageName ?? (e as any).fromStage?.name ?? (e as any).from?.name ?? null;
      const toStageName =
        (e as any).toStageName ??
        (e as any).toStage?.name ??
        (e as any).to?.name ??
        (e as any).stageName ??
        (e as any).stage?.name ??
        null;
      const by =
        (e as any).movedByName ??
        (e as any).movedByEmail ??
        (e as any).movedBy?.name ??
        (e as any).byName ??
        (e as any).userName ??
        (e as any).by ??
        null;

      const id = String((e as any).id ?? (e as any).eventId ?? (e as any).applicationId ?? `${idx}`);
      if (!at) return null;
      return {
        id,
        at,
        fromStageId: fromStageId ? String(fromStageId) : null,
        toStageId: toStageId ? String(toStageId) : null,
        fromStageName: fromStageName ? String(fromStageName) : null,
        toStageName: toStageName ? String(toStageName) : null,
        by: by ? String(by) : null,
      } as ApplicationStageHistoryItem;
    })
    .filter(Boolean) as ApplicationStageHistoryItem[];
}

function normalizeNotesResponse(result: unknown): ApplicationNote[] {
  const rawItems: any[] = Array.isArray(result)
    ? (result as any[])
    : result && typeof result === 'object'
      ? (Array.isArray((result as any).items)
          ? ((result as any).items as any[])
          : Array.isArray((result as any).data)
            ? ((result as any).data as any[])
            : Array.isArray((result as any).notes)
              ? ((result as any).notes as any[])
              : [])
      : [];

  return rawItems
    .map((n, idx) => {
      if (!n || typeof n !== 'object') return null;
      const id = String((n as any).id ?? (n as any).noteId ?? `${idx}`);
      const applicationId = String((n as any).applicationId ?? '');
      const body = String((n as any).body ?? (n as any).text ?? '');
      const createdAt = String((n as any).createdAt ?? (n as any).created_at ?? '');
      if (!id || !applicationId || !createdAt) return null;
      return {
        id,
        applicationId,
        body,
        createdByUserId: (n as any).createdByUserId ? String((n as any).createdByUserId) : null,
        createdByName: (n as any).createdByName ? String((n as any).createdByName) : null,
        createdByEmail: (n as any).createdByEmail ? String((n as any).createdByEmail) : null,
        createdAt,
        updatedAt: (n as any).updatedAt ? String((n as any).updatedAt) : null,
      } as ApplicationNote;
    })
    .filter(Boolean) as ApplicationNote[];
}

function normalizeNote(result: unknown): ApplicationNote | null {
  if (!result || typeof result !== 'object') return null;
  const r: any = result;
  const id = String(r.id ?? r.noteId ?? '');
  const applicationId = String(r.applicationId ?? '');
  const body = String(r.body ?? r.text ?? '');
  const createdAt = String(r.createdAt ?? r.created_at ?? '');
  if (!id || !applicationId || !createdAt) return null;
  return {
    id,
    applicationId,
    body,
    createdByUserId: r.createdByUserId ? String(r.createdByUserId) : null,
    createdByName: r.createdByName ? String(r.createdByName) : null,
    createdByEmail: r.createdByEmail ? String(r.createdByEmail) : null,
    createdAt,
    updatedAt: r.updatedAt ? String(r.updatedAt) : null,
  };
}

export const applicationsApi = {
  list: async (params?: ListApplicationsParams): Promise<ApplicationListItem[]> => {
    const query = buildQuery({
      search: params?.search,
      page: params?.page,
      pageSize: params?.pageSize,
      jobId: params?.jobId,
      candidateId: params?.candidateId,
    });

    // Skip global unauthorized handler to allow local UI handling
    const result = await apiClient.get<ApplicationsListResponse | ApplicationListItem[]>(`/applications${query}`, true);
    return normalizeListResponse(result);
  },

  /**
   * GET /api/applications/kanban?jobId=...
   * Expected response example (shape may vary):
   * {
   *   "stages": [{ "id": "stage-1", "name": "Applied", "order": 1 }],
   *   "columns": [{ "stageId": "stage-1", "stageName": "Applied", "items": [{ "id": "...", "candidateName": "...", "jobTitle": "...", "createdAt": "..." }] }]
   * }
   */
  kanban: async (jobId: string): Promise<ApplicationsKanbanResponse> => {
    const query = buildQuery({ jobId });
    const result = await apiClient.get<unknown>(`/applications/kanban${query}`, true);
    return normalizeKanbanResponse(result);
  },

  /**
   * PATCH /api/applications/{id}/move
   * Payload: { "toStageId": "stage-2" }
   */
  move: async (applicationId: string, toStageId: string): Promise<void> => {
    await apiClient.patch<void>(`/applications/${encodeURIComponent(applicationId)}/move`, { toStageId }, true);
  },

  /**
   * POST /api/applications
   * Payload: { "candidateId": "...", "jobId": "..." }
   */
  create: async (payload: CreateApplicationPayload): Promise<KanbanApplicationCard> => {
    const result = await apiClient.post<any>('/applications', payload, true);
    // Best-effort normalize to a card
    return {
      id: String(result?.id ?? result?.applicationId ?? ''),
      candidateId: String(result?.candidateId ?? payload.candidateId),
      candidateName: String(result?.candidateName ?? ''),
      candidateEmail: result?.candidateEmail ?? result?.candidate?.email ?? null,
      candidatePhone: pickCandidatePhone(result),
      jobId: result?.jobId ?? payload.jobId,
      jobTitle: result?.jobTitle ?? null,
      stageId: String(result?.stageId ?? ''),
      status: result?.status ?? null,
      createdAt: result?.createdAt ?? null,
      fitScore: pickFitScore(result),
    };
  },

  /**
   * PUT /api/applications/{id}
   * Payload: { "status": "string" }
   */
  updateStatus: async (applicationId: string, status: string): Promise<void> => {
    await apiClient.put<void>(`/applications/${encodeURIComponent(applicationId)}`, { status }, true);
  },

  /**
   * GET /api/applications/{id}/stage-history?limit=50
   */
  stageHistory: async (applicationId: string, limit: number = 50): Promise<ApplicationStageHistoryItem[]> => {
    const query = buildQuery({ limit });
    const result = await apiClient.get<unknown>(`/applications/${encodeURIComponent(applicationId)}/stage-history${query}`, true);
    return normalizeStageHistoryResponse(result);
  },

  /**
   * GET /api/applications/{applicationId}/notes?limit=100
   */
  notes: async (applicationId: string, limit: number = 100): Promise<ApplicationNote[]> => {
    const query = buildQuery({ limit });
    const result = await apiClient.get<unknown>(`/applications/${encodeURIComponent(applicationId)}/notes${query}`, true);
    return normalizeNotesResponse(result);
  },

  /**
   * POST /api/applications/{applicationId}/notes
   * Payload: { "body": "string" }
   */
  createNote: async (applicationId: string, body: string): Promise<ApplicationNote> => {
    const result = await apiClient.post<unknown>(`/applications/${encodeURIComponent(applicationId)}/notes`, { body }, true);
    const note = normalizeNote(result);
    if (note) return note;
    // Some backends may return 204 or a wrapper; refetch will pick it up.
    return {
      id: `tmp-${Date.now()}`,
      applicationId,
      body,
      createdByUserId: null,
      createdByName: null,
      createdByEmail: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    };
  },

  /**
   * DELETE /api/notes/{id}
   */
  deleteNote: async (noteId: string): Promise<void> => {
    await apiClient.delete<void>(`/notes/${encodeURIComponent(noteId)}`, true);
  },

  /**
   * GET /api/applications/{applicationId}/tasks
   */
  tasks: async (applicationId: string): Promise<Task[]> => {
    const result = await apiClient.get<unknown>(`/applications/${encodeURIComponent(applicationId)}/tasks`, true);
    const rawItems: any[] = Array.isArray(result)
      ? (result as any[])
      : result && typeof result === 'object'
        ? (Array.isArray((result as any).items)
            ? ((result as any).items as any[])
            : Array.isArray((result as any).data)
              ? ((result as any).data as any[])
              : [])
        : [];

    return rawItems
      .filter(Boolean)
      .map((t: any) => ({
        ...t,
        id: String(t?.id ?? ''),
        title: String(t?.title ?? ''),
        status: coerceTaskStatus(t?.status),
        dueAt: t?.dueAt ?? null,
        applicationId: String(t?.applicationId ?? applicationId),
        jobId: t?.jobId ?? '',
        candidateId: String(t?.candidateId ?? ''),
        assignedToUserId: t?.assignedToUserId ?? null,
        jobTitle: t?.jobTitle ?? null,
        candidateName: t?.candidateName ?? null,
        assignedToName: t?.assignedToName ?? null,
        createdAt: String(t?.createdAt ?? new Date().toISOString()),
        completedAt: t?.completedAt ?? null,
      }))
      .filter((x: Task) => !!x.id);
  },

  /**
   * GET /api/applications/{id}/resume-url
   * Response can be a string URL or an object like { url: "..." }.
   */
  resumeUrl: async (applicationId: string): Promise<string | null> => {
    const result = await apiClient.get<unknown>(`/applications/${encodeURIComponent(applicationId)}/resume-url`, true);
    if (!result) return null;
    if (typeof result === 'string') return result.trim() || null;
    if (typeof result === 'object') {
      const r: any = result;
      const url = r.url ?? r.resumeUrl ?? r.resume_url ?? r.link;
      return url ? String(url).trim() || null : null;
    }
    return null;
  },

  /**
   * POST /api/applications/{id}/analyze-resume
   */
  analyzeResume: async (applicationId: string): Promise<unknown> => {
    return apiClient.post<unknown>(`/applications/${encodeURIComponent(applicationId)}/analyze-resume`, {}, true);
  },
};

export function isUnauthorized(err: unknown): err is ApiError & { status: 401 } {
  return !!err && typeof err === 'object' && 'status' in err && (err as any).status === 401;
}


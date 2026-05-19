import type { ApiError } from '../lib/api';
import { apiClient } from '../lib/api';
import { buildQuery } from '../lib/buildQuery';
import type { CreateTemplatePayload, ListTemplatesParams, Template, TemplateChannel, UpdateTemplatePayload } from '../types/templates';

function normalizeTemplate(raw: any): Template | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? raw.templateId ?? '');
  const channelRaw = String(raw.channel ?? '').toLowerCase();
  const channel: TemplateChannel = channelRaw === 'whatsapp' ? 'whatsapp' : 'email';
  const name = String(raw.name ?? raw.title ?? '');
  const body = String(raw.body ?? raw.content ?? '');
  if (!id || !name) return null;
  return {
    id,
    name,
    channel,
    subject: raw.subject ?? null,
    body,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
  };
}

function normalizeListResponse(result: unknown): Template[] {
  const rawItems: any[] = Array.isArray(result)
    ? (result as any[])
    : result && typeof result === 'object'
      ? Array.isArray((result as any).items)
        ? ((result as any).items as any[])
        : Array.isArray((result as any).data)
          ? ((result as any).data as any[])
          : []
      : [];
  return rawItems.map(normalizeTemplate).filter(Boolean) as Template[];
}

export const templatesApi = {
  list: async (params: ListTemplatesParams): Promise<Template[]> => {
    const query = buildQuery({ channel: params.channel });
    const result = await apiClient.get<unknown>(`/templates${query}`, true);
    return normalizeListResponse(result);
  },

  getById: async (id: string): Promise<Template> => {
    const result = await apiClient.get<unknown>(`/templates/${encodeURIComponent(id)}`, true);
    const t = normalizeTemplate(result);
    if (!t) {
      const err: ApiError = { message: 'Invalid template response' };
      throw err;
    }
    return t;
  },

  create: async (payload: CreateTemplatePayload): Promise<Template> => {
    const result = await apiClient.post<unknown>(
      `/templates`,
      {
        name: payload.name,
        channel: payload.channel,
        subject: payload.subject ?? null,
        body: payload.body ?? '',
      },
      true
    );
    const t = normalizeTemplate(result);
    if (t) return t;
    // If BE returns 204 or different shape, refetch list will pick it up.
    const err: ApiError = { message: 'Template created but could not be read' };
    throw err;
  },

  update: async (id: string, payload: UpdateTemplatePayload): Promise<Template> => {
    const result = await apiClient.put<unknown>(
      `/templates/${encodeURIComponent(id)}`,
      {
        ...payload,
      },
      true
    );
    const t = normalizeTemplate(result);
    if (!t) {
      const err: ApiError = { message: 'Invalid template response' };
      throw err;
    }
    return t;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/templates/${encodeURIComponent(id)}`, true);
  },
};


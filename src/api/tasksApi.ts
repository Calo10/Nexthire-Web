import { apiClient } from '../lib/api';
import type { CreateTaskPayload, GetTasksParams, Task, TasksListResponse, UpdateTaskPayload } from '../types/tasks';

function buildQuery(params?: GetTasksParams): string {
  const qp = new URLSearchParams();
  if (params?.from) qp.set('from', params.from);
  if (params?.to) qp.set('to', params.to);
  if (params?.status) qp.set('status', params.status);
  if (params?.q) qp.set('q', params.q);
  const query = qp.toString();
  return query ? `?${query}` : '';
}

export const tasksApi = {
  list: async (params?: GetTasksParams): Promise<TasksListResponse> => {
    return apiClient.get(`/tasks${buildQuery(params)}`, true);
  },

  create: async (payload: CreateTaskPayload): Promise<Task> => {
    return apiClient.post('/tasks', payload, true);
  },

  getById: async (id: string): Promise<Task> => {
    return apiClient.get(`/tasks/${encodeURIComponent(id)}`, true);
  },

  update: async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
    return apiClient.patch(`/tasks/${encodeURIComponent(id)}`, payload, true);
  },

  markDone: async (id: string): Promise<Task> => {
    return apiClient.patch(`/tasks/${encodeURIComponent(id)}`, { status: 'Done' }, true);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${encodeURIComponent(id)}`, true);
  },
};


import { apiClient, type ApiError } from '../lib/api';
import { coerceTaskStatus, type CreateTaskPayload, type Task, type TaskStatus } from '../types/task';

export async function listTasks(): Promise<Task[]> {
  // We handle 401 locally to show toast + redirect.
  // So we skip the global unauthorized handler.
  const result = await apiClient.get<Task[]>('/tasks', true);
  if (!Array.isArray(result)) return [];
  // Normalize to avoid UI crashes if BE returns legacy/unknown statuses.
  return result.map((t: any) => ({
    ...t,
    status: coerceTaskStatus(t?.status),
    dueAt: t?.dueAt ?? null,
    completedAt: t?.completedAt ?? null,
  })) as Task[];
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return apiClient.post<Task>('/tasks', payload, true);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
  return apiClient.patch<Task>(`/tasks/${encodeURIComponent(taskId)}/status`, { status }, true);
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiClient.delete<void>(`/tasks/${encodeURIComponent(taskId)}`, true);
}

export function isUnauthorized(err: unknown): err is ApiError {
  return !!err && typeof err === 'object' && 'status' in err && (err as any).status === 401;
}


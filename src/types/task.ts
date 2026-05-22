export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';

export function coerceTaskStatus(value: unknown): TaskStatus {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'todo') return 'todo';
  if (raw === 'in_progress' || raw === 'in progress' || raw === 'in-progress') return 'in_progress';
  if (raw === 'blocked') return 'blocked';
  if (raw === 'done') return 'done';

  // Legacy/alias values
  if (raw === 'open') return 'todo';
  if (raw === 'completed') return 'done';

  // Safe fallback
  return 'todo';
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueAt: string | null;
  applicationId: string;
  jobId: string | number;
  candidateId: string;
  assignedToUserId: string | null;
  jobTitle?: string | null;
  candidateName?: string | null;
  assignedToName?: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateTaskPayload {
  title: string;
  applicationId: string;
  status?: TaskStatus; // default todo
  dueAt?: string | null;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export interface GetTasksParams {
  from?: string;
  to?: string;
  status?: TaskStatus | string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface TasksListResponse {
  items: Task[];
  page?: number;
  pageSize?: number;
  total?: number;
}

export const TASK_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done'];


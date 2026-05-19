export type TaskStatus = 'Open' | 'In Progress' | 'Done' | 'Overdue' | string;

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueAt?: string | null;
  notes?: string | null;

  candidateId?: string | null;
  candidateName?: string | null;

  jobId?: string | number | null;
  jobTitle?: string | null;

  assignedToId?: string | null;
  assignedToName?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface TasksListResponse {
  items: Task[];
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface GetTasksParams {
  from?: string;
  to?: string;
  status?: string;
  q?: string;
}

export interface CreateTaskPayload {
  title: string;
  candidateId?: string | null;
  jobId?: string | number | null;
  dueAt?: string | null;
  assignedToId?: string | null;
  status?: TaskStatus;
  notes?: string | null;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;


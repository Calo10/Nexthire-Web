import { apiClient } from '../lib/api';
import type { CreateTaskPayload, GetTasksParams, Task, TasksListResponse, UpdateTaskPayload } from '../types/task';

export interface TasksApi {
  list(params?: GetTasksParams): Promise<TasksListResponse>;
  create(payload: CreateTaskPayload): Promise<Task>;
  getById(id: string): Promise<Task>;
  update(id: string, payload: UpdateTaskPayload): Promise<Task>;
  updateStatus(id: string, status: Task['status']): Promise<Task>;
  delete(id: string): Promise<void>;
}

function buildQuery(params?: GetTasksParams): string {
  const qp = new URLSearchParams();
  if (params?.from) qp.set('from', params.from);
  if (params?.to) qp.set('to', params.to);
  if (params?.status) qp.set('status', params.status);
  if (params?.q) qp.set('q', params.q);
  if (params?.page) qp.set('page', String(params.page));
  if (params?.pageSize) qp.set('pageSize', String(params.pageSize));
  const query = qp.toString();
  return query ? `?${query}` : '';
}

const realTasksApi: TasksApi = {
  list: async (params) => {
    return apiClient.get(`/tasks${buildQuery(params)}`, true);
  },
  create: async (payload) => {
    return apiClient.post('/tasks', payload, true);
  },
  getById: async (id) => {
    return apiClient.get(`/tasks/${encodeURIComponent(id)}`, true);
  },
  update: async (id, payload) => {
    return apiClient.patch(`/tasks/${encodeURIComponent(id)}`, payload, true);
  },
  updateStatus: async (id, status) => {
    return apiClient.patch(`/tasks/${encodeURIComponent(id)}`, { status }, true);
  },
  delete: async (id) => {
    await apiClient.delete(`/tasks/${encodeURIComponent(id)}`, true);
  },
};

// Mock adapter (same interface) toggled via VITE_USE_MOCK_TASKS=true
const MOCK_FLAG = (import.meta as any).env?.VITE_USE_MOCK_TASKS === 'true';

let mockTasks: Task[] = [
  {
    id: 'mock-1',
    title: 'Schedule interview',
    status: 'To do',
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    candidateName: 'Ana Lopez',
    jobTitle: 'Frontend Engineer',
    assignedToName: 'Carlos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    title: 'Review resume',
    status: 'In progress',
    dueAt: new Date().toISOString(),
    candidateName: 'Juan Perez',
    jobTitle: 'Backend Engineer',
    assignedToName: 'Carlos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    title: 'Send offer',
    status: 'Waiting',
    dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
    candidateName: 'Sofia Castro',
    jobTitle: 'Product Designer',
    assignedToName: 'Carlos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-4',
    title: 'Finalize onboarding',
    status: 'Done',
    dueAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    candidateName: 'Diego Fernandez',
    jobTitle: 'QA Engineer',
    assignedToName: 'Carlos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockTasksApi: TasksApi = {
  list: async (params) => {
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 25;
    const q = (params?.q || '').toLowerCase();
    const status = params?.status;
    const from = params?.from ? new Date(params.from) : null;
    const to = params?.to ? new Date(params.to) : null;

    let filtered = [...mockTasks];
    if (q) filtered = filtered.filter((t) => t.title.toLowerCase().includes(q));
    if (status) filtered = filtered.filter((t) => String(t.status) === String(status));
    if (from) filtered = filtered.filter((t) => (t.dueAt ? new Date(t.dueAt) >= from : true));
    if (to) filtered = filtered.filter((t) => (t.dueAt ? new Date(t.dueAt) <= to : true));

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return { items, page, pageSize, total };
  },
  create: async (payload) => {
    const now = new Date().toISOString();
    const t: Task = {
      id: `mock-${Math.random().toString(16).slice(2)}`,
      title: payload.title,
      status: payload.status || 'To do',
      dueAt: payload.dueAt || null,
      candidateId: payload.candidateId ?? null,
      jobId: payload.jobId ?? null,
      assignedToUserId: payload.assignedToUserId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    mockTasks = [t, ...mockTasks];
    return t;
  },
  getById: async (id) => {
    const t = mockTasks.find((x) => x.id === id);
    if (!t) throw { message: 'Task not found', status: 404 };
    return t;
  },
  update: async (id, payload) => {
    const idx = mockTasks.findIndex((x) => x.id === id);
    if (idx === -1) throw { message: 'Task not found', status: 404 };
    const updated = { ...mockTasks[idx], ...payload, updatedAt: new Date().toISOString() } as Task;
    mockTasks = mockTasks.map((x) => (x.id === id ? updated : x));
    return updated;
  },
  updateStatus: async (id, status) => {
    return mockTasksApi.update(id, { status });
  },
  delete: async (id) => {
    mockTasks = mockTasks.filter((x) => x.id !== id);
  },
};

export const tasksApi: TasksApi = MOCK_FLAG ? mockTasksApi : realTasksApi;


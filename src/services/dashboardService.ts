import { apiClient } from '../lib/api';
import { buildQuery, type QueryParams } from '../lib/buildQuery';
import type {
  ActivityTrend,
  ApplicationsByStage,
  Candidate,
  DashboardSummary,
  Job,
  RecentActivity,
  Task,
} from '../types/dashboard';

export interface DashboardParams {
  from: string;
  to: string;
  jobId?: string;
}

function toQueryParams(params: DashboardParams): QueryParams {
  return params as unknown as QueryParams;
}

function normalizeArrayResponse<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === 'object') {
    const r: any = result;
    if (Array.isArray(r.items)) return r.items as T[];
    if (Array.isArray(r.data)) return r.data as T[];
    if (Array.isArray(r.jobs)) return r.jobs as T[];
    if (Array.isArray(r.results)) return r.results as T[];
    if (r.data && typeof r.data === 'object') {
      if (Array.isArray((r.data as any).items)) return (r.data as any).items as T[];
      if (Array.isArray((r.data as any).data)) return (r.data as any).data as T[];
    }
  }
  return [];
}

export const dashboardService = {
  getSummary: async (params: DashboardParams): Promise<DashboardSummary> => {
    return apiClient.get(`/dashboard/summary${buildQuery(toQueryParams(params))}`, true);
  },
  getRecentActivity: async (params: DashboardParams): Promise<RecentActivity[]> => {
    return apiClient.get(`/dashboard/recent-activity${buildQuery(toQueryParams(params))}`, true);
  },
  getCandidates: async (params: DashboardParams): Promise<Candidate[]> => {
    return apiClient.get(`/dashboard/recent-candidates${buildQuery(toQueryParams(params))}`, true);
  },
  getApplicationsByStage: async (params: DashboardParams): Promise<ApplicationsByStage[]> => {
    return apiClient.get(`/dashboard/applications-by-stage${buildQuery(toQueryParams(params))}`, true);
  },
  getActivityTrend: async (params: DashboardParams): Promise<ActivityTrend[]> => {
    return apiClient.get(`/dashboard/activity-trend${buildQuery(toQueryParams(params))}`, true);
  },
  getMyJobs: async (params: DashboardParams): Promise<Job[]> => {
    const result = await apiClient.get<unknown>(`/dashboard/my-jobs${buildQuery(toQueryParams(params))}`, true);
    if (import.meta.env.DEV) {
      console.log('[dashboardService.getMyJobs] raw result:', result);
    }
    return normalizeArrayResponse<Job>(result);
  },
  getUpcomingTasks: async (params: DashboardParams): Promise<Task[]> => {
    return apiClient.get(`/dashboard/upcoming-tasks${buildQuery(toQueryParams(params))}`, true);
  },
  getJobs: async (): Promise<Job[]> => {
    return apiClient.get('/jobs', true);
  },
};


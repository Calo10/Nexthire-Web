import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { Task } from '../types/dashboard';
import type { ApiError } from '../lib/api';

interface UseUpcomingTasksParams {
  from: string;
  to: string;
  jobId?: string;
}

interface UseUpcomingTasksReturn {
  data: Task[];
  isLoading: boolean;
  error: ApiError | null;
}

export function useUpcomingTasks(params?: UseUpcomingTasksParams): UseUpcomingTasksReturn {
  const [data, setData] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    // Don't fetch if params is undefined (auth not ready)
    if (params === undefined) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await dashboardService.getUpcomingTasks(params);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as ApiError);
          setData([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [params?.from, params?.to, params?.jobId]);

  return { data, isLoading, error };
}

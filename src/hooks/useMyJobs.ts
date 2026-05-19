import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { Job } from '../types/dashboard';
import type { ApiError } from '../lib/api';

interface UseMyJobsParams {
  from: string;
  to: string;
  jobId?: string;
}

interface UseMyJobsReturn {
  data: Job[];
  isLoading: boolean;
  error: ApiError | null;
}

export function useMyJobs(params?: UseMyJobsParams): UseMyJobsReturn {
  const [data, setData] = useState<Job[]>([]);
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
        const result = await dashboardService.getMyJobs(params);
        if (!cancelled) {
          if (import.meta.env.DEV) {
            console.log('[useMyJobs] normalized jobs length:', Array.isArray(result) ? result.length : null, result);
          }
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

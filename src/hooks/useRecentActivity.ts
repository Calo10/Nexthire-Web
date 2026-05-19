import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { RecentActivity } from '../types/dashboard';
import type { ApiError } from '../lib/api';

interface UseRecentActivityParams {
  from: string;
  to: string;
  jobId?: string;
}

interface UseRecentActivityReturn {
  data: RecentActivity[];
  isLoading: boolean;
  error: ApiError | null;
}

export function useRecentActivity(params?: UseRecentActivityParams): UseRecentActivityReturn {
  const [data, setData] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    // Don't fetch if params is undefined (auth not ready)
    if (params === undefined) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchActivity = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await dashboardService.getRecentActivity(params);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as ApiError);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchActivity();

    return () => {
      cancelled = true;
    };
  }, [params?.from, params?.to, params?.jobId]);

  return { data, isLoading, error };
}


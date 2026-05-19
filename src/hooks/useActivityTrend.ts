import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { ActivityTrend } from '../types/dashboard';
import type { ApiError } from '../lib/api';

interface UseActivityTrendParams {
  from: string;
  to: string;
  jobId?: string;
}

interface UseActivityTrendReturn {
  data: ActivityTrend[];
  isLoading: boolean;
  error: ApiError | null;
}

export function useActivityTrend(params?: UseActivityTrendParams): UseActivityTrendReturn {
  const [data, setData] = useState<ActivityTrend[]>([]);
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
        const result = await dashboardService.getActivityTrend(params);
        if (import.meta.env.DEV) {
          console.log('[useActivityTrend] API result:', result);
        }
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

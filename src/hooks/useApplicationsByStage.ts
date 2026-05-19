import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { ApplicationsByStage } from '../types/dashboard';
import type { ApiError } from '../lib/api';

interface UseApplicationsByStageParams {
  from: string;
  to: string;
  jobId?: string;
}

interface UseApplicationsByStageReturn {
  data: ApplicationsByStage[];
  isLoading: boolean;
  error: ApiError | null;
}

export function useApplicationsByStage(params?: UseApplicationsByStageParams): UseApplicationsByStageReturn {
  const [data, setData] = useState<ApplicationsByStage[]>([]);
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
        const result = await dashboardService.getApplicationsByStage(params);
        if (import.meta.env.DEV) {
          console.log('[useApplicationsByStage] API result:', result);
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

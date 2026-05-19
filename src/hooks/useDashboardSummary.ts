import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { DashboardSummary } from '../types/dashboard';
import type { ApiError } from '../lib/api';

interface UseDashboardSummaryParams {
  from: string;
  to: string;
  jobId?: string;
}

interface UseDashboardSummaryReturn {
  data: DashboardSummary | null;
  isLoading: boolean;
  error: ApiError | null;
}

export function useDashboardSummary(params?: UseDashboardSummaryParams): UseDashboardSummaryReturn {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    // Don't fetch if params is undefined (auth not ready)
    if (params === undefined) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await dashboardService.getSummary(params);
        if (import.meta.env.DEV) {
          console.log('[useDashboardSummary] API result:', result);
        }
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as ApiError);
          // Set data to null on error to prevent stale data
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      cancelled = true;
    };
  }, [params?.from, params?.to, params?.jobId]);

  return { data, isLoading, error };
}


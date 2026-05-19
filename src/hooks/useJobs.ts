import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { Job } from '../types/dashboard';
import type { ApiError } from '../lib/api';

interface UseJobsReturn {
  data: Job[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useJobs(shouldFetch?: boolean): UseJobsReturn {
  const [data, setData] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => {
    setRefreshIndex((i) => i + 1);
  }, []);

  useEffect(() => {
    // Don't fetch if shouldFetch is false or undefined (auth not ready)
    if (shouldFetch === false || shouldFetch === undefined) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await dashboardService.getJobs();
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
  }, [shouldFetch, refreshIndex]);

  return { data, isLoading, error, refetch };
}

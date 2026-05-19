import { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { Candidate } from '../types/dashboard';
import type { ApiError } from '../lib/api';

interface UseCandidatesParams {
  from: string;
  to: string;
  jobId?: string;
}

interface UseCandidatesReturn {
  data: Candidate[];
  isLoading: boolean;
  error: ApiError | null;
}

export function useCandidates(params?: UseCandidatesParams): UseCandidatesReturn {
  const [data, setData] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    // Don't fetch if params is undefined (auth not ready)
    if (params === undefined) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchCandidates = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await dashboardService.getCandidates(params);
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

    fetchCandidates();

    return () => {
      cancelled = true;
    };
  }, [params?.from, params?.to, params?.jobId]);

  return { data, isLoading, error };
}


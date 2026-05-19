import { useCallback, useEffect, useState } from 'react';
import type { ApiError } from '../lib/api';
import { candidatesApi } from '../api/candidatesApi';
import type { Candidate } from '../types/candidates';

interface UseCandidateReturn {
  data: Candidate | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useCandidate(shouldFetch: boolean, candidateId: string | null): UseCandidateReturn {
  const [data, setData] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => setRefreshIndex((i) => i + 1), []);

  useEffect(() => {
    if (!shouldFetch || !candidateId) return;

    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await candidatesApi.getById(candidateId);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e as ApiError);
          setData(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [shouldFetch, candidateId, refreshIndex]);

  return { data, isLoading, error, refetch };
}


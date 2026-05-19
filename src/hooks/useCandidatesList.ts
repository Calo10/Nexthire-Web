import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApiError } from '../lib/api';
import { candidatesApi } from '../api/candidatesApi';
import type { Candidate, GetCandidatesParams } from '../types/candidates';

interface UseCandidatesListReturn {
  data: Candidate[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

function normalizeListResponse(result: any): Candidate[] {
  if (Array.isArray(result)) return result as Candidate[];
  if (result && typeof result === 'object') {
    if (Array.isArray(result.items)) return result.items as Candidate[];
    // Backward/alternate shape
    if (Array.isArray(result.data)) return result.data as Candidate[];
  }
  return [];
}

export function useCandidatesList(shouldFetch: boolean, params: GetCandidatesParams): UseCandidatesListReturn {
  const [data, setData] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const stableParams = useMemo(() => params, [params.search, params.source, params.from, params.to, params.page, params.pageSize]);

  const refetch = useCallback(() => {
    setRefreshIndex((i) => i + 1);
  }, []);

  useEffect(() => {
    if (!shouldFetch) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await candidatesApi.list(stableParams);
        if (!cancelled) setData(normalizeListResponse(result));
      } catch (e) {
        if (!cancelled) {
          setError(e as ApiError);
          setData([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [shouldFetch, stableParams, refreshIndex]);

  return { data, isLoading, error, refetch };
}


import { useState, useEffect, useCallback } from 'react';
import { rolesApi } from '../api/rolesApi';
import type { Role } from '../types/teams';
import type { ApiError } from '../lib/api';

interface UseRolesReturn {
  data: Role[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useRoles(shouldFetch?: boolean): UseRolesReturn {
  const [data, setData] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => {
    setRefreshIndex((i) => i + 1);
  }, []);

  useEffect(() => {
    if (shouldFetch === false || shouldFetch === undefined) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await rolesApi.getRoles();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(err as ApiError);
          setData([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [shouldFetch, refreshIndex]);

  return { data, isLoading, error, refetch };
}

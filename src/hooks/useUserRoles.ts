import { useState, useEffect, useCallback } from 'react';
import { rolesApi } from '../api/rolesApi';
import type { UserRoleAssignment } from '../types/teams';
import type { ApiError } from '../lib/api';

interface UseUserRolesReturn {
  data: UserRoleAssignment[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useUserRoles(userId: string | null, shouldFetch?: boolean): UseUserRolesReturn {
  const [data, setData] = useState<UserRoleAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => {
    setRefreshIndex((i) => i + 1);
  }, []);

  useEffect(() => {
    if (!userId || shouldFetch === false || shouldFetch === undefined) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await rolesApi.getUserRoles(userId);
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
  }, [userId, shouldFetch, refreshIndex]);

  return { data, isLoading, error, refetch };
}

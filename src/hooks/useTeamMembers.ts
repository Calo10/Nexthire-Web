import { useState, useEffect, useCallback } from 'react';
import { teamsApi } from '../api/teamsApi';
import type { TeamMember } from '../types/teams';
import type { ApiError } from '../lib/api';

interface UseTeamMembersReturn {
  data: TeamMember[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useTeamMembers(teamId: string | null, shouldFetch?: boolean): UseTeamMembersReturn {
  const [data, setData] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => {
    setRefreshIndex((i) => i + 1);
  }, []);

  useEffect(() => {
    if (!teamId || shouldFetch === false || shouldFetch === undefined) {
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
        const result = await teamsApi.getTeamMembers(teamId);
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
  }, [teamId, shouldFetch, refreshIndex]);

  return { data, isLoading, error, refetch };
}

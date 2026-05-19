import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApiError } from '../lib/api';
import { tasksApi } from '../services/tasksApi';
import type { GetTasksParams, Task, TasksListResponse } from '../types/task';

interface UseTasksListReturn {
  data: Task[];
  meta: { page: number; pageSize: number; total: number };
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useTasksList(shouldFetch: boolean, params: GetTasksParams): UseTasksListReturn {
  const [data, setData] = useState<Task[]>([]);
  const [meta, setMeta] = useState<{ page: number; pageSize: number; total: number }>({ page: 1, pageSize: 25, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const stableParams = useMemo(
    () => params,
    [params.from, params.to, params.status, params.q]
  );

  const refetch = useCallback(() => setRefreshIndex((i) => i + 1), []);

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
        const result = (await tasksApi.list(stableParams)) as TasksListResponse;
        const items = Array.isArray((result as any)?.items) ? (result as any).items : [];
        if (!cancelled) {
          setData(items);
          setMeta({
            page: Number((result as any)?.page ?? stableParams.page ?? 1),
            pageSize: Number((result as any)?.pageSize ?? stableParams.pageSize ?? 25),
            total: Number((result as any)?.total ?? items.length),
          });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e as ApiError);
          setData([]);
          setMeta({ page: stableParams.page ?? 1, pageSize: stableParams.pageSize ?? 25, total: 0 });
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

  return { data, meta, isLoading, error, refetch };
}


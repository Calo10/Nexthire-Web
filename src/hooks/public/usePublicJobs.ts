import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PublicApiError } from '../../api/publicApiClient';
import { publicJobsApi } from '../../api/publicJobsApi';
import type { JobPublicDTO, ListPublicJobsParams } from '../../types/publicJobs';

type CacheKey = string;
type CacheEntry = { at: number; data: JobPublicDTO[] };

const cache = new Map<CacheKey, CacheEntry>();

function key(orgSlug: string, params: ListPublicJobsParams): CacheKey {
  return `${orgSlug}::${JSON.stringify(params)}`;
}

export function usePublicJobs(orgSlug: string | null, params: ListPublicJobsParams) {
  const [data, setData] = useState<JobPublicDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PublicApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const stableParams = useMemo(
    () => params,
    [params.status, params.search, params.query, params.location, params.department, params.type, params.page, params.pageSize]
  );

  const refetch = useCallback(() => setRefreshIndex((i) => i + 1), []);

  useEffect(() => {
    if (!orgSlug) return;
    const cacheKey = key(orgSlug, stableParams);
    const cached = cache.get(cacheKey);
    if (cached) setData(cached.data);

    let cancelled = false;
    const run = async () => {
      setIsLoading(!cached);
      setError(null);
      try {
        const res = await publicJobsApi.list(orgSlug, stableParams);
        if (cancelled) return;
        cache.set(cacheKey, { at: Date.now(), data: res });
        setData(res);
      } catch (e) {
        if (cancelled) return;
        setError(e as PublicApiError);
        setData(cached?.data || []);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [orgSlug, stableParams, refreshIndex]);

  return { data, isLoading, error, refetch };
}


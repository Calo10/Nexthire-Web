import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PublicApiError } from '../../api/publicApiClient';
import { publicJobsApi } from '../../api/publicJobsApi';
import type { JobPublicDTO } from '../../types/publicJobs';

type CacheKey = string;
type CacheEntry = { at: number; data: JobPublicDTO };

const cache = new Map<CacheKey, CacheEntry>();

function key(orgSlug: string, jobId: string): CacheKey {
  return `${orgSlug}::${jobId}`;
}

export function usePublicJob(orgSlug: string | null, jobId: string | null) {
  const [data, setData] = useState<JobPublicDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PublicApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const stableOrg = useMemo(() => orgSlug, [orgSlug]);
  const stableId = useMemo(() => jobId, [jobId]);
  const refetch = useCallback(() => setRefreshIndex((i) => i + 1), []);

  useEffect(() => {
    if (!stableOrg || !stableId) return;
    const cacheKey = key(stableOrg, stableId);
    const cached = cache.get(cacheKey);
    if (cached) setData(cached.data);

    let cancelled = false;
    const run = async () => {
      setIsLoading(!cached);
      setError(null);
      try {
        const res = await publicJobsApi.getById(stableOrg, stableId);
        if (cancelled) return;
        cache.set(cacheKey, { at: Date.now(), data: res });
        setData(res);
      } catch (e) {
        if (cancelled) return;
        setError(e as PublicApiError);
        setData(cached?.data || null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [stableOrg, stableId, refreshIndex]);

  return { data, isLoading, error, refetch, setData };
}


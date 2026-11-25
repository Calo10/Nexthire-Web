import { useCallback, useEffect, useRef, useState } from 'react';
import { apiErrorMessage } from '../utils/employeeFormat';

export type OrgResource<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

/**
 * Small fetch helper for the organization workspace: stale-response safe, refetches when
 * `enabled` flips on or `reloadKey` changes, and keeps previous data visible while reloading.
 */
export function useOrgResource<T>(
  fetcher: () => Promise<T>,
  enabled: boolean,
  reloadKey: number,
  fallbackError: string,
): OrgResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const reqId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((res) => {
        if (id === reqId.current) setData(res);
      })
      .catch((err: unknown) => {
        if (id === reqId.current) setError(apiErrorMessage(err, fallbackError));
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [enabled, reloadKey, retry, fallbackError]);

  const reload = useCallback(() => setRetry((r) => r + 1), []);
  return { data, loading, error, reload };
}

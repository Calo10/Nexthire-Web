import { useCallback, useEffect, useState } from 'react';
import { getSourcingSourceConnections } from '../../api/sourcingApi';
import { isMetaAdsSourceReady, pickMetaAdsConnection } from '../../lib/sourcingMetaSource';
import type { SourcingSourceConnection } from '../../types/sourcing';

export function useMetaAdsSourceConnection(shouldFetch: boolean, refreshKey = 0) {
  const [connection, setConnection] = useState<SourcingSourceConnection | null>(null);
  const [isLoading, setIsLoading] = useState(shouldFetch);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!shouldFetch) {
      setConnection(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const list = await getSourcingSourceConnections();
      setConnection(pickMetaAdsConnection(list) ?? null);
    } catch (e: unknown) {
      setConnection(null);
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : null);
    } finally {
      setIsLoading(false);
    }
  }, [shouldFetch]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return {
    connection,
    isReady: isMetaAdsSourceReady(connection),
    isLoading,
    error,
    refresh: load,
  };
}

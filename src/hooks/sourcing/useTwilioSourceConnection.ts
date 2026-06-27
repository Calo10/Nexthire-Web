import { useCallback, useEffect, useState } from 'react';
import { getSourcingSourceConnections } from '../../api/sourcingApi';
import { isTwilioSourceReady, pickTwilioConnection } from '../../lib/sourcingTwilioSource';
import type { SourcingSourceConnection } from '../../types/sourcing';

export function useTwilioSourceConnection(shouldFetch: boolean, refreshKey = 0) {
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
      setConnection(pickTwilioConnection(list) ?? null);
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
    isReady: isTwilioSourceReady(connection),
    isLoading,
    error,
    refresh: load,
  };
}

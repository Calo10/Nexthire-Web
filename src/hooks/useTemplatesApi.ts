import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApiError } from '../lib/api';
import { templatesApi } from '../api/templatesApi';
import type { Template, TemplateChannel } from '../types/templates';

export function useTemplatesList(shouldFetch: boolean, channel: TemplateChannel) {
  const [data, setData] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const stableChannel = useMemo(() => channel, [channel]);
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
        const result = await templatesApi.list({ channel: stableChannel });
        if (!cancelled) setData(result);
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
  }, [shouldFetch, stableChannel, refreshIndex]);

  return { data, setData, isLoading, error, refetch };
}

export function useTemplate(shouldFetch: boolean, templateId: string | null) {
  const [data, setData] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const stableId = useMemo(() => templateId, [templateId]);
  const refetch = useCallback(() => setRefreshIndex((i) => i + 1), []);

  useEffect(() => {
    if (!shouldFetch || !stableId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await templatesApi.getById(stableId);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e as ApiError);
          setData(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [shouldFetch, stableId, refreshIndex]);

  return { data, setData, isLoading, error, refetch };
}


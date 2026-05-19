import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiError } from '../lib/api';
import { applicationsApi } from '../api/applicationsApi';
import type { ApplicationsKanbanResponse, KanbanApplicationCard, KanbanColumn } from '../types/applications';

export interface UseKanbanResult {
  data: ApplicationsKanbanResponse | null;
  columns: KanbanColumn[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
  moveOptimistic: (applicationId: string, toStageId: string) => Promise<void>;
  updateStatusOptimistic: (applicationId: string, status: string, removeFromBoard?: boolean) => Promise<void>;
  insertIntoFirstStage: (card: KanbanApplicationCard) => void;
}

function cloneColumns(cols: KanbanColumn[]): KanbanColumn[] {
  return cols.map((c) => ({ ...c, items: [...c.items] }));
}

function removeFromColumns(cols: KanbanColumn[], applicationId: string): { cols: KanbanColumn[]; found?: KanbanApplicationCard } {
  let found: KanbanApplicationCard | undefined;
  const next = cols.map((c) => {
    const idx = c.items.findIndex((i) => i.id === applicationId);
    if (idx === -1) return c;
    const items = [...c.items];
    found = items.splice(idx, 1)[0];
    return { ...c, items };
  });
  return { cols: next, found };
}

function upsertIntoStage(cols: KanbanColumn[], stageId: string, card: KanbanApplicationCard): KanbanColumn[] {
  return cols.map((c) => {
    if (c.stageId !== stageId) return c;
    return { ...c, items: [card, ...c.items] };
  });
}

export function useKanban(shouldFetch: boolean, jobId: string | null): UseKanbanResult {
  const [data, setData] = useState<ApplicationsKanbanResponse | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refetch = useCallback(() => setRefreshIndex((i) => i + 1), []);

  useEffect(() => {
    if (!shouldFetch || !jobId) {
      setData(null);
      setColumns([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await applicationsApi.kanban(jobId);
        if (cancelled) return;
        setData(res);
        setColumns(res.columns || []);
      } catch (e) {
        if (cancelled) return;
        setError(e as ApiError);
        setData(null);
        setColumns([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [shouldFetch, jobId, refreshIndex]);

  const inflight = useRef<Set<string>>(new Set());

  const moveOptimistic = useCallback(
    async (applicationId: string, toStageId: string) => {
      if (!applicationId || !toStageId) return;
      const key = `${applicationId}->${toStageId}`;
      if (inflight.current.has(key)) return;
      inflight.current.add(key);

      const prev = cloneColumns(columns);
      // optimistic
      const removed = removeFromColumns(cloneColumns(columns), applicationId);
      const card = removed.found ? { ...removed.found, stageId: toStageId } : undefined;
      const nextCols = card ? upsertIntoStage(removed.cols, toStageId, card) : removed.cols;
      setColumns(nextCols);

      try {
        await applicationsApi.move(applicationId, toStageId);
      } catch (e) {
        // rollback
        setColumns(prev);
        throw e;
      } finally {
        inflight.current.delete(key);
      }
    },
    [columns]
  );

  const updateStatusOptimistic = useCallback(
    async (applicationId: string, status: string, removeFromBoard: boolean = true) => {
      if (!applicationId || !status) return;
      const key = `${applicationId}->status:${status}`;
      if (inflight.current.has(key)) return;
      inflight.current.add(key);

      const prev = cloneColumns(columns);

      // optimistic: update status (and optionally remove from board)
      let nextCols = cloneColumns(columns);
      if (removeFromBoard) {
        nextCols = removeFromColumns(nextCols, applicationId).cols;
      } else {
        nextCols = nextCols.map((c) => ({
          ...c,
          items: c.items.map((i) => (i.id === applicationId ? { ...i, status } : i)),
        }));
      }
      setColumns(nextCols);

      try {
        await applicationsApi.updateStatus(applicationId, status);
      } catch (e) {
        setColumns(prev);
        throw e;
      } finally {
        inflight.current.delete(key);
      }
    },
    [columns]
  );

  const insertIntoFirstStage = useCallback(
    (card: KanbanApplicationCard) => {
      if (!card) return;
      const firstStageId = columns[0]?.stageId;
      if (!firstStageId) return;
      const withStage = { ...card, stageId: card.stageId || firstStageId };
      setColumns((current) => upsertIntoStage(current, withStage.stageId, withStage));
    },
    [columns]
  );

  const stableColumns = useMemo(() => columns, [columns]);

  return { data, columns: stableColumns, isLoading, error, refetch, moveOptimistic, updateStatusOptimistic, insertIntoFirstStage };
}


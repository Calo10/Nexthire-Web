import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ApiError } from '../lib/api';
import { candidatesApi } from '../api/candidatesApi';
import { normalizePagedResult, unwrapPayload } from '../lib/normalizeApiResponse';
import type { Candidate, GetCandidatesParams } from '../types/candidates';

export interface CandidatesListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface UseCandidatesListReturn {
  data: Candidate[];
  meta: CandidatesListMeta;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

function readCount(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function firstCount(sources: Array<Record<string, unknown> | null>, keys: string[]): number | undefined {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const count = readCount(source[key]);
      if (count !== undefined) return count;
    }
  }
  return undefined;
}

function normalizeCandidatesPage(result: unknown, requested: { page: number; pageSize: number }): {
  items: Candidate[];
  meta: CandidatesListMeta;
} {
  const paged = normalizePagedResult<Candidate>(result);
  const root = asRecord(result);
  const unwrapped = asRecord(unwrapPayload(result));
  const sources = [
    root,
    unwrapped,
    asRecord(root?.pagination),
    asRecord(root?.meta),
    asRecord(root?.paging),
    asRecord(unwrapped?.pagination),
    asRecord(unwrapped?.meta),
    asRecord(unwrapped?.paging),
  ];

  const rawItems = unwrapped?.Items ?? root?.Items;
  const items = paged.items.length > 0 ? paged.items : Array.isArray(rawItems) ? (rawItems as Candidate[]) : [];

  const total =
    firstCount(sources, [
      'totalCount',
      'TotalCount',
      'total',
      'Total',
      'count',
      'totalItems',
      'TotalItems',
      'totalRecords',
      'recordCount',
    ]) ?? paged.total;

  const page =
    firstCount(sources, ['page', 'Page', 'currentPage', 'pageNumber', 'PageNumber']) ??
    paged.page ??
    requested.page;

  const pageSize = firstCount(sources, ['pageSize', 'PageSize', 'limit', 'take']) ?? requested.pageSize;

  const reportedPages = firstCount(sources, ['totalPages', 'TotalPages', 'pageCount', 'PageCount']);
  const totalPages = Math.max(1, reportedPages ?? Math.ceil(total / Math.max(1, pageSize || requested.pageSize)));

  return {
    items,
    meta: { page, pageSize: pageSize || requested.pageSize, total, totalPages },
  };
}

function candidateTagIds(candidate: Candidate): string[] {
  const raw = candidate as Candidate & { Tags?: Array<{ id?: string; Id?: string }> };
  const tags = candidate.tags ?? raw.Tags ?? [];
  return tags.map((tag) => String(tag.id ?? (tag as { Id?: string }).Id ?? '')).filter(Boolean);
}

function matchesSelectedTags(candidate: Candidate, selected: Set<string>): boolean {
  if (selected.size === 0) return true;
  return candidateTagIds(candidate).some((id) => selected.has(id));
}

export function useCandidatesList(shouldFetch: boolean, params: GetCandidatesParams): UseCandidatesListReturn {
  const [data, setData] = useState<Candidate[]>([]);
  const [meta, setMeta] = useState<CandidatesListMeta>({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 25,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const tagKey = (params.tagIds ?? []).join(',');
  const stableParams = useMemo(
    () => ({
      search: params.search,
      source: params.source,
      from: params.from,
      to: params.to,
      tagIds: tagKey ? tagKey.split(',') : undefined,
      page: params.page,
      pageSize: params.pageSize,
    }),
    [params.search, params.source, params.from, params.to, params.page, params.pageSize, tagKey],
  );

  const refetch = useCallback(() => {
    setRefreshIndex((i) => i + 1);
  }, []);

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
        const selected = new Set((stableParams.tagIds ?? []).filter(Boolean));
        const result = await candidatesApi.list(stableParams);
        if (cancelled) return;

        const normalized = normalizeCandidatesPage(result, {
          page: stableParams.page ?? 1,
          pageSize: stableParams.pageSize ?? 25,
        });

        const serverIgnoredTags =
          selected.size > 0 && normalized.items.some((candidate) => !matchesSelectedTags(candidate, selected));

        if (!serverIgnoredTags) {
          setData(normalized.items);
          setMeta(normalized.meta);
          return;
        }

        const fetchSize = 200;
        const collected: Candidate[] = [];
        let fetched = 0;
        let total = 0;
        let fetchPage = 1;
        do {
          const pageResult = await candidatesApi.list({
            search: stableParams.search,
            source: stableParams.source,
            from: stableParams.from,
            to: stableParams.to,
            page: fetchPage,
            pageSize: fetchSize,
          });
          if (cancelled) return;
          const chunk = normalizeCandidatesPage(pageResult, { page: fetchPage, pageSize: fetchSize });
          total = chunk.meta.total;
          collected.push(...chunk.items);
          fetched += chunk.items.length;
          if (chunk.items.length === 0) break;
          fetchPage += 1;
        } while (fetched < total && fetchPage <= 40);

        const filtered = collected.filter((candidate) => matchesSelectedTags(candidate, selected));
        const uiPage = stableParams.page ?? 1;
        const uiSize = stableParams.pageSize ?? 25;
        const start = (uiPage - 1) * uiSize;
        setData(filtered.slice(start, start + uiSize));
        setMeta({
          page: uiPage,
          pageSize: uiSize,
          total: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / uiSize)),
        });
      } catch (e) {
        if (!cancelled) {
          setError(e as ApiError);
          setData([]);
          setMeta({
            page: stableParams.page ?? 1,
            pageSize: stableParams.pageSize ?? 25,
            total: 0,
            totalPages: 1,
          });
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


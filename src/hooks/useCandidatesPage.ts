import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { candidatesApi } from '../api/candidatesApi';
import { candidateSourceSelectOptions } from '../lib/candidateSources';
import { displayCandidateEmail } from '../lib/candidateEmail';
import { downloadExcel, exportFileName, formatExportDate } from '../lib/exportExcel';
import { formatPhoneForDisplay } from '../lib/phone';
import { fetchAllCandidates, useCandidatesList } from './useCandidatesList';
import type { Candidate, CandidateTag } from '../types/candidates';

export const FILTER_CONTROL_CLASS = 'h-12 min-h-12 max-h-12 box-border py-2.5 text-sm min-w-0 w-full';

const CANDIDATES_PAGE_SIZE = 25;

export function useCandidatesPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const shouldFetch = isAuthenticated && !authLoading;

  const [searchQuery, setSearchQueryState] = useState('');
  const [source, setSourceState] = useState('');
  const [from, setFromState] = useState('');
  const [to, setToState] = useState('');
  const [tagIds, setTagIdsState] = useState<string[]>([]);
  const [tagOptions, setTagOptions] = useState<CandidateTag[]>([]);
  const [page, setPage] = useState(1);

  const setSearchQuery = (value: string) => {
    setSearchQueryState(value);
    setPage(1);
  };
  const setSource = (value: string) => {
    setSourceState(value);
    setPage(1);
  };
  const setFrom = (value: string) => {
    setFromState(value);
    setPage(1);
  };
  const setTo = (value: string) => {
    setToState(value);
    setPage(1);
  };
  const setTagIds = (ids: string[]) => {
    setTagIdsState(ids);
    setPage(1);
  };

  const loadTags = useCallback(async () => {
    try {
      const tags = await candidatesApi.listTags();
      setTagOptions(tags);
    } catch {
      setTagOptions([]);
    }
  }, []);

  useEffect(() => {
    if (!shouldFetch) return;
    loadTags();
  }, [shouldFetch, loadTags]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      search: searchQuery.trim() || undefined,
      source: source || undefined,
      from: from || undefined,
      to: to || undefined,
      tagIds: tagIds.length > 0 ? tagIds : undefined,
      page,
      pageSize: CANDIDATES_PAGE_SIZE,
    }),
    [searchQuery, source, from, to, tagIds, page],
  );

  const { data: candidates, meta, isLoading, error, refetch } = useCandidatesList(shouldFetch, params);

  useEffect(() => {
    if (isLoading || meta.total <= 0) return;
    if (page > meta.totalPages) setPage(meta.totalPages);
  }, [isLoading, meta.total, meta.totalPages, page]);

  const handleRowClick = (c: Candidate) => {
    setSelectedCandidateId(c.id);
    setSelectedCandidate(c);
    setIsDrawerOpen(true);
  };

  const handleCreated = (_created: Candidate) => {
    refetch();
  };

  const sourceOptions = useMemo(
    () => [{ value: '', label: t('candidates.filters.sourceAll') }, ...candidateSourceSelectOptions(t)],
    [t],
  );

  const exportToExcel = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const rows = await fetchAllCandidates({
        search: searchQuery.trim() || undefined,
        source: source || undefined,
        from: from || undefined,
        to: to || undefined,
        tagIds: tagIds.length > 0 ? tagIds : undefined,
      });
      const locale = i18n.language || 'en';
      downloadExcel(
        exportFileName('candidatos'),
        t('candidates.title'),
        [
          t('candidates.table.name'),
          t('candidates.table.email'),
          t('candidates.table.phone'),
          t('candidates.table.source'),
          t('candidates.table.tags'),
          t('candidates.table.created'),
        ],
        rows.map((candidate) => [
          `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
          displayCandidateEmail(candidate.email, ''),
          candidate.phone ? formatPhoneForDisplay(candidate.phone).text : '',
          candidate.source ? String(candidate.source) : '',
          (candidate.tags ?? []).map((tag) => tag.name).filter(Boolean).join(', '),
          formatExportDate(candidate.createdAt, locale),
        ]),
      );
    } catch {
      setExportError(t('common.actions.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  }, [from, i18n.language, searchQuery, source, t, tagIds, to]);

  return {
    t,
    searchQuery,
    setSearchQuery,
    source,
    setSource,
    from,
    setFrom,
    to,
    setTo,
    tagIds,
    setTagIds,
    tagOptions,
    loadTags,
    isNewModalOpen,
    setIsNewModalOpen,
    selectedCandidateId,
    setSelectedCandidateId,
    selectedCandidate,
    isDrawerOpen,
    setIsDrawerOpen,
    candidates,
    page,
    pageSize: meta.pageSize || CANDIDATES_PAGE_SIZE,
    total: meta.total,
    totalPages: meta.totalPages,
    setPage,
    isLoading,
    error,
    refetch,
    handleRowClick,
    handleCreated,
    sourceOptions,
    isExporting,
    exportError,
    exportToExcel,
  };
}

export type CandidatesPageState = ReturnType<typeof useCandidatesPage>;

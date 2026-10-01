import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { candidateSourceSelectOptions } from '../lib/candidateSources';
import { useCandidatesList } from './useCandidatesList';
import type { Candidate } from '../types/candidates';

export const FILTER_CONTROL_CLASS = 'h-12 min-h-12 max-h-12 box-border py-2.5 text-sm min-w-0 w-full';

const CANDIDATES_PAGE_SIZE = 25;

export function useCandidatesPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const shouldFetch = isAuthenticated && !authLoading;

  const [searchQuery, setSearchQueryState] = useState('');
  const [source, setSourceState] = useState('');
  const [from, setFromState] = useState('');
  const [to, setToState] = useState('');
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

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const params = useMemo(
    () => ({
      search: searchQuery.trim() || undefined,
      source: source || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      pageSize: CANDIDATES_PAGE_SIZE,
    }),
    [searchQuery, source, from, to, page],
  );

  const { data: candidates, meta, isLoading, error, refetch } = useCandidatesList(shouldFetch, params);

  useEffect(() => {
    if (isLoading || meta.total <= 0) return;
    if (page > meta.totalPages) setPage(meta.totalPages);
  }, [isLoading, meta.total, meta.totalPages, page]);

  const handleRowClick = (c: Candidate) => {
    setSelectedCandidateId(c.id);
    setIsDrawerOpen(true);
  };

  const handleCreated = (_created: Candidate) => {
    refetch();
  };

  const sourceOptions = useMemo(
    () => [{ value: '', label: t('candidates.filters.sourceAll') }, ...candidateSourceSelectOptions(t)],
    [t],
  );

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
    isNewModalOpen,
    setIsNewModalOpen,
    selectedCandidateId,
    setSelectedCandidateId,
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
  };
}

export type CandidatesPageState = ReturnType<typeof useCandidatesPage>;

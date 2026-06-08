import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { candidateSourceSelectOptions } from '../lib/candidateSources';
import { useCandidatesList } from './useCandidatesList';
import type { Candidate } from '../types/candidates';

export const FILTER_CONTROL_CLASS = 'h-12 min-h-12 max-h-12 box-border py-2.5 text-sm min-w-0 w-full';

export function useCandidatesPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const shouldFetch = isAuthenticated && !authLoading;

  const [searchQuery, setSearchQuery] = useState('');
  const [source, setSource] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const params = useMemo(
    () => ({
      search: searchQuery.trim() || undefined,
      source: source || undefined,
      from: from || undefined,
      to: to || undefined,
      page: 1,
      pageSize: 25,
    }),
    [searchQuery, source, from, to],
  );

  const { data: candidates, isLoading, error, refetch } = useCandidatesList(shouldFetch, params);

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
    isLoading,
    error,
    refetch,
    handleRowClick,
    handleCreated,
    sourceOptions,
  };
}

export type CandidatesPageState = ReturnType<typeof useCandidatesPage>;

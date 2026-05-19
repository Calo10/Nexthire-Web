import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import SelectField from '../components/SelectField';
import TextField from '../components/TextField';
import CandidatesTable from '../components/candidates/CandidatesTable';
import NewCandidateModal from '../components/candidates/NewCandidateModal';
import CandidateDetailDrawer from '../components/candidates/CandidateDetailDrawer';
import { candidateSourceSelectOptions } from '../lib/candidateSources';
import { useCandidatesList } from '../hooks/useCandidatesList';
import type { Candidate } from '../types/candidates';

export default function CandidatesPage() {
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
    [searchQuery, source, from, to]
  );

  const { data: candidates, isLoading, error, refetch } = useCandidatesList(shouldFetch, params);

  const handleRowClick = (c: Candidate) => {
    setSelectedCandidateId(c.id);
    setIsDrawerOpen(true);
  };

  const handleCreated = (created: Candidate) => {
    refetch();
  };

  const sourceOptions = useMemo(
    () => [{ value: '', label: t('candidates.filters.sourceAll') }, ...candidateSourceSelectOptions(t)],
    [t]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <TopBar />

      <div className="p-8">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-dark-text">{t('candidates.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('candidates.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-72 hidden md:block">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t('candidates.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>

            <Button variant="primary" size="md" onClick={() => setIsNewModalOpen(true)}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('candidates.newCandidate')}</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="mb-4 md:hidden">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t('candidates.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label={t('candidates.filters.source')}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            options={sourceOptions}
          />
          <TextField
            label={t('candidates.filters.from')}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <TextField
            label={t('candidates.filters.to')}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        {/* Table Card */}
        <Card className="p-0 overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorMessage message={error.message || t('candidates.errors.loadCandidates')} />
            </div>
          ) : !isLoading && candidates.length === 0 ? (
            <div className="text-center py-16 px-6">
              <h3 className="text-lg font-semibold text-dark-text mb-2">{t('candidates.empty.title')}</h3>
              <p className="text-sm text-gray-600 mb-6">{t('candidates.empty.subtitle')}</p>
              <Button variant="primary" onClick={() => setIsNewModalOpen(true)}>
                {t('candidates.empty.cta')}
              </Button>
            </div>
          ) : (
            <CandidatesTable candidates={candidates} isLoading={isLoading} onRowClick={handleRowClick} />
          )}
        </Card>
      </div>

      <NewCandidateModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={handleCreated}
      />

      <CandidateDetailDrawer
        isOpen={isDrawerOpen}
        candidateId={selectedCandidateId}
        onClose={() => setIsDrawerOpen(false)}
        onUpdated={() => refetch()}
        onDeleted={() => {
          setSelectedCandidateId(null);
          refetch();
        }}
      />
    </div>
  );
}


import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import TextField from '../TextField';
import CandidatesMobileList from './CandidatesMobileList';
import type { CandidatesPageState } from '../../hooks/useCandidatesPage';

export default function CandidatesMobileView({
  t,
  searchQuery,
  setSearchQuery,
  source,
  setSource,
  from,
  setFrom,
  to,
  setTo,
  setIsNewModalOpen,
  candidates,
  isLoading,
  error,
  handleRowClick,
  sourceOptions,
}: CandidatesPageState) {
  const showEmpty = !isLoading && !error && candidates.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="p-4">
        <h1 className="text-lg font-semibold text-dark-text">{t('candidates.title')}</h1>
        <p className="text-xs text-gray-600 mt-1 mb-4">{t('candidates.subtitle')}</p>

        <Button
          variant="primary"
          size="md"
          className="w-full justify-center mb-4"
          onClick={() => setIsNewModalOpen(true)}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{t('candidates.newCandidate')}</span>
          </div>
        </Button>

        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">{t('candidates.filters.source')}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {sourceOptions.map((option) => (
              <button
                key={option.value || 'all'}
                type="button"
                onClick={() => setSource(option.value)}
                className={`shrink-0 px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                  source === option.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <TextField
            label={t('candidates.filters.from')}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-sm min-w-0 w-full"
          />
          <TextField
            label={t('candidates.filters.to')}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-sm min-w-0 w-full"
          />
        </div>

        {error ? (
          <ErrorMessage message={error.message || t('candidates.errors.loadCandidates')} />
        ) : showEmpty ? (
          <div className="text-center py-12 px-4 bg-white rounded-xl border border-gray-200">
            <h3 className="text-base font-semibold text-dark-text mb-2">{t('candidates.empty.title')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('candidates.empty.subtitle')}</p>
            <Button variant="primary" onClick={() => setIsNewModalOpen(true)}>
              {t('candidates.empty.cta')}
            </Button>
          </div>
        ) : (
          <CandidatesMobileList
            candidates={candidates}
            isLoading={isLoading}
            onCandidateClick={handleRowClick}
          />
        )}
      </div>
    </div>
  );
}

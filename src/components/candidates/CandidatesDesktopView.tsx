import TopBar from '../TopBar';
import Card from '../Card';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import SelectField from '../SelectField';
import TextField from '../TextField';
import CandidatesTable from './CandidatesTable';
import { FILTER_CONTROL_CLASS, type CandidatesPageState } from '../../hooks/useCandidatesPage';

export default function CandidatesDesktopView({
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

        {/* Filters Row — equal-width columns (date inputs have a large default min-width) */}
        <div className="mb-6 grid w-full grid-cols-1 sm:grid-cols-[repeat(3,minmax(0,1fr))] gap-4 items-end">
          <SelectField
            label={t('candidates.filters.source')}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            options={sourceOptions}
            className={FILTER_CONTROL_CLASS}
          />
          <TextField
            label={t('candidates.filters.from')}
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={FILTER_CONTROL_CLASS}
          />
          <TextField
            label={t('candidates.filters.to')}
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={FILTER_CONTROL_CLASS}
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
    </div>
  );
}

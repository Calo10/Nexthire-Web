import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import JobsMobileList from './JobsMobileList';
import type { JobsPageState } from '../../hooks/useJobsPage';

export default function JobsMobileView({
  t,
  publicJobsPath,
  jobsLoading,
  jobsError,
  searchQuery,
  setSearchQuery,
  selectedDate,
  setSelectedDate,
  selectedStatus,
  setSelectedStatus,
  setIsNewJobModalOpen,
  filteredJobs,
  dateOptions,
  statusOptions,
  openJobDrawer,
}: JobsPageState) {
  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="p-4">
        <h1 className="text-lg font-semibold text-dark-text mb-4">{t('jobs.title')}</h1>

        <div className="flex flex-col gap-2 mb-4">
          <Button variant="primary" size="md" className="w-full justify-center" onClick={() => setIsNewJobModalOpen(true)}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('jobs.newJob')}</span>
            </div>
          </Button>
          <Button
            variant="outline"
            size="md"
            className="w-full justify-center"
            disabled={!publicJobsPath}
            onClick={() => {
              if (publicJobsPath) {
                window.open(publicJobsPath, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span>{t('jobs.viewPublicJobs')}</span>
            </div>
          </Button>
        </div>

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
            placeholder={t('jobs.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-2">{t('jobs.table.status')}</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedStatus(option.value)}
                className={`shrink-0 px-3 py-2 rounded-full text-xs font-medium border transition-colors ${
                  selectedStatus === option.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">{t('jobs.table.created')}</p>
          <div className="flex gap-1">
            {dateOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedDate(option.value)}
                className={`flex-1 min-w-0 px-1 py-2 rounded-lg text-[10px] leading-tight font-medium border transition-colors ${
                  selectedDate === option.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {jobsError ? (
          <ErrorMessage message={jobsError.message || t('jobs.errors.loadJobs')} />
        ) : (
          <JobsMobileList jobs={filteredJobs} isLoading={jobsLoading} onJobClick={openJobDrawer} />
        )}
      </div>
    </div>
  );
}

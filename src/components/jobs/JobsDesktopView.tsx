import TopBar from '../TopBar';
import Card from '../Card';
import Button from '../Button';
import JobsTable from '../JobsTable';
import ErrorMessage from '../ErrorMessage';
import type { JobsPageState } from '../../hooks/useJobsPage';

export default function JobsDesktopView({
  t,
  publicJobsPath,
  jobsLoading,
  jobsError,
  searchQuery,
  setSearchQuery,
  showDateFilter,
  setShowDateFilter,
  showStatusFilter,
  setShowStatusFilter,
  showFiltersMenu,
  setShowFiltersMenu,
  selectedDate,
  setSelectedDate,
  selectedStatus,
  setSelectedStatus,
  setIsNewJobModalOpen,
  dateFilterRef,
  statusFilterRef,
  filtersMenuRef,
  filteredJobs,
  dateOptions,
  statusOptions,
  selectedDateLabel,
  selectedStatusLabel,
  openJobDrawer,
}: JobsPageState) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <TopBar />

      <div className="p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-dark-text">{t('jobs.title')}</h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
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
            <Button variant="primary" size="md" onClick={() => setIsNewJobModalOpen(true)}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('jobs.newJob')}</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Search and Filters Section */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
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
              placeholder={t('jobs.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3">
            {/* Date Filter */}
            <div className="relative" ref={dateFilterRef}>
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">{selectedDateLabel}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDateFilter && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {dateOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedDate(option.value);
                        setShowDateFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        selectedDate === option.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative" ref={statusFilterRef}>
              <button
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                <span className="hidden sm:inline">{selectedStatusLabel}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showStatusFilter && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedStatus(option.value);
                        setShowStatusFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        selectedStatus === option.value
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters Button */}
            <div className="relative" ref={filtersMenuRef}>
              <button
                onClick={() => setShowFiltersMenu(!showFiltersMenu)}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="hidden sm:inline">{t('jobs.filters.title')}</span>
              </button>
              {showFiltersMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{t('jobs.filters.more')}</div>
                  <div className="px-4 py-2 text-sm text-gray-700">{t('jobs.filters.comingSoon')}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Jobs Table Card */}
        <Card className="p-0 overflow-hidden">
          {jobsError ? (
            <div className="p-6">
              <ErrorMessage message={jobsError.message || t('jobs.errors.loadJobs')} />
            </div>
          ) : (
            <JobsTable
              jobs={filteredJobs}
              isLoading={jobsLoading}
              onRowClick={openJobDrawer}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

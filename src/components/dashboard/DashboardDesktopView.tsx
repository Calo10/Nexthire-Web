import StatCard from '../StatCard';
import StatCardSkeleton from '../StatCardSkeleton';
import TableSkeleton from '../TableSkeleton';
import LanguageSwitcher from '../LanguageSwitcher';
import ErrorMessage from '../ErrorMessage';
import BarChart from '../BarChart';
import LineChart from '../LineChart';
import ChartCard from '../ChartCard';
import Card from '../Card';
import type { DashboardPageState } from '../../hooks/useDashboardPage';

export default function DashboardDesktopView({
  t,
  user,
  dateRange,
  setDateRange,
  showUserMenu,
  setShowUserMenu,
  showDateFilter,
  setShowDateFilter,
  userMenuRef,
  dateFilterRef,
  summary,
  summaryLoading,
  summaryError,
  candidates,
  candidatesLoading,
  candidatesError,
  applicationsByStage,
  applicationsLoading,
  applicationsError,
  activityTrend,
  activityLoading,
  activityError,
  myJobs,
  jobsLoading,
  jobsError,
  tasks,
  tasksLoading,
  tasksError,
  allJobs,
  interviewStageCount,
  handleLogout,
  getStageInfo,
  getJobStatusColor,
  getTaskStatusColor,
  formatStatusLabel,
  formatDateShort,
  dateRangeOptions,
  selectedDateRangeLabel,
  welcomeTitle,
}: DashboardPageState) {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-dark-text">
          {welcomeTitle}
        </h1>
        <div className="flex items-center gap-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            {/* Date Range Filter */}
            <div className="relative" ref={dateFilterRef}>
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {selectedDateRangeLabel}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showDateFilter && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  {dateRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDateRange(option.value);
                        setShowDateFilter(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        dateRange === option.value ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <LanguageSwitcher />
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 focus:outline-none"
            >
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-dark-text break-words">
                    {user?.name || user?.email || 'User'}
                  </p>
                  {user?.email && user?.name && (
                    <p className="text-xs text-gray-500 mt-1 break-words">{user.email}</p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t('dashboard.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards - 6 KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {summaryLoading ? (
          <>
            <StatCardSkeleton key="skeleton-1" />
            <StatCardSkeleton key="skeleton-2" />
            <StatCardSkeleton key="skeleton-3" />
            <StatCardSkeleton key="skeleton-4" />
            <StatCardSkeleton key="skeleton-5" />
            <StatCardSkeleton key="skeleton-6" />
          </>
        ) : summaryError ? (
          <div className="col-span-6">
            <ErrorMessage message={summaryError.message || 'Failed to load dashboard summary'} />
          </div>
        ) : summary ? (
          <>
            <StatCard
              title={t('dashboard.activeJobs')}
              value={(summary.openJobs || 0).toString()}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              iconColor="text-primary"
            />
            <StatCard
              title={t('dashboard.candidatesInPipeline')}
              value={(summary.newCandidates || 0).toString()}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              iconColor="text-primary"
            />
            <StatCard
              title={t('dashboard.interviewStage')}
              value={(interviewStageCount !== null ? interviewStageCount : summary.upcomingInterviews || 0).toString()}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconColor="text-green-600"
            />
            <StatCard
              title={t('dashboard.hiredThisMonth')}
              value={(summary.offersSent || 0).toString()}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              iconColor="text-green-600"
            />
            <StatCard
              title={t('dashboard.totalApplications')}
              value={(summary.newApplications || 0).toString()}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              iconColor="text-blue-600"
            />
            <StatCard
              title={t('dashboard.avgTimeToHire')}
              value={`${(summary.avgTimeToHireDays || 0).toFixed(1)}d`}
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconColor="text-orange-600"
            />
          </>
        ) : (
          // Show empty state if no data and no error (shouldn't happen, but safe fallback)
          <div className="col-span-6">
            <div className="text-center py-8 text-gray-500 text-sm">
              {t('dashboard.loading')}
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Applications by Stage Chart */}
        <ChartCard
          title={t('dashboard.applicationsByStage')}
          isLoading={applicationsLoading}
          error={applicationsError?.message || null}
        >
          <BarChart data={applicationsByStage || []} isLoading={applicationsLoading} />
        </ChartCard>

        {/* Activity Trend Chart */}
        <ChartCard
          title={t('dashboard.activityTrend')}
          isLoading={activityLoading}
          error={activityError?.message || null}
        >
          <LineChart data={activityTrend || []} isLoading={activityLoading} />
        </ChartCard>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Jobs Table */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-dark-text mb-4">{t('dashboard.myJobs')}</h3>
            {jobsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : jobsError ? (
              <ErrorMessage message={jobsError.message || 'Failed to load jobs'} />
            ) : (myJobs || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {t('dashboard.noJobsFound')}
              </div>
            ) : (
              <div className="space-y-3">
                {(myJobs || []).slice(0, 5).map((job) => (
                  <div key={job.id} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium text-dark-text">{job.title || 'Untitled Job'}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getJobStatusColor(job.status || 'draft')}`}>
                        {formatStatusLabel(job.status || 'draft')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{job.department || job.location || '-'}</span>
                      <span>{job.createdAt ? formatDateShort(job.createdAt) : '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Candidates Table */}
        <div className="lg:col-span-1">
          {candidatesLoading ? (
            <TableSkeleton rows={5} />
          ) : candidatesError ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">{t('dashboard.recentCandidates')}</h3>
              <ErrorMessage message={candidatesError.message || 'Failed to load candidates'} />
            </Card>
          ) : (candidates || []).length === 0 ? (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">{t('dashboard.recentCandidates')}</h3>
              <div className="text-center py-8 text-gray-500 text-sm">
                {t('dashboard.noCandidatesFound')}
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-dark-text mb-4">{t('dashboard.recentCandidates')}</h3>
              <div className="space-y-3">
                {(candidates || []).slice(0, 5).map((candidate) => {
                  const stageInfo = getStageInfo(candidate.currentStageName || 'Applied');
                  return (
                    <div key={candidate.candidateId} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium text-dark-text">{candidate.fullName || 'Unknown'}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${stageInfo.color}`}>
                          {stageInfo.translation}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{candidate.email || '-'}</span>
                        <span>{candidate.updatedAt ? formatDateShort(candidate.updatedAt) : '-'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Upcoming Tasks Table */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-dark-text mb-4">{t('dashboard.upcomingTasks')}</h3>
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            ) : tasksError ? (
              <ErrorMessage message={tasksError.message || 'Failed to load tasks'} />
            ) : (tasks || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {t('dashboard.noUpcomingTasks')}
              </div>
            ) : (
              <div className="space-y-3">
                {(tasks || []).slice(0, 5).map((task) => {
                  // Find related job and candidate names if available
                  const relatedJob = task.relatedJobId
                    ? allJobs.find((j) => String(j.id) === String(task.relatedJobId))
                    : null;
                  const relatedCandidate = task.relatedCandidateId ? candidates.find(c => c.candidateId === task.relatedCandidateId) : null;
                  
                  return (
                    <div key={task.taskId} className="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="text-sm font-medium text-dark-text">{task.title || 'Untitled Task'}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTaskStatusColor(task.status || 'open')}`}>
                          {formatStatusLabel(task.status || 'open')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {relatedCandidate && <span>{relatedCandidate.fullName}</span>}
                        {relatedCandidate && relatedJob && <span> • </span>}
                        {relatedJob && <span>{relatedJob.title}</span>}
                        <span className="ml-2">{task.dueAt ? formatDateShort(task.dueAt) : '-'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

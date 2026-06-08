import ErrorMessage from '../ErrorMessage';
import BarChart from '../BarChart';
import LineChart from '../LineChart';
import ChartCard from '../ChartCard';
import Card from '../Card';
import type { DashboardPageState } from '../../hooks/useDashboardPage';

function CompactStatCard({
  title,
  value,
  icon,
  iconColor = 'text-primary',
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-dark-text mb-0.5">{value}</p>
          <p className="text-xs text-gray-600 truncate">{title}</p>
        </div>
        {icon && <div className={`${iconColor} flex-shrink-0 ml-1`}>{icon}</div>}
      </div>
    </div>
  );
}

function CompactStatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-6 w-10 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export default function DashboardMobileView({
  t,
  dateRange,
  setDateRange,
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
  getStageInfo,
  getJobStatusColor,
  getTaskStatusColor,
  formatStatusLabel,
  formatDateShort,
  dateRangeOptions,
  welcomeTitle,
}: DashboardPageState) {
  return (
    <div className="p-4 pb-6 bg-gray-50 min-h-screen">
      <h1 className="text-lg font-semibold text-dark-text truncate mb-4">{welcomeTitle}</h1>

      <div className="flex w-full gap-1 mb-4">
        {dateRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setDateRange(option.value)}
            className={`flex-1 px-2 py-2 text-xs font-medium rounded-lg border transition-colors ${
              dateRange === option.value
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {summaryLoading ? (
          <>
            <CompactStatCardSkeleton />
            <CompactStatCardSkeleton />
            <CompactStatCardSkeleton />
            <CompactStatCardSkeleton />
            <CompactStatCardSkeleton />
            <CompactStatCardSkeleton />
          </>
        ) : summaryError ? (
          <div className="col-span-2">
            <ErrorMessage message={summaryError.message || 'Failed to load dashboard summary'} />
          </div>
        ) : summary ? (
          <>
            <CompactStatCard
              title={t('dashboard.activeJobs')}
              value={(summary.openJobs || 0).toString()}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              iconColor="text-primary"
            />
            <CompactStatCard
              title={t('dashboard.candidatesInPipeline')}
              value={(summary.newCandidates || 0).toString()}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              iconColor="text-primary"
            />
            <CompactStatCard
              title={t('dashboard.interviewStage')}
              value={(interviewStageCount !== null ? interviewStageCount : summary.upcomingInterviews || 0).toString()}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconColor="text-green-600"
            />
            <CompactStatCard
              title={t('dashboard.hiredThisMonth')}
              value={(summary.offersSent || 0).toString()}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              iconColor="text-green-600"
            />
            <CompactStatCard
              title={t('dashboard.totalApplications')}
              value={(summary.newApplications || 0).toString()}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              iconColor="text-blue-600"
            />
            <CompactStatCard
              title={t('dashboard.avgTimeToHire')}
              value={`${(summary.avgTimeToHireDays || 0).toFixed(1)}d`}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconColor="text-orange-600"
            />
          </>
        ) : (
          <div className="col-span-2">
            <div className="text-center py-6 text-gray-500 text-sm">{t('dashboard.loading')}</div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <ChartCard
          title={t('dashboard.applicationsByStage')}
          isLoading={applicationsLoading}
          error={applicationsError?.message || null}
        >
          <BarChart data={applicationsByStage || []} isLoading={applicationsLoading} />
        </ChartCard>
      </div>

      <div className="mb-4">
        <ChartCard
          title={t('dashboard.activityTrend')}
          isLoading={activityLoading}
          error={activityError?.message || null}
        >
          <LineChart data={activityTrend || []} isLoading={activityLoading} />
        </ChartCard>
      </div>

      <Card className="p-4 mb-4">
        <h3 className="text-base font-semibold text-dark-text mb-3">{t('dashboard.myJobs')}</h3>
        {jobsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : jobsError ? (
          <ErrorMessage message={jobsError.message || 'Failed to load jobs'} />
        ) : (myJobs || []).length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">{t('dashboard.noJobsFound')}</div>
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

      <Card className="p-4 mb-4">
        <h3 className="text-base font-semibold text-dark-text mb-3">{t('dashboard.recentCandidates')}</h3>
        {candidatesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : candidatesError ? (
          <ErrorMessage message={candidatesError.message || 'Failed to load candidates'} />
        ) : (candidates || []).length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">{t('dashboard.noCandidatesFound')}</div>
        ) : (
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
                    <span className="truncate mr-2">{candidate.email || '-'}</span>
                    <span className="flex-shrink-0">{candidate.updatedAt ? formatDateShort(candidate.updatedAt) : '-'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-base font-semibold text-dark-text mb-3">{t('dashboard.upcomingTasks')}</h3>
        {tasksLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : tasksError ? (
          <ErrorMessage message={tasksError.message || 'Failed to load tasks'} />
        ) : (tasks || []).length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">{t('dashboard.noUpcomingTasks')}</div>
        ) : (
          <div className="space-y-3">
            {(tasks || []).slice(0, 5).map((task) => {
              const relatedJob = task.relatedJobId
                ? allJobs.find((j) => String(j.id) === String(task.relatedJobId))
                : null;
              const relatedCandidate = task.relatedCandidateId
                ? candidates.find((c) => c.candidateId === task.relatedCandidateId)
                : null;

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
  );
}

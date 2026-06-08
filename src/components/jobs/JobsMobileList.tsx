import { useTranslation } from 'react-i18next';
import StatusPill from '../StatusPill';
import type { Job } from '../../types/dashboard';

interface JobsMobileListProps {
  jobs: Job[];
  isLoading?: boolean;
  onJobClick?: (job: Job) => void;
}

export default function JobsMobileList({ jobs, isLoading = false, onJobClick }: JobsMobileListProps) {
  const { t, i18n } = useTranslation();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(i18n.language || 'en', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">
        <p className="text-sm">{t('jobs.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const candidateCount = job.applicantsCount ?? job.applicationsCount ?? 0;

        return (
          <button
            key={job.id}
            type="button"
            onClick={() => onJobClick?.(job)}
            className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 shadow-sm active:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-dark-text leading-snug">{job.title}</h3>
              <StatusPill status={job.status} className="shrink-0" />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {candidateCount} {t('jobs.table.candidates').toLowerCase()}
              </span>
              <span>{formatDate(job.createdAt)}</span>
            </div>
            {(job.department || job.location) && (
              <p className="mt-2 text-xs text-gray-500 truncate">
                {[job.department, job.location].filter(Boolean).join(' · ')}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

import StatusPill from './StatusPill';
import { useTranslation } from 'react-i18next';
import type { Job } from '../types/dashboard';

interface JobsTableProps {
  jobs: Job[];
  isLoading?: boolean;
  onRowClick?: (job: Job) => void;
}

export default function JobsTable({ jobs, isLoading = false, onRowClick }: JobsTableProps) {
  const { t, i18n } = useTranslation();
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(i18n.language || 'en', {
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
      <div className="p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{t('jobs.empty')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('jobs.table.title')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('jobs.table.candidates')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('jobs.table.status')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('jobs.table.created')}</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onRowClick?.(job)}
            >
              <td className="py-4 px-6">
                <span className="text-sm font-medium text-dark-text">{job.title}</span>
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-gray-600">
                  {job.applicantsCount ?? job.applicationsCount ?? 0}
                </span>
              </td>
              <td className="py-4 px-6">
                <StatusPill status={job.status} />
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-gray-600">{formatDate(job.createdAt)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

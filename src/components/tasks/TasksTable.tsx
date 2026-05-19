import { useTranslation } from 'react-i18next';
import type { Task } from '../../types/task';
import TaskStatusPill from './TaskStatusPill';

interface TasksTableProps {
  tasks: Task[];
  isLoading?: boolean;
  onRowClick?: (task: Task) => void;
  onActionClick?: (task: Task) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function TasksTable({
  tasks,
  isLoading = false,
  onRowClick,
  onActionClick,
  page,
  pageSize,
  total,
  onPageChange,
}: TasksTableProps) {
  const { t, i18n } = useTranslation();

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(i18n.language || 'en', { month: 'short', day: 'numeric', year: 'numeric' });
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.table.title')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.table.candidate')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.table.job')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.table.due')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.table.status')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.table.assignedTo')}</th>
            <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onRowClick?.(task)}
            >
              <td className="py-4 px-6">
                <span className="text-sm font-medium text-dark-text">{task.title || t('tasks.untitled')}</span>
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-gray-600">{task.candidateName || '-'}</span>
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-gray-600">{task.jobTitle || '-'}</span>
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-gray-600">{formatDate(task.dueAt)}</span>
              </td>
              <td className="py-4 px-6">
                <TaskStatusPill status={task.status || t('tasks.kanban.todo')} />
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-gray-600">{task.assignedToName || '-'}</span>
              </td>
              <td className="py-4 px-6 text-right">
                <button
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onActionClick?.(task);
                  }}
                  aria-label={t('tasks.aria.actions')}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
        <p className="text-sm text-gray-600">
          {t('tasks.pagination.showing', {
            from: total === 0 ? 0 : (page - 1) * pageSize + 1,
            to: Math.min(page * pageSize, total),
            total,
          })}
        </p>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
          >
            {t('tasks.pagination.prev')}
          </button>
          <button
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
            onClick={() => onPageChange(page + 1)}
            disabled={page * pageSize >= total}
          >
            {t('tasks.pagination.next')}
          </button>
        </div>
      </div>
    </div>
  );
}


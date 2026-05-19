import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Task, TaskStatus } from '../../types/task';
import TaskStatusPill from './TaskStatusPill';
import userPlaceholder from '../../assets/user_placeholder.svg';

interface TasksListViewProps {
  tasks: Task[];
  isLoading?: boolean;
  onOpenDetails: (task: Task) => void;
  onUpdateStatus: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
}

function formatDate(dateString: string | null, locale: string) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString(locale || 'en', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateString;
  }
}

function shortId(id: string | number) {
  const s = String(id);
  return s.length > 10 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

export default function TasksListView({ tasks, isLoading = false, onOpenDetails, onUpdateStatus, onDelete }: TasksListViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  const rows = useMemo(() => tasks, [tasks]);

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
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.list.columns.title')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.list.columns.candidate')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.list.columns.job')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.list.columns.due')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.list.columns.status')}</th>
            <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.list.columns.created')}</th>
            <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">{t('tasks.list.columns.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((task) => (
            <tr
              key={task.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onOpenDetails(task)}
            >
              <td className="py-4 px-6">
                <span className="text-sm font-medium text-dark-text">{task.title || '-'}</span>
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <img
                    src={userPlaceholder}
                    alt=""
                    className="w-8 h-8 rounded-full border border-gray-200 object-cover flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">{task.candidateName || shortId(task.candidateId)}</span>
                </div>
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-gray-600">{task.jobTitle || shortId(task.jobId)}</span>
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-gray-600">{formatDate(task.dueAt, locale)}</span>
              </td>
              <td className="py-4 px-6">
                <TaskStatusPill status={task.status} />
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-gray-600">{formatDate(task.createdAt, locale)}</span>
              </td>
              <td className="py-4 px-6 text-right relative">
                <button
                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label={t('tasks.list.actions.menu')}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenFor((v) => (v === task.id ? null : task.id));
                  }}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
                  </svg>
                </button>

                {menuOpenFor === task.id && (
                  <div
                    className="absolute right-6 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        setMenuOpenFor(null);
                        onUpdateStatus(task, 'done');
                      }}
                    >
                      {t('tasks.list.actions.markDone')}
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-50"
                      onClick={() => {
                        setMenuOpenFor(null);
                        onDelete(task);
                      }}
                    >
                      {t('tasks.list.actions.delete')}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import TaskStatusPill from './TaskStatusPill';
import { tasksApi } from '../../api/tasksApi';
import type { Task } from '../../types/tasks';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';

function formatDate(dateString: string | null | undefined, locale: string) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString(locale || 'en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

interface TaskDetailDrawerProps {
  isOpen: boolean;
  taskId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
  onEdit?: (task: Task) => void;
}

export default function TaskDetailDrawer({ isOpen, taskId, onClose, onRefresh, onEdit }: TaskDetailDrawerProps) {
  const { t, i18n } = useTranslation();
  const backdropDismiss = useBackdropDismiss(onClose);
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const locale = i18n.language || 'en';

  useEffect(() => {
    if (!isOpen || !taskId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    tasksApi
      .getById(taskId)
      .then((res) => {
        if (!cancelled) setTask(res);
      })
      .catch((e) => {
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('tasks.errors.loadTask');
        if (!cancelled) setError(msg);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, taskId, t]);

  const title = useMemo(() => task?.title || t('tasks.untitled'), [task, t]);

  if (!isOpen) return null;

  const handleMarkDone = async () => {
    if (!taskId) return;
    setIsWorking(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await tasksApi.markDone(taskId);
      setTask(updated);
      setSuccess(t('tasks.drawer.markedDone'));
      onRefresh?.();
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('tasks.errors.markDone');
      setError(msg);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!taskId) return;
    const ok = window.confirm(t('tasks.drawer.confirmDelete'));
    if (!ok) return;
    setIsWorking(true);
    setError(null);
    try {
      await tasksApi.delete(taskId);
      onRefresh?.();
      onClose();
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('tasks.errors.delete');
      setError(msg);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" {...backdropDismiss} />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col border-l border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-dark-text truncate">{isLoading ? t('common.loading') : title}</h2>
            <p className="text-sm text-gray-600 truncate">{t('tasks.drawer.title')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.aria.closeDrawer')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <ErrorMessage message={error} />}
          {success && <SuccessMessage message={success} />}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : task ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('tasks.drawer.details')}</h3>
                <TaskStatusPill status={task.status || t('tasks.status.open')} />
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('tasks.fields.title')}</p>
                  <p className="text-sm text-dark-text">{task.title || t('tasks.untitled')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('tasks.fields.candidate')}</p>
                    <p className="text-sm text-dark-text">{task.candidateName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('tasks.fields.job')}</p>
                    <p className="text-sm text-dark-text">{task.jobTitle || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('tasks.fields.dueDate')}</p>
                    <p className="text-sm text-dark-text">{formatDate(task.dueAt, locale)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('tasks.fields.assignTo')}</p>
                    <p className="text-sm text-dark-text">{task.assignedToName || '-'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('tasks.fields.notes')}</p>
                  <p className="text-sm text-dark-text whitespace-pre-wrap">{task.notes || '-'}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t('tasks.drawer.metadata')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('tasks.drawer.created')}</p>
                    <p className="text-sm text-dark-text">{formatDate(task.createdAt, locale)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('tasks.drawer.updatedAt')}</p>
                    <p className="text-sm text-dark-text">{formatDate(task.updatedAt, locale)}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600">{t('tasks.drawer.selectTask')}</div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={handleDelete} disabled={!taskId || isWorking}>
            {t('common.actions.delete')}
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => task && onEdit?.(task)} disabled={!task || isWorking}>
              {t('common.actions.edit')}
            </Button>
            <Button variant="primary" onClick={handleMarkDone} disabled={!taskId || isWorking}>
              {t('tasks.drawer.markDone')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


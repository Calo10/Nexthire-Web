import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import TasksListView from '../components/tasks/TasksListView';
import TasksKanbanView from '../components/tasks/TasksKanbanView';
import NewTaskModal from '../components/tasks/NewTaskModal';
import SuccessMessage from '../components/SuccessMessage';
import type { Task, TaskStatus } from '../types/task';
import { deleteTask, isUnauthorized, listTasks, updateTaskStatus } from '../api/tasks';
import TaskDetailsModal from '../components/tasks/TaskDetailsModal';
import taskIcon from '../assets/task_icon.png';

export default function TasksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const shouldFetch = isAuthenticated && !authLoading;

  const [view, setView] = useState<'list' | 'kanban'>('list');

  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!shouldFetch) return;
    setIsLoading(true);
    setError(null);
    try {
      const items = await listTasks();
      setTasks(items);
    } catch (e) {
      if (isUnauthorized(e)) {
        setErrorToast(t('auth.sessionExpired'));
        setTimeout(() => navigate('/login', { replace: true }), 500);
        return;
      }
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('tasks.errors.loadTasks');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFetch]);

  const optimisticMove = async (taskId: string, newStatus: TaskStatus) => {
    const prev = tasks;
    setTasks((current) => current.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await updateTaskStatus(taskId, newStatus);
      setToast(t('tasks.toast.moved'));
      await load();
    } catch (e) {
      setTasks(prev);
      if (isUnauthorized(e)) {
        setErrorToast(t('auth.sessionExpired'));
        setTimeout(() => navigate('/login', { replace: true }), 500);
        return;
      }
      setErrorToast(t('tasks.toast.moveFailed'));
    }
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask(taskId);
    setToast(t('tasks.toast.deleted'));
    await load();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <TopBar />

      <div className="p-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-dark-text">{t('tasks.title')}</h1>
          <div className="flex items-center gap-3">
            {/* Segmented toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                {t('tasks.view.list')}
              </button>
              <button
                type="button"
                onClick={() => setView('kanban')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'kanban' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                {t('tasks.view.kanban')}
              </button>
            </div>

            <Button variant="primary" size="md" onClick={() => setIsNewTaskOpen(true)}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('tasks.newTask')}</span>
              </div>
            </Button>
          </div>
        </div>

        {toast && (
          <div className="mb-6">
            <SuccessMessage message={toast} />
          </div>
        )}

        {errorToast && (
          <div className="mb-6">
            <ErrorMessage message={errorToast} />
          </div>
        )}

        {/* Tasks Table Card */}
        <Card className="p-0 overflow-hidden">
          {error ? (
            <div className="p-6">
              <ErrorMessage message={error} />
            </div>
          ) : !isLoading && tasks.length === 0 ? (
            <div className="text-center py-16 px-6">
              <img
                src={taskIcon}
                alt={t('tasks.emptyState.alt')}
                className="w-48 max-w-full h-auto mx-auto mb-6"
              />
              <h3 className="text-2xl font-semibold text-dark-text mb-2">{t('tasks.emptyState.title')}</h3>
              <p className="text-sm text-gray-600 mb-8">{t('tasks.emptyState.subtitle')}</p>
              <Button variant="primary" onClick={() => setIsNewTaskOpen(true)}>
                {t('tasks.emptyState.cta')}
              </Button>
            </div>
          ) : (
            view === 'list' ? (
              <TasksListView
                tasks={tasks}
                isLoading={isLoading}
                onOpenDetails={(task) => {
                  setSelectedTask(task);
                  setIsDetailsOpen(true);
                }}
                onUpdateStatus={(task, newStatus) => optimisticMove(task.id, newStatus)}
                onDelete={(task) => {
                  const ok = window.confirm(t('tasks.details.confirmDelete'));
                  if (!ok) return;
                  handleDelete(task.id).catch((e) => {
                    if (isUnauthorized(e)) {
                      setErrorToast(t('auth.sessionExpired'));
                      setTimeout(() => navigate('/login', { replace: true }), 500);
                      return;
                    }
                    setErrorToast(t('tasks.errors.delete'));
                  });
                }}
              />
            ) : (
              <TasksKanbanView
                tasks={tasks}
                onMoveTask={(taskId, newStatus) => {
                  optimisticMove(taskId, newStatus).catch(() => {});
                }}
              />
            )
          )}
        </Card>
      </div>

      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onSuccess={() => load()}
      />

      <TaskDetailsModal
        isOpen={isDetailsOpen}
        task={selectedTask}
        onClose={() => setIsDetailsOpen(false)}
        onUpdateStatus={async (taskId, status) => optimisticMove(taskId, status)}
        onDelete={async (taskId) => handleDelete(taskId)}
      />
    </div>
  );
}


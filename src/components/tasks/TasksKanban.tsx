import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { coerceTaskStatus, TASK_STATUSES, type Task, type TaskStatus } from '../../types/task';
import TaskStatusPill from './TaskStatusPill';

function dueBadge(dueAt?: string | null): { label: string; className: string } | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const now = new Date();
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Overdue', className: 'bg-red-100 text-red-700' };
  if (diffDays === 0) return { label: 'Today', className: 'bg-amber-100 text-amber-700' };
  if (diffDays <= 7) return { label: `In ${diffDays}d`, className: 'bg-blue-100 text-blue-700' };
  return null;
}

interface TasksKanbanProps {
  tasks: Task[];
  isLoading?: boolean;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus, prevTasksSnapshot: Task[]) => Promise<void>;
}

export default function TasksKanban({ tasks, isLoading = false, onUpdateStatus }: TasksKanbanProps) {
  const { t } = useTranslation();
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as Task[]])) as Record<TaskStatus, Task[]>;
    for (const task of tasks) {
      const key = coerceTaskStatus(task.status);
      map[key].push(task);
    }
    return map;
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
        {TASK_STATUSES.map((c) => (
          <div key={c} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const handleDrop = async (col: TaskStatus) => {
    if (!dragTaskId) return;
    const prevSnapshot = [...tasks];
    const task = tasks.find((t) => t.id === dragTaskId);
    if (!task) return;
    if (coerceTaskStatus(task.status) === col) return;
    await onUpdateStatus(dragTaskId, col, prevSnapshot);
  };

  const colLabel = (col: TaskStatus) => {
    if (col === 'todo') return t('tasks.kanban.todo');
    if (col === 'in_progress') return t('tasks.kanban.inProgress');
    if (col === 'blocked') return t('tasks.kanban.blocked');
    return t('tasks.kanban.done');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
      {TASK_STATUSES.map((col) => (
        <div
          key={col}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 min-h-[500px]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault();
            await handleDrop(col);
            setDragTaskId(null);
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{colLabel(col)}</h3>
            <span className="text-xs text-gray-500">{byStatus[col].length}</span>
          </div>

          <div className="space-y-3">
            {byStatus[col].map((task) => {
              const badge = dueBadge(task.dueAt);
              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', task.id);
                    setDragTaskId(task.id);
                  }}
                  onDragEnd={() => setDragTaskId(null)}
                  className={`rounded-xl border border-gray-200 bg-white shadow-sm p-4 cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors ${
                    dragTaskId === task.id ? 'opacity-70' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-dark-text truncate">{task.title || t('tasks.untitled')}</p>
                      <p className="text-xs text-gray-600 mt-1 truncate">{task.candidateName || '-'}</p>
                    </div>
                    <TaskStatusPill status={task.status} />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {badge ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.className}`}>{badge.label}</span>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 truncate max-w-[120px]">{task.assignedToName || '-'}</span>
                      <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {(task.assignedToName || 'U').charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

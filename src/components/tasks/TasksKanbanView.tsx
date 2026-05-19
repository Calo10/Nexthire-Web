import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { coerceTaskStatus, type Task, type TaskStatus } from '../../types/task';
import TaskStatusPill from './TaskStatusPill';
import userPlaceholder from '../../assets/user_placeholder.svg';

type Column = { id: TaskStatus; titleKey: string };

const COLUMNS: Column[] = [
  { id: 'todo', titleKey: 'tasks.kanban.todo' },
  { id: 'in_progress', titleKey: 'tasks.kanban.inProgress' },
  { id: 'blocked', titleKey: 'tasks.kanban.blocked' },
  { id: 'done', titleKey: 'tasks.kanban.done' },
];

function formatDue(dueAt: string | null, locale: string) {
  if (!dueAt) return null;
  try {
    return new Date(dueAt).toLocaleDateString(locale || 'en', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dueAt;
  }
}

function TaskCardView({
  task,
  locale,
  isDragging = false,
  dndRef,
  dndStyle,
  dndAttributes,
  dndListeners,
}: {
  task: Task;
  locale: string;
  isDragging?: boolean;
  dndRef?: (node: HTMLElement | null) => void;
  dndStyle?: React.CSSProperties;
  dndAttributes?: Record<string, any>;
  dndListeners?: Record<string, any>;
}) {
  return (
    <div
      ref={dndRef}
      style={dndStyle}
      {...(dndAttributes || {})}
      {...(dndListeners || {})}
      className={`rounded-xl border border-gray-200 bg-white shadow-sm p-4 hover:bg-gray-50 transition-colors ${
        isDragging ? 'opacity-90 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dark-text leading-snug break-words">{task.title}</p>
          <div className="mt-2">
            <TaskStatusPill status={task.status} />
          </div>
          {task.candidateName ? <p className="mt-2 text-xs text-gray-600 truncate">{task.candidateName}</p> : null}
          {task.dueAt ? <p className="mt-2 text-xs text-gray-500">{formatDue(task.dueAt, locale)}</p> : null}
        </div>
        <img src={userPlaceholder} alt="" className="w-9 h-9 rounded-full border border-gray-200 object-cover flex-shrink-0" />
      </div>
    </div>
  );
}

function SortableTaskCard({ task, locale }: { task: Task; locale: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;
  return (
    <TaskCardView
      task={task}
      locale={locale}
      isDragging={isDragging}
      dndRef={setNodeRef as any}
      dndStyle={style}
      dndAttributes={attributes as any}
      dndListeners={listeners as any}
    />
  );
}

function DroppableColumn({
  columnId,
  title,
  count,
  children,
}: {
  columnId: TaskStatus;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  return (
    <div
      ref={setNodeRef}
      id={columnId}
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-4 min-h-[520px] transition-colors ${
        isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
        <span className="text-xs text-gray-500">{count}</span>
      </div>
      {children}
    </div>
  );
}

interface TasksKanbanViewProps {
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
}

export default function TasksKanbanView({ tasks, onMoveTask }: TasksKanbanViewProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], blocked: [], done: [] };
    for (const task of tasks) {
      const s = coerceTaskStatus((task as any).status);
      map[s].push(s === task.status ? task : { ...task, status: s });
    }
    return map;
  }, [tasks]);

  const findTask = (id: string) => tasks.find((t) => t.id === id);
  const findContainer = (taskId: string): TaskStatus | null => {
    const task = findTask(taskId);
    return task ? task.status : null;
  };

  const activeTask = useMemo(() => (activeId ? findTask(activeId) || null : null), [activeId, tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const from = findContainer(activeId);
    // If dropped over a column, over.id is the column id; if dropped over a task, infer its container.
    const to: TaskStatus | null = (COLUMNS.map((c) => c.id) as string[]).includes(overId)
      ? (overId as TaskStatus)
      : findContainer(overId);

    if (!from || !to || from === to) return;
    onMoveTask(activeId, to);
  };

  return (
    <div className="p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {COLUMNS.map((col) => (
            <DroppableColumn
              key={col.id}
              columnId={col.id}
              title={t(col.titleKey)}
              count={byStatus[col.id].length}
            >
              <SortableContext items={byStatus[col.id].map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 min-h-[440px]">
                  {byStatus[col.id].map((task) => (
                    <SortableTaskCard key={task.id} task={task} locale={locale} />
                  ))}
                </div>
              </SortableContext>
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[320px] cursor-grabbing">
              <TaskCardView task={activeTask} locale={locale} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}


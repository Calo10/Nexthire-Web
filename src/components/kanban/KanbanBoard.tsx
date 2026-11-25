import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export interface KanbanBoardColumn<T extends { id: string }> {
  id: string;
  title: string;
  items: T[];
}

export interface KanbanBoardProps<T extends { id: string }> {
  columns: KanbanBoardColumn<T>[];
  /**
   * Renders one card. The returned element is expected to register itself with dnd-kit
   * (`useSortable({ id: item.id })`) so it can be dragged between columns.
   */
  renderCard: (item: T, ctx: { isSelected: boolean; dragDisabled: boolean }) => ReactNode;
  /** Visual clone rendered under the pointer while dragging. */
  renderOverlay: (item: T) => ReactNode;
  /** Called when an item is dropped on a different column. */
  onMove: (itemId: string, toColumnId: string) => void;
  selectedId?: string | null;
  /** Disables dragging (read-only sessions / missing permissions). */
  dragDisabled?: boolean;
  /** Fired when a drag starts (e.g. to close open card menus). */
  onDragStart?: () => void;
  /** Fired after a successful cross-column drop was reported through `onMove`. */
  onMoved?: (toColumnId: string) => void;
  /** Optional per-column placeholder when it has no items. */
  emptyLabel?: ReactNode;
}

function ColumnShell({
  columnId,
  title,
  count,
  children,
}: {
  columnId: string;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  return (
    <div
      ref={setNodeRef}
      id={columnId}
      className={`w-[320px] shrink-0 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 p-4 h-full min-h-0 flex flex-col transition-colors ${
        isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{count}</span>
      </div>
      <div className="pipeline-column-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide pr-1">
        {children}
      </div>
    </div>
  );
}

/**
 * Generic horizontal Kanban shell (columns, drag-and-drop, wheel scrolling).
 * Shared by the Recruitment pipeline (`PipelineBoard`) and Core HR onboarding.
 */
export default function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  renderOverlay,
  onMove,
  selectedId = null,
  dragDisabled = false,
  onDragStart,
  onMoved,
  emptyLabel,
}: KanbanBoardProps<T>) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: dragDisabled ? 99999 : 6 } }));
  const [activeId, setActiveId] = useState<string | null>(null);

  const columnIds = useMemo(() => new Set(columns.map((c) => c.id)), [columns]);
  const itemToColumn = useMemo(() => {
    const map = new Map<string, string>();
    for (const col of columns) for (const item of col.items) map.set(item.id, col.id);
    return map;
  }, [columns]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse wheel scrolls horizontally when columns overflow (trackpad already works natively).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth + 1) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      let node = e.target as HTMLElement | null;
      while (node && node !== el) {
        if (node.classList.contains('pipeline-column-scroll')) {
          const { scrollTop, scrollHeight, clientHeight } = node;
          const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
          const canScrollUp = scrollTop > 0;
          if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) {
            return;
          }
          break;
        }
        node = node.parentElement;
      }

      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [columns.length]);

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    for (const col of columns) {
      const found = col.items.find((i) => i.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    onDragStart?.();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (dragDisabled || !over) return;
    const draggedId = String(active.id);
    const overId = String(over.id);
    const fromColumn = itemToColumn.get(draggedId);
    const toColumn = columnIds.has(overId) ? overId : itemToColumn.get(overId);
    if (!fromColumn || !toColumn || fromColumn === toColumn) return;
    onMove(draggedId, toColumn);
    onMoved?.(toColumn);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div
          ref={containerRef}
          className="flex h-full min-h-0 gap-6 overflow-x-auto overflow-y-hidden px-6 pb-4 mt-[25px] scrollbar-hide"
        >
          {columns.map((col) => (
            <ColumnShell key={col.id} columnId={col.id} title={col.title} count={col.items.length}>
              <SortableContext items={col.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {col.items.map((item) => (
                    <Fragment key={item.id}>
                      {renderCard(item, { isSelected: selectedId === item.id, dragDisabled })}
                    </Fragment>
                  ))}
                  {col.items.length === 0 && emptyLabel ? (
                    <p className="rounded-xl border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-400">
                      {emptyLabel}
                    </p>
                  ) : null}
                </div>
              </SortableContext>
            </ColumnShell>
          ))}
        </div>

        <DragOverlay>
          {activeItem ? <div className="w-[320px] cursor-grabbing">{renderOverlay(activeItem)}</div> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

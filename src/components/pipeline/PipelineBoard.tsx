import { useEffect, useMemo, useRef, useState } from 'react';
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
import type { KanbanColumn } from '../../types/applications';
import PipelineCard, { PipelineCardView } from './PipelineCard';

function ColumnShell({
  stageId,
  title,
  count,
  children,
}: {
  stageId: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  return (
    <div
      ref={setNodeRef}
      id={stageId}
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

export default function PipelineBoard({
  columns,
  locale,
  selectedApplicationId,
  onSelectCard,
  onMove,
  onCardAddNote,
  onCardSendMessage,
  onStageTabSelect,
}: {
  columns: KanbanColumn[];
  locale: string;
  selectedApplicationId: string | null;
  onSelectCard: (applicationId: string) => void;
  onMove: (applicationId: string, toStageId: string) => void;
  onCardAddNote?: (applicationId: string) => void;
  onCardSendMessage?: (applicationId: string) => void;
  onStageTabSelect?: (stageId: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const stageIds = useMemo(() => new Set(columns.map((c) => c.stageId)), [columns]);
  const appToStage = useMemo(() => {
    const map = new Map<string, string>();
    for (const col of columns) for (const item of col.items) map.set(item.id, col.stageId);
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

  const activeCard = useMemo(() => {
    if (!activeId) return null;
    for (const col of columns) {
      const found = col.items.find((i) => i.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setOpenMenuId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const fromStage = appToStage.get(activeId);
    const toStage = stageIds.has(overId) ? overId : appToStage.get(overId);
    if (!fromStage || !toStage || fromStage === toStage) return;
    onMove(activeId, toStage);
    onStageTabSelect?.(toStage);
  };

  // Click-away: if any menu is open and user clicks elsewhere, close it.
  useEffect(() => {
    if (!openMenuId) return;
    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Ignore clicks inside the menu or on its button.
      if (target.closest('[data-pipeline-card-menu="true"]')) return;
      if (target.closest('[data-pipeline-card-menu-button="true"]')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => document.removeEventListener('pointerdown', onPointerDownCapture, true);
  }, [openMenuId]);

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
            <ColumnShell key={col.stageId} stageId={col.stageId} title={col.stageName} count={col.items.length}>
              <SortableContext items={col.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {col.items.map((card) => (
                    <PipelineCard
                      key={card.id}
                      card={card}
                      locale={locale}
                      isSelected={selectedApplicationId === card.id}
                      menuOpen={openMenuId === card.id}
                      onToggleMenu={() => setOpenMenuId((prev) => (prev === card.id ? null : card.id))}
                      onCloseMenu={() => setOpenMenuId(null)}
                      onClick={() => {
                        setOpenMenuId(null);
                        onSelectCard(card.id);
                      }}
                      onAddNote={() => {
                        setOpenMenuId(null);
                        onCardAddNote?.(card.id);
                      }}
                      onSendMessage={() => {
                        setOpenMenuId(null);
                        onCardSendMessage?.(card.id);
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </ColumnShell>
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="w-[320px] cursor-grabbing">
              <PipelineCardView card={activeCard} locale={locale} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}


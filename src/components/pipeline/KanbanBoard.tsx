import { useMemo } from 'react';
import { DndContext, DragEndEvent, PointerSensor, closestCorners, useSensor, useSensors } from '@dnd-kit/core';
import type { KanbanColumn as KanbanColumnType } from '../../types/applications';
import KanbanColumn from './KanbanColumn';

export default function KanbanBoard({
  columns,
  locale,
  onMove,
}: {
  columns: KanbanColumnType[];
  locale: string;
  onMove: (applicationId: string, toStageId: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const appToStage = useMemo(() => {
    const map = new Map<string, string>();
    for (const col of columns) {
      for (const item of col.items) map.set(item.id, col.stageId);
    }
    return map;
  }, [columns]);

  const stageIds = useMemo(() => new Set(columns.map((c) => c.stageId)), [columns]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const fromStage = appToStage.get(activeId);
    const toStage = stageIds.has(overId) ? overId : appToStage.get(overId);
    if (!fromStage || !toStage || fromStage === toStage) return;
    onMove(activeId, toStage);
  };

  return (
    <div className="p-6">
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {columns.map((col) => (
            <KanbanColumn key={col.stageId} column={col} locale={locale} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}


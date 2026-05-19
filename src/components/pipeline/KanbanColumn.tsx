import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { KanbanColumn as KanbanColumnType } from '../../types/applications';
import ApplicationCard from './ApplicationCard';

export default function KanbanColumn({
  column,
  locale,
}: {
  column: KanbanColumnType;
  locale: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.stageId });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-4 min-h-[520px] transition-colors ${
        isOver ? 'ring-2 ring-primary/40 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{column.stageName}</h3>
        <span className="text-xs text-gray-500">{column.items.length}</span>
      </div>

      <SortableContext items={column.items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[440px]">
          {column.items.map((card) => (
            <ApplicationCard key={card.id} card={card} locale={locale} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}


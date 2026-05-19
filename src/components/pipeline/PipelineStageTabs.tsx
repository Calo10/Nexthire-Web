import { useMemo } from 'react';
import type { KanbanStage, KanbanColumn } from '../../types/applications';

function hasNewItems(column: KanbanColumn): boolean {
  // "new" heuristic: any item created within last 24h
  const now = Date.now();
  return column.items.some((it) => {
    if (!it.createdAt) return false;
    const t = new Date(it.createdAt).getTime();
    if (Number.isNaN(t)) return false;
    return now - t < 24 * 60 * 60 * 1000;
  });
}

export default function PipelineStageTabs({
  stages,
  columns,
  selectedStageId,
  onSelect,
}: {
  stages: KanbanStage[];
  columns: KanbanColumn[];
  selectedStageId: string | null;
  onSelect: (stageId: string) => void;
}) {
  const columnByStage = useMemo(() => {
    const map = new Map<string, KanbanColumn>();
    for (const c of columns) map.set(c.stageId, c);
    return map;
  }, [columns]);

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {stages.map((s) => {
        const active = selectedStageId ? selectedStageId === s.id : false;
        const col = columnByStage.get(s.id);
        const isNew = col ? hasNewItems(col) : false;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
              active
                ? 'bg-white text-primary border-primary/30 shadow-sm'
                : 'bg-white/60 text-gray-700 border-gray-200 hover:bg-white'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-primary' : 'bg-gray-300'}`} />
            <span>{s.name}</span>
            {isNew ? <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}


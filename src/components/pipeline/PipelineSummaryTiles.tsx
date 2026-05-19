import { useMemo } from 'react';
import type { KanbanStage, KanbanColumn } from '../../types/applications';

function getCountByStage(columns: KanbanColumn[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const c of columns) map[c.stageId] = c.items.length;
  return map;
}

export default function PipelineSummaryTiles({
  stages,
  columns,
}: {
  stages: KanbanStage[];
  columns: KanbanColumn[];
}) {
  const countByStage = useMemo(() => getCountByStage(columns), [columns]);
  const topStages = useMemo(() => stages.slice(0, 4), [stages]);
  const total = useMemo(() => topStages.reduce((sum, s) => sum + (countByStage[s.id] || 0), 0), [topStages, countByStage]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {topStages.map((s) => {
        const count = countByStage[s.id] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div
            key={s.id}
            className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-md shadow-sm p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-dark-text">{s.name}</p>
              <p className="text-sm font-semibold text-gray-700">{count}</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">{total ? `${pct}%` : '—'}</p>
          </div>
        );
      })}
    </div>
  );
}


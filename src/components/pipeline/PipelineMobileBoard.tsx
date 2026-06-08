import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { KanbanColumn, KanbanStage } from '../../types/applications';
import PipelineStageTabs from './PipelineStageTabs';
import { PipelineCardView } from './PipelineCard';

export default function PipelineMobileBoard({
  stages,
  columns,
  locale,
  selectedApplicationId,
  onSelectCard,
  onMove,
  onCardAddNote,
  onCardSendMessage,
}: {
  stages: KanbanStage[];
  columns: KanbanColumn[];
  locale: string;
  selectedApplicationId: string | null;
  onSelectCard: (applicationId: string) => void;
  onMove: (applicationId: string, toStageId: string) => void;
  onCardAddNote?: (applicationId: string) => void;
  onCardSendMessage?: (applicationId: string) => void;
}) {
  const { t } = useTranslation();
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [moveOpenForId, setMoveOpenForId] = useState<string | null>(null);

  useEffect(() => {
    if (!stages.length) return;
    if (!selectedStageId || !stages.some((s) => s.id === selectedStageId)) {
      setSelectedStageId(stages[0].id);
    }
  }, [stages, selectedStageId]);

  const activeColumn = useMemo(
    () => columns.find((c) => c.stageId === selectedStageId) || null,
    [columns, selectedStageId],
  );

  useEffect(() => {
    if (!openMenuId) return;
    const onPointerDownCapture = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-pipeline-card-menu="true"]')) return;
      if (target.closest('[data-pipeline-card-menu-button="true"]')) return;
      setOpenMenuId(null);
    };
    document.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => document.removeEventListener('pointerdown', onPointerDownCapture, true);
  }, [openMenuId]);

  const otherStages = useMemo(
    () => stages.filter((s) => s.id !== selectedStageId),
    [stages, selectedStageId],
  );

  return (
    <div>
      <PipelineStageTabs
        stages={stages}
        columns={columns}
        selectedStageId={selectedStageId}
        onSelect={(id) => {
          setSelectedStageId(id);
          setMoveOpenForId(null);
        }}
      />

      <div className="mt-4 space-y-4">
        {!activeColumn || activeColumn.items.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-xl border border-gray-200 text-sm text-gray-500">
            {t('pipeline.mobile.emptyStage')}
          </div>
        ) : (
          activeColumn.items.map((card) => (
            <div key={card.id} className="space-y-2">
              <PipelineCardView
                card={card}
                locale={locale}
                isSelected={selectedApplicationId === card.id}
                showActionsAlways
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

              {otherStages.length > 0 ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setMoveOpenForId((prev) => (prev === card.id ? null : card.id))}
                    className="text-xs font-medium text-primary px-1 py-1"
                  >
                    {t('pipeline.mobile.moveTo')}
                  </button>
                  {moveOpenForId === card.id ? (
                    <div className="flex gap-2 overflow-x-auto pb-1 mt-1">
                      {otherStages.map((stage) => (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => {
                            setMoveOpenForId(null);
                            onMove(card.id, stage.id);
                            setSelectedStageId(stage.id);
                          }}
                          className="shrink-0 px-3 py-2 rounded-full text-xs font-medium border bg-white text-gray-700 border-gray-300 active:bg-primary/10 active:border-primary/30"
                        >
                          {stage.name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

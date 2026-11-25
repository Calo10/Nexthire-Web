import { useEffect, useMemo, useState } from 'react';
import type { KanbanApplicationCard, KanbanColumn } from '../../types/applications';
import KanbanBoard from '../kanban/KanbanBoard';
import PipelineCard, { PipelineCardView } from './PipelineCard';
import { useAccess } from '../../contexts/AccessContext';

/**
 * Recruitment pipeline board. Thin adapter over the shared `KanbanBoard` shell that adds
 * the application card, its action menu and the stage-tab sync.
 */
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
  const { readOnly } = useAccess();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const boardColumns = useMemo(
    () => columns.map((c) => ({ id: c.stageId, title: c.stageName, items: c.items })),
    [columns],
  );

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
    <KanbanBoard<KanbanApplicationCard>
      columns={boardColumns}
      selectedId={selectedApplicationId}
      dragDisabled={readOnly}
      onMove={onMove}
      onMoved={onStageTabSelect}
      onDragStart={() => setOpenMenuId(null)}
      renderCard={(card, { isSelected, dragDisabled }) => (
        <PipelineCard
          card={card}
          locale={locale}
          isSelected={isSelected}
          menuOpen={openMenuId === card.id}
          onToggleMenu={() => setOpenMenuId((prev) => (prev === card.id ? null : card.id))}
          onCloseMenu={() => setOpenMenuId(null)}
          dragDisabled={dragDisabled}
          onClick={() => {
            setOpenMenuId(null);
            onSelectCard(card.id);
          }}
          onAddNote={
            readOnly
              ? undefined
              : () => {
                  setOpenMenuId(null);
                  onCardAddNote?.(card.id);
                }
          }
          onSendMessage={
            readOnly
              ? undefined
              : () => {
                  setOpenMenuId(null);
                  onCardSendMessage?.(card.id);
                }
          }
        />
      )}
      renderOverlay={(card) => <PipelineCardView card={card} locale={locale} isDragging />}
    />
  );
}

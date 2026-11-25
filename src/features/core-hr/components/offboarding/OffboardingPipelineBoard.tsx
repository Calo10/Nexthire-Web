import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import KanbanBoard from '../../../../components/kanban/KanbanBoard';
import type { OffboardingPipelineCard, OffboardingPipelineColumn } from '../../models/offboarding';
import OffboardingKanbanCard, { OffboardingKanbanCardView } from './OffboardingKanbanCard';

type Props = {
  columns: OffboardingPipelineColumn[];
  locale: string;
  selectedId: string | null;
  dragDisabled: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, toStatus: string) => void;
};

/** Offboarding Kanban: one column per pipeline status, built on the shared `KanbanBoard` shell. */
export default function OffboardingPipelineBoard({ columns, locale, selectedId, dragDisabled, onSelect, onMove }: Props) {
  const { t } = useTranslation();
  const boardColumns = useMemo(
    () =>
      columns.map((c) => ({
        id: c.status,
        title: t(`coreHr.offboarding.status.${c.status}`, { defaultValue: c.label }),
        items: c.cards,
      })),
    [columns, t],
  );

  return (
    <KanbanBoard<OffboardingPipelineCard>
      columns={boardColumns}
      selectedId={selectedId}
      dragDisabled={dragDisabled}
      onMove={onMove}
      emptyLabel={t('coreHr.offboarding.pipeline.emptyColumn')}
      renderCard={(card, { isSelected, dragDisabled: disabled }) => (
        <OffboardingKanbanCard
          card={card}
          locale={locale}
          isSelected={isSelected}
          dragDisabled={disabled}
          onClick={() => onSelect(card.id)}
        />
      )}
      renderOverlay={(card) => <OffboardingKanbanCardView card={card} locale={locale} isDragging />}
    />
  );
}

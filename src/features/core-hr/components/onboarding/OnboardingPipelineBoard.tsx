import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import KanbanBoard from '../../../../components/kanban/KanbanBoard';
import type { OnboardingPipelineCard, OnboardingPipelineColumn } from '../../models/onboarding';
import OnboardingKanbanCard, { OnboardingKanbanCardView } from './OnboardingKanbanCard';

type Props = {
  columns: OnboardingPipelineColumn[];
  locale: string;
  selectedId: string | null;
  dragDisabled: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, toStatus: string) => void;
};

/** Onboarding Kanban: one column per pipeline status, built on the shared `KanbanBoard` shell. */
export default function OnboardingPipelineBoard({ columns, locale, selectedId, dragDisabled, onSelect, onMove }: Props) {
  const { t } = useTranslation();
  const boardColumns = useMemo(
    () =>
      columns.map((c) => ({
        id: c.status,
        title: t(`coreHr.onboarding.status.${c.status}`, { defaultValue: c.label }),
        items: c.cards,
      })),
    [columns, t],
  );

  return (
    <KanbanBoard<OnboardingPipelineCard>
      columns={boardColumns}
      selectedId={selectedId}
      dragDisabled={dragDisabled}
      onMove={onMove}
      emptyLabel={t('coreHr.onboarding.pipeline.emptyColumn')}
      renderCard={(card, { isSelected, dragDisabled: disabled }) => (
        <OnboardingKanbanCard
          card={card}
          locale={locale}
          isSelected={isSelected}
          dragDisabled={disabled}
          onClick={() => onSelect(card.id)}
        />
      )}
      renderOverlay={(card) => <OnboardingKanbanCardView card={card} locale={locale} isDragging />}
    />
  );
}

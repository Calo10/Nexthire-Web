import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import EmployeeAvatar from '../EmployeeAvatar';
import type { OffboardingPipelineCard } from '../../models/offboarding';
import { formatDate } from '../../utils/employeeFormat';
import OffboardingProgressBar from './OffboardingProgressBar';

type ViewProps = {
  card: OffboardingPipelineCard;
  locale: string;
  isSelected?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
  dndAttributes?: Record<string, unknown>;
  dndListeners?: Record<string, unknown>;
  dndRef?: (node: HTMLElement | null) => void;
  dndStyle?: React.CSSProperties;
};

export function OffboardingKanbanCardView({
  card,
  locale,
  isSelected = false,
  isDragging = false,
  onClick,
  dndAttributes,
  dndListeners,
  dndRef,
  dndStyle,
}: ViewProps) {
  const { t } = useTranslation();
  const overdue = card.overdueCount > 0;
  return (
    <div
      ref={dndRef}
      style={dndStyle}
      {...(dndAttributes || {})}
      {...(dndListeners || {})}
      onClick={onClick}
      className={`group relative cursor-pointer rounded-2xl border bg-white/90 p-4 shadow-sm backdrop-blur-sm transition-colors hover:bg-white ${
        isDragging ? 'opacity-90 shadow-lg' : ''
      } ${isSelected ? 'border-primary/40 ring-2 ring-primary/20' : overdue ? 'border-red-200' : 'border-gray-200'}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <EmployeeAvatar name={card.employeeName || '?'} seed={card.employeeId} url={card.avatarUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-snug text-dark-text">{card.employeeName || '—'}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">{card.jobTitle || '—'}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-gray-500">
        <span>
          {t('coreHr.offboarding.card.lastDay')}: {formatDate(card.lastWorkingDay, locale)}
        </span>
        {overdue ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('coreHr.offboarding.card.overdue', { count: card.overdueCount })}
          </span>
        ) : null}
      </div>

      {card.separationType ? (
        <p className="mt-2 truncate text-xs text-gray-500">
          {t(`coreHr.offboarding.separationType.${card.separationType}`, { defaultValue: card.separationType })}
        </p>
      ) : null}
      {card.pendingAssets > 0 || card.pendingAccessItems > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
          {card.pendingAssets > 0 ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
              {t('coreHr.offboarding.card.pendingAssets', { count: card.pendingAssets })}
            </span>
          ) : null}
          {card.pendingAccessItems > 0 ? (
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-800">
              {t('coreHr.offboarding.card.pendingAccess', { count: card.pendingAccessItems })}
            </span>
          ) : null}
        </div>
      ) : null}

      <OffboardingProgressBar percent={card.progressPercent} className="mt-3" />
    </div>
  );
}

export default function OffboardingKanbanCard({
  card,
  locale,
  isSelected,
  dragDisabled,
  onClick,
}: {
  card: OffboardingPipelineCard;
  locale: string;
  isSelected: boolean;
  dragDisabled: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: dragDisabled,
  });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;
  return (
    <OffboardingKanbanCardView
      card={card}
      locale={locale}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      dndRef={setNodeRef as (node: HTMLElement | null) => void}
      dndStyle={style}
      dndAttributes={attributes as unknown as Record<string, unknown>}
      dndListeners={listeners as unknown as Record<string, unknown>}
    />
  );
}

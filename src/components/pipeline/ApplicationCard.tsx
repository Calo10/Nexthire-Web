import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanApplicationCard } from '../../types/applications';
import userPlaceholder from '../../assets/user_placeholder.svg';

function formatDate(dateString: string | null | undefined, locale: string) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString(locale || 'en', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(dateString);
  }
}

function StatusPill({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase();
  const color = (() => {
    if (normalized.includes('hired') || normalized.includes('done')) return 'bg-green-100 text-green-700';
    if (normalized.includes('interview') || normalized.includes('in progress') || normalized.includes('in_progress')) return 'bg-orange-100 text-orange-700';
    if (normalized.includes('applied') || normalized.includes('open') || normalized.includes('new')) return 'bg-yellow-100 text-yellow-700';
    if (normalized.includes('rejected') || normalized.includes('blocked')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  })();
  const label = status
    ? status
        .replace(/_/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
    : '';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}

export default function ApplicationCard({ card, locale }: { card: KanbanApplicationCard; locale: string }) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`rounded-xl border border-gray-200 bg-white shadow-sm p-4 hover:bg-gray-50 transition-colors ${
        isDragging ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dark-text leading-snug break-words">
            {card.candidateName || t('candidates.unknown')}
          </p>
          <p className="mt-1 text-xs text-gray-600 truncate">{card.jobTitle || ''}</p>
          {card.status ? (
            <div className="mt-2">
              <StatusPill status={card.status} />
            </div>
          ) : null}
          {card.createdAt ? <p className="mt-2 text-xs text-gray-500">{formatDate(card.createdAt, locale)}</p> : null}
        </div>
        <img src={userPlaceholder} alt="" className="w-9 h-9 rounded-full border border-gray-200 object-cover flex-shrink-0" />
      </div>
    </div>
  );
}


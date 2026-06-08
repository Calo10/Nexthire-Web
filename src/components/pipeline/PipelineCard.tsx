import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanApplicationCard } from '../../types/applications';
import userPlaceholder from '../../assets/user_placeholder.svg';
import { useTranslation } from 'react-i18next';

function titleCase(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  return s
    .replace(/_/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatDate(dateString: string | null | undefined, locale: string) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString(locale || 'en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}

function Chip({
  label,
  variant,
  className = '',
}: {
  label: string;
  variant: 'neutral' | 'good' | 'warn' | 'bad';
  className?: string;
}) {
  const color =
    variant === 'good'
      ? 'bg-green-100 text-green-700'
      : variant === 'warn'
      ? 'bg-amber-100 text-amber-700'
      : variant === 'bad'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}

export function PipelineCardView({
  card,
  locale,
  isSelected = false,
  isDragging = false,
  showActionsAlways = false,
  onClick,
  onAddNote,
  onSendMessage,
  menuOpen = false,
  onToggleMenu,
  onCloseMenu,
  dndAttributes,
  dndListeners,
  dndRef,
  dndStyle,
}: {
  card: KanbanApplicationCard;
  locale: string;
  isSelected?: boolean;
  isDragging?: boolean;
  showActionsAlways?: boolean;
  onClick?: () => void;
  onAddNote?: () => void;
  onSendMessage?: () => void;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
  dndAttributes?: Record<string, any>;
  dndListeners?: Record<string, any>;
  dndRef?: (node: HTMLElement | null) => void;
  dndStyle?: React.CSSProperties;
}) {
  const { t } = useTranslation();
  const isRejected = (card.status || '').toLowerCase().includes('reject');

  const chips = useMemo(() => {
    const out: Array<{ label: string; variant: 'neutral' | 'good' | 'warn' | 'bad' }> = [];

    if (card.createdAt) {
      const ts = new Date(card.createdAt).getTime();
      if (!Number.isNaN(ts) && Date.now() - ts < 24 * 60 * 60 * 1000) out.push({ label: 'New', variant: 'neutral' });
    }

    return out.slice(0, 3);
  }, [card.createdAt, card.status]);

  return (
    <div
      ref={dndRef}
      style={dndStyle}
      {...(dndAttributes || {})}
      {...(dndListeners || {})}
      onClick={onClick}
      className={`group rounded-2xl border backdrop-blur-sm shadow-sm p-4 transition-colors cursor-pointer ${
        isDragging ? 'opacity-90 shadow-lg' : ''
      } ${
        isSelected ? 'border-primary/40 ring-2 ring-primary/20' : isRejected ? 'border-red-200' : 'border-gray-200'
      } ${
        isRejected
          ? 'bg-gradient-to-b from-red-50 via-white to-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(16,24,40,0.06)] hover:from-red-50 hover:to-red-50'
          : 'bg-white/90 hover:bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <img src={userPlaceholder} alt="" className="w-9 h-9 rounded-full border border-gray-200 object-cover flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-dark-text leading-snug truncate">{card.candidateName || '—'}</p>
            <p className="mt-0.5 text-xs text-gray-600 truncate">{card.jobTitle || ''}</p>
          </div>
        </div>

        {onAddNote || onSendMessage ? (
          <div
            className="relative"
            data-pipeline-card-menu="true"
            onPointerDown={(e) => {
              // Don't let card click / board click-away close.
              e.stopPropagation();
            }}
            onClick={(e) => {
              // Prevent card selection when interacting with menu.
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              className={`w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-opacity ${
                showActionsAlways ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              aria-label={t('pipeline.inspector.menu.aria')}
              data-pipeline-card-menu-button="true"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleMenu?.();
              }}
              onClick={(e) => {
                // Click event still bubbles even if pointerdown stopped.
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
              </svg>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCloseMenu?.();
                    onAddNote?.();
                  }}
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('pipeline.inspector.menu.addNote')}
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCloseMenu?.();
                    onSendMessage?.();
                  }}
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.84L3 20l1.2-3.6A7.3 7.3 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {t('pipeline.inspector.menu.sendMessage')}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center flex-wrap gap-2">
        {chips.map((c) => (
          <Chip key={c.label} label={c.label} variant={c.variant} />
        ))}
        {card.status ? <Chip label={titleCase(card.status)} variant={isRejected ? 'bad' : 'neutral'} /> : null}
      </div>

      <div className="mt-3 text-xs text-gray-500">{formatDate(card.createdAt, locale)}</div>
    </div>
  );
}

export default function PipelineCard({
  card,
  locale,
  onClick,
  onAddNote,
  onSendMessage,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  isSelected = false,
}: {
  card: KanbanApplicationCard;
  locale: string;
  onClick: () => void;
  onAddNote?: () => void;
  onSendMessage?: () => void;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
  isSelected?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;
  return (
    <PipelineCardView
      card={card}
      locale={locale}
      isSelected={isSelected}
      isDragging={isDragging}
      onClick={onClick}
      onAddNote={onAddNote}
      onSendMessage={onSendMessage}
      menuOpen={menuOpen}
      onToggleMenu={onToggleMenu}
      onCloseMenu={onCloseMenu}
      dndRef={setNodeRef as any}
      dndStyle={style}
      dndAttributes={attributes as any}
      dndListeners={listeners as any}
    />
  );
}


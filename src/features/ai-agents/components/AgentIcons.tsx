import type { ReactNode } from 'react';
import type { AgentStatKind, AgentToolKind } from '../models/agentCatalog';

type IconProps = {
  className?: string;
};

function Svg({ className = 'w-4 h-4', children }: IconProps & { children: ReactNode }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      {children}
    </svg>
  );
}

const stroke = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.75 };

export function AgentToolIcon({ kind, className = 'w-4 h-4' }: { kind: AgentToolKind } & IconProps) {
  switch (kind) {
    case 'crm':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#64748B" aria-hidden>
          <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
        </svg>
      );
    case 'lists':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="4" fill="#7C3AED" />
          <path stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case 'email':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="2" y="4" width="20" height="16" rx="3" fill="#0077E6" />
          <path stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" d="M4 7l8 6 8-6" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#25D366" />
          <path
            fill="#fff"
            d="M16.8 13.9c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1-.2.2-.6.7-.7.8-.1.1-.3.2-.5.1-.2-.1-.9-.3-1.7-1.1-.6-.6-1.1-1.3-1.2-1.5-.1-.2 0-.3.1-.4.1-.1.2-.3.3-.4.1-.1.1-.2.2-.4 0-.1 0-.3 0-.4 0-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.6.2 1.1.1 1.5.1.5 0 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1 0-.2-.1-.4-.2z"
          />
        </svg>
      );
    case 'meta':
      return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden>
          <rect width="24" height="24" rx="6" fill="#0866FF" />
          <path
            fill="#fff"
            d="M12.8 17.2c-1.7 0-2.9-.8-3.7-2.3-.6 1.1-1.5 2.3-3.1 2.3-1.7 0-2.5-1.2-2.5-3.1 0-2.8 1.9-5.3 4.3-5.3 1.1 0 2 .4 2.7 1.3l.5-.9h1.8v7.5c0 1.3.4 1.8 1.4 1.8.8 0 1.5-.4 2.1-1.1.5-.6.9-1.5 1.1-2.5h1.7c-.4 2.2-1.8 4.3-4.8 4.3zm-5.7-2.1c.7 0 1.3-.8 1.8-1.9V9.7c-.5-.6-1.1-.9-1.9-.9-1.5 0-2.7 1.7-2.7 3.7 0 1.2.5 1.6 1.3 1.6.5 0 1-.3 1.5-.9z"
          />
        </svg>
      );
    case 'jobs':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="7" width="18" height="13" rx="2" fill="#0F766E" />
          <path stroke="#fff" strokeWidth="1.7" strokeLinecap="round" d="M8 7V5.5A1.5 1.5 0 019.5 4h5A1.5 1.5 0 0116 5.5V7M3 12h18" />
        </svg>
      );
    case 'templates':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="3" width="16" height="18" rx="2" fill="#7C3AED" />
          <path stroke="#fff" strokeWidth="1.7" strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      );
    case 'workflows':
      return <PuzzleIcon className={className} />;
    case 'pipeline':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#0077E6" aria-hidden>
          <rect x="3" y="4" width="5" height="16" rx="1.5" />
          <rect x="9.5" y="8" width="5" height="12" rx="1.5" />
          <rect x="16" y="11" width="5" height="9" rx="1.5" />
        </svg>
      );
    case 'calendly':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="3" fill="#006BFF" />
          <path stroke="#fff" strokeWidth="1.7" strokeLinecap="round" d="M8 3v4M16 3v4M7 12h10M7 16h6" />
        </svg>
      );
  }
}

export function AgentStatIcon({ kind, className }: { kind: AgentStatKind } & IconProps) {
  switch (kind) {
    case 'search':
      return (
        <Svg className={className}>
          <path {...stroke} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </Svg>
      );
    case 'users':
      return (
        <Svg className={className}>
          <path {...stroke} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </Svg>
      );
    case 'list':
      return (
        <Svg className={className}>
          <path {...stroke} d="M8 7h12M8 12h12M8 17h8M4 7h.01M4 12h.01M4 17h.01" />
        </Svg>
      );
    case 'bolt':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="#F59E0B" aria-hidden>
          <path d="M13 3L4 14h7l-1 7 10-12h-7l1-6z" />
        </svg>
      );
    case 'workflow':
      return <AgentToolIcon kind="workflows" className={className} />;
    case 'score':
      return (
        <Svg className={className}>
          <path {...stroke} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </Svg>
      );
    case 'fire':
      return (
        <Svg className={className}>
          <path {...stroke} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </Svg>
      );
    case 'route':
      return (
        <Svg className={className}>
          <path {...stroke} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </Svg>
      );
    case 'mail':
      return <AgentToolIcon kind="email" className={className} />;
    case 'reply':
      return (
        <Svg className={className}>
          <path {...stroke} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </Svg>
      );
    case 'calendar':
      return <AgentToolIcon kind="calendly" className={className} />;
    case 'refresh':
      return (
        <Svg className={className}>
          <path {...stroke} d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0019 8l1-2M19 5A9 9 0 005 16l-1 2" />
        </Svg>
      );
  }
}

export function EyeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path {...stroke} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </Svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M12 4v16m8-8H4" />
    </Svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M8 10h8M8 14h5M21 12a9 9 0 01-9 9 8.7 8.7 0 01-3.7-.8L3 21l.9-4.2A9 9 0 1112 3a9 9 0 019 9z" />
    </Svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M9 5l7 7-7 7" />
    </Svg>
  );
}

export function VolumeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M11 5L6 9H3v6h3l5 4V5z" />
      <path {...stroke} d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" />
    </Svg>
  );
}

export function VolumeOffIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M11 5L6 9H3v6h3l5 4V5zM22 9l-6 6M16 9l6 6" />
    </Svg>
  );
}

export function ChevronIcon({ open, className }: { open: boolean } & IconProps) {
  return (
    <Svg className={`${className ?? 'w-4 h-4'} transition-transform ${open ? 'rotate-90' : ''}`}>
      <path {...stroke} d="M9 5l7 7-7 7" />
    </Svg>
  );
}

export function PuzzleIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        {...stroke}
        d="M8 3.5a2 2 0 012 2V7h3.5A1.5 1.5 0 0115 8.5 1.5 1.5 0 0116.5 10H18a2 2 0 012 2v1.5a2 2 0 01-2 2h-1.5A1.5 1.5 0 0115 17a1.5 1.5 0 01-1.5 1.5H12v1a2 2 0 01-4 0v-1H6a2 2 0 01-2-2v-3.5a2 2 0 012-2h.5A1.5 1.5 0 018 9.5 1.5 1.5 0 016.5 8H6a2 2 0 01-2-2V5.5A2 2 0 016 3.5h2z"
      />
    </Svg>
  );
}

export function DocumentIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M8 3h6l5 5v12a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path {...stroke} d="M14 3v5h5M9.5 13h5M9.5 16.5h3.5" />
    </Svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        {...stroke}
        d="M4 5.5A2.5 2.5 0 016.5 3H12v16H6.5A2.5 2.5 0 014 16.5v-11zM20 5.5A2.5 2.5 0 0017.5 3H12v16h5.5A2.5 2.5 0 0020 16.5v-11z"
      />
    </Svg>
  );
}

export function ListLinesIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M8 7h12M8 12h12M8 17h8M4 7h.01M4 12h.01M4 17h.01" />
    </Svg>
  );
}

export function SlidersIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path {...stroke} d="M4 8h16M4 16h16M10 6v4M16 14v4" />
    </Svg>
  );
}

export function DatabaseIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path {...stroke} d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </Svg>
  );
}

export type AgentTabId = 'overview' | 'context' | 'knowledge' | 'tools' | 'settings';

export function AgentTabIcon({ id, className }: { id: AgentTabId } & IconProps) {
  switch (id) {
    case 'overview':
      return <DocumentIcon className={className} />;
    case 'context':
      return <ListLinesIcon className={className} />;
    case 'knowledge':
      return <BookIcon className={className} />;
    case 'tools':
      return <PuzzleIcon className={className} />;
    case 'settings':
      return <SlidersIcon className={className} />;
  }
}

export function AgentSectionIcon({
  id,
  className,
}: {
  id: 'context' | 'tools' | 'outputs' | 'knowledge' | 'settings';
} & IconProps) {
  const glyph =
    id === 'context' ? (
      <DocumentIcon className="w-4 h-4" />
    ) : id === 'tools' ? (
      <PuzzleIcon className="w-4 h-4" />
    ) : id === 'outputs' ? (
      <DatabaseIcon className="w-4 h-4" />
    ) : id === 'knowledge' ? (
      <BookIcon className="w-4 h-4" />
    ) : (
      <SlidersIcon className="w-4 h-4" />
    );

  return (
    <span
      className={`inline-flex w-8 h-8 rounded-lg bg-[#EEF2FF] text-[#4F46E5] items-center justify-center shrink-0 ${className ?? ''}`}
    >
      {glyph}
    </span>
  );
}

export type AgentOutputIconKind =
  | 'user'
  | 'document'
  | 'bookmark'
  | 'bolt'
  | 'mail'
  | 'calendar'
  | 'list'
  | 'phone'
  | 'tag'
  | 'alert'
  | 'reply'
  | 'workflow'
  | 'refresh';

const OUTPUT_ICON_BY_ID: Record<string, AgentOutputIconKind> = {
  candidates: 'user',
  applications: 'list',
  summary: 'document',
  campaigns: 'bolt',
  sync: 'refresh',
  leads: 'user',
  sequences: 'mail',
  replies: 'reply',
  invites: 'calendar',
  reminders: 'document',
  offers: 'mail',
  followups: 'refresh',
};

const OUTPUT_TONES: Record<AgentOutputIconKind, string> = {
  user: 'text-[#0077E6]',
  document: 'text-[#DB2777]',
  bookmark: 'text-[#7C3AED]',
  bolt: 'text-[#F59E0B]',
  mail: 'text-[#0077E6]',
  calendar: 'text-[#006BFF]',
  list: 'text-[#7C3AED]',
  phone: 'text-[#16A34A]',
  tag: 'text-[#7C3AED]',
  alert: 'text-[#F59E0B]',
  reply: 'text-[#0077E6]',
  workflow: 'text-[#4F46E5]',
  refresh: 'text-[#0077E6]',
};

export function AgentOutputIcon({ outputId, className = 'w-4 h-4' }: { outputId: string } & IconProps) {
  const kind = OUTPUT_ICON_BY_ID[outputId] ?? 'document';
  const tone = OUTPUT_TONES[kind];
  const cls = `${className} ${tone}`;

  switch (kind) {
    case 'user':
      return (
        <Svg className={cls}>
          <path {...stroke} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM6 20a6 6 0 0112 0" />
        </Svg>
      );
    case 'bookmark':
      return (
        <Svg className={cls}>
          <path {...stroke} d="M7 4h10a1 1 0 011 1v15l-6-3-6 3V5a1 1 0 011-1z" />
        </Svg>
      );
    case 'bolt':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13 3L4 14h7l-1 7 10-12h-7l1-6z" />
        </svg>
      );
    case 'mail':
      return (
        <Svg className={cls}>
          <path {...stroke} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </Svg>
      );
    case 'calendar':
      return <AgentToolIcon kind="calendly" className={cls} />;
    case 'list':
      return (
        <Svg className={cls}>
          <path {...stroke} d="M8 7h12M8 12h12M8 17h8M4 7h.01M4 12h.01M4 17h.01" />
        </Svg>
      );
    case 'phone':
    case 'tag':
    case 'alert':
      return (
        <Svg className={cls}>
          <path {...stroke} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </Svg>
      );
    case 'reply':
      return (
        <Svg className={cls}>
          <path {...stroke} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </Svg>
      );
    case 'workflow':
      return <PuzzleIcon className={cls} />;
    case 'refresh':
      return (
        <Svg className={cls}>
          <path {...stroke} d="M4 4v6h6M20 20v-6h-6M5 19A9 9 0 0019 8l1-2M19 5A9 9 0 005 16l-1 2" />
        </Svg>
      );
    case 'document':
    default:
      return <DocumentIcon className={cls} />;
  }
}

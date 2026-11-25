import type { ReactNode } from 'react';

const toneMap = {
  blue: 'bg-sky-50 text-sky-700 border-sky-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  yellow: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-red-50 text-red-700 border-red-100',
  purple: 'bg-violet-50 text-violet-700 border-violet-100',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
};

type Props = {
  children: ReactNode;
  tone?: keyof typeof toneMap;
  dot?: boolean;
  className?: string;
};

export default function Badge({ children, tone = 'gray', dot = false, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${toneMap[tone]} ${className}`}
    >
      {dot ? <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-80`} /> : null}
      {children}
    </span>
  );
}

export function searchStatusTone(status: string): keyof typeof toneMap {
  switch (status) {
    case 'running':
      return 'blue';
    case 'completed':
      return 'green';
    case 'failed':
      return 'red';
    case 'cancelled':
    case 'paused':
      return 'yellow';
    case 'pending':
    default:
      return 'gray';
  }
}

export function entityStatusTone(status: string): keyof typeof toneMap {
  switch (status) {
    case 'qualified':
    case 'contacted':
      return 'blue';
    case 'new':
      return 'purple';
    case 'rejected':
    case 'archived':
      return 'gray';
    default:
      return 'gray';
  }
}

export function campaignStatusTone(status: string): keyof typeof toneMap {
  switch (status) {
    case 'active':
      return 'green';
    case 'paused':
      return 'yellow';
    case 'completed':
      return 'blue';
    case 'draft':
      return 'gray';
    case 'archived':
      return 'gray';
    default:
      return 'gray';
  }
}

export function signalStatusTone(status: string): keyof typeof toneMap {
  switch (status) {
    case 'active':
      return 'green';
    case 'collecting':
      return 'blue';
    case 'silenced':
      return 'yellow';
    case 'expired':
      return 'gray';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
}

export function signalSeverityTone(severity: string): keyof typeof toneMap {
  switch (severity) {
    case 'high':
      return 'red';
    case 'medium':
      return 'yellow';
    case 'info':
    default:
      return 'blue';
  }
}

import { toDateInput } from '../models/employeeForm';

export type BadgeTone = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';

export function statusTone(status?: string | null): BadgeTone {
  switch (status) {
    case 'Active':
      return 'green';
    case 'Onboarding':
      return 'blue';
    case 'Pending':
      return 'yellow';
    case 'OnLeave':
      return 'purple';
    case 'Terminated':
      return 'red';
    case 'Inactive':
    default:
      return 'gray';
  }
}

export function employeeName(e: { displayName?: string | null; firstName?: string; lastName?: string }): string {
  return (e.displayName || `${e.firstName ?? ''} ${e.lastName ?? ''}`).trim();
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-emerald-100 text-emerald-800',
  'bg-indigo-100 text-indigo-800',
];

export function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** Formats a date-only value without timezone shifting (`2025-01-15T00:00:00` → local Jan 15). */
export function formatDate(value: string | null | undefined, locale: string): string {
  const ymd = toDateInput(value);
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  try {
    return new Date(y, m - 1, d).toLocaleDateString(locale || 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return ymd;
  }
}

export function formatDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(locale || 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale || 'en', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale || 'en')} ${currency}`;
  }
}

export function daysUntil(value?: string | null): number | null {
  const ymd = toDateInput(value);
  if (!ymd) return null;
  const [y, m, d] = ymd.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((target - start) / 86_400_000);
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = String((err as { message?: unknown }).message ?? '').trim();
    if (m) return m;
  }
  return fallback;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isSafeUrl(url?: string | null): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

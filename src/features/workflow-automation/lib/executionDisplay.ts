import { getActivityByType } from '../models/activityCatalog';

const GUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isGuid(value: unknown): value is string {
  return typeof value === 'string' && GUID_RE.test(value.trim());
}

export function humanizeLabel(key: string): string {
  const cleaned = key
    .replace(/[._]/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  if (!cleaned) return key;
  return cleaned
    .split(/\s+/)
    .map((word) => {
      if (/^id$/i.test(word)) return 'ID';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function activityLabel(activityType: string | null | undefined): string {
  if (!activityType) return '—';
  return getActivityByType(activityType)?.name ?? humanizeLabel(activityType.split('.').pop() ?? activityType);
}

export function activityIconName(activityType: string | null | undefined): string {
  return getActivityByType(activityType)?.icon ?? 'spark';
}

export function initialsFromName(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function historyTone(
  eventType: string,
): 'blue' | 'green' | 'red' | 'yellow' | 'gray' | 'purple' {
  const t = eventType.toLowerCase();
  if (t.includes('fail') || t.includes('error')) return 'red';
  if (t.includes('complete') || t.includes('success')) return 'green';
  if (t.includes('wait') || t.includes('pending')) return 'yellow';
  if (t.includes('cancel')) return 'purple';
  if (t.includes('start')) return 'blue';
  return 'gray';
}

export function historyTitle(eventType: string, message: string): string {
  const quoted = message.match(/Step '([^']+)'\s+(\w+)/i);
  if (quoted) {
    return `${quoted[1]} ${quoted[2].toLowerCase()}`;
  }
  return humanizeLabel(eventType);
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function variableString(
  variables: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = variables?.[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

export function isEmailKey(key: string): boolean {
  return key.toLowerCase() === 'email';
}

export function isPhoneKey(key: string): boolean {
  const k = key.toLowerCase();
  return k === 'phone' || k === 'phonenumber' || k === 'mobile';
}

export function isStatusKey(key: string): boolean {
  return key.toLowerCase() === 'status';
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

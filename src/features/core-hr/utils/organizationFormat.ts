import type { OrgPosition } from '../models/organization';

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export const DEFAULT_DEPT_COLOR = '#0d9488';

/** Only accept hex colors from the API so they are safe to use in inline styles. */
export function safeColor(color?: string | null): string {
  return color && HEX.test(color.trim()) ? color.trim() : DEFAULT_DEPT_COLOR;
}

/** Soft tint of a hex color for icon backgrounds (works with #rgb and #rrggbb). */
export function tintColor(color: string, alpha = 0.12): string {
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type OccupancyTone = 'green' | 'amber' | 'red' | 'gray';

export function occupancyTone(filled: number, headcount: number): OccupancyTone {
  if (headcount <= 0) return 'gray';
  if (filled > headcount) return 'red';
  if (filled >= headcount) return 'green';
  if (filled > 0) return 'amber';
  return 'red';
}

export const OCCUPANCY_CLASSES: Record<OccupancyTone, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
};

export function positionStatusTone(p: Pick<OrgPosition, 'filledCount' | 'headcount' | 'isActive'>): OccupancyTone {
  if (!p.isActive) return 'gray';
  return occupancyTone(p.filledCount, p.headcount);
}

export function formatLocationLine(l: { city?: string | null; state?: string | null; country?: string | null }): string {
  return [l.city, l.state, l.country].filter(Boolean).join(', ');
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    let s = v == null ? '' : String(v);
    // Neutralize spreadsheet formula injection.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(esc).join(',')).join('\r\n');
}

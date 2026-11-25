const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function startOfUtcDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function last7Days(now = new Date()): Date[] {
  const end = startOfUtcDay(now);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(end);
    day.setUTCDate(end.getUTCDate() - (6 - index));
    return day;
  });
}

export function weekLabel(day: Date): string {
  return WEEKDAYS[day.getUTCDay()] ?? '';
}

export function isSameDay(value: string | Date | null | undefined, day: Date): boolean {
  if (!value) return false;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getUTCFullYear() === day.getUTCFullYear() &&
    date.getUTCMonth() === day.getUTCMonth() &&
    date.getUTCDate() === day.getUTCDate()
  );
}

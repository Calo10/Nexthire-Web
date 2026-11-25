import type { BadgeTone } from './employeeFormat';
import { ACTIVE_ONBOARDING_STATUSES } from '../models/onboarding';

export function onboardingStatusTone(status?: string | null): BadgeTone {
  switch (status) {
    case 'NotStarted':
      return 'gray';
    case 'InProgress':
      return 'blue';
    case 'InReview':
      return 'purple';
    case 'Completed':
      return 'green';
    case 'Cancelled':
      return 'red';
    default:
      return 'gray';
  }
}

export function taskStatusTone(status?: string | null): BadgeTone {
  switch (status) {
    case 'Completed':
      return 'green';
    case 'InProgress':
      return 'blue';
    case 'Blocked':
      return 'red';
    case 'Cancelled':
      return 'gray';
    case 'Pending':
    default:
      return 'yellow';
  }
}

export function documentStatusTone(status?: string | null): BadgeTone {
  switch (status) {
    case 'Approved':
      return 'green';
    case 'Uploaded':
      return 'blue';
    case 'PendingApproval':
      return 'yellow';
    case 'Rejected':
      return 'red';
    case 'Missing':
    default:
      return 'gray';
  }
}

export function isActiveOnboarding(status?: string | null): boolean {
  return !!status && ACTIVE_ONBOARDING_STATUSES.includes(status);
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** `YYYY-MM-DD` for a Date in local time (what `<input type="date">` expects). */
export function todayInput(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDaysInput(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d + days);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

/** Normalizes a possibly time-stamped API date to a `YYYY-MM-DD` date input value. */
export function dateOnly(value?: string | null): string {
  if (!value) return '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return m ? m[1] : '';
}

import type { BadgeTone } from './employeeFormat';
import { ACTIVE_OFFBOARDING_STATUSES } from '../models/offboarding';

// Date / percent helpers are shared with onboarding.
export { addDaysInput, clampPercent, dateOnly, documentStatusTone, taskStatusTone, todayInput } from './onboardingFormat';

export function offboardingStatusTone(status?: string | null): BadgeTone {
  switch (status) {
    case 'Scheduled':
      return 'gray';
    case 'InProgress':
      return 'blue';
    case 'PendingClearance':
      return 'purple';
    case 'Completed':
      return 'green';
    case 'Cancelled':
      return 'red';
    default:
      return 'gray';
  }
}

export function assetStatusTone(status?: string | null): BadgeTone {
  switch (status) {
    case 'Returned':
      return 'green';
    case 'Damaged':
      return 'yellow';
    case 'Missing':
      return 'red';
    case 'Waived':
      return 'gray';
    case 'PendingReturn':
    default:
      return 'blue';
  }
}

export function accessStatusTone(status?: string | null): BadgeTone {
  switch (status) {
    case 'Verified':
      return 'green';
    case 'Revoked':
      return 'blue';
    case 'Scheduled':
      return 'purple';
    case 'NotApplicable':
      return 'gray';
    case 'Pending':
    default:
      return 'yellow';
  }
}

export function settlementStatusTone(status?: string | null): BadgeTone {
  switch (status) {
    case 'Completed':
      return 'green';
    case 'NotApplicable':
    case 'Waived':
      return 'gray';
    case 'Pending':
    default:
      return 'yellow';
  }
}

export function isActiveOffboarding(status?: string | null): boolean {
  return !!status && ACTIVE_OFFBOARDING_STATUSES.includes(status);
}

/** Parses the exit-interview `responsesJson` into a flat question/answer list (best effort). */
export function parseExitResponses(json?: string | null): { question: string; answer: string }[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => {
          if (entry && typeof entry === 'object') {
            const e = entry as Record<string, unknown>;
            const q = e.question ?? e.q ?? e.id ?? '';
            const a = e.answer ?? e.a ?? e.response ?? '';
            return { question: String(q), answer: typeof a === 'string' ? a : JSON.stringify(a) };
          }
          return { question: '', answer: String(entry) };
        })
        .filter((x) => x.question || x.answer);
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed as Record<string, unknown>).map(([question, a]) => ({
        question,
        answer: typeof a === 'string' ? a : JSON.stringify(a),
      }));
    }
  } catch {
    // not JSON — ignore
  }
  return [];
}

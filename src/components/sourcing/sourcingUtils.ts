import { onlyDigits } from '../../lib/phone';
import type { SourcingLead } from '../../types/sourcing';

export function leadId(lead: SourcingLead): string {
  return String(lead.id ?? '');
}

export function leadDisplayName(lead: SourcingLead): string {
  const fn = [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim();
  return String(lead.fullName || fn || '—').trim();
}

export function whatsappHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = onlyDigits(String(phone));
  if (!d) return null;
  return `https://wa.me/${d}`;
}

export function fitScoreTone(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return 'bg-gray-50 text-gray-600 border border-gray-100';
  if (score >= 85) return 'bg-green-50 text-green-600 border border-green-100';
  if (score >= 70) return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  if (score >= 60) return 'bg-yellow-50 text-yellow-600 border border-yellow-100';
  return 'bg-orange-50 text-orange-700 border border-orange-100';
}

export function formatMoney(n: number | null | undefined, currency = 'USD'): string {
  if (n == null || Number.isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export function formatPercent(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  const v = n <= 1 && n > 0 ? n * 100 : n;
  return `${v.toFixed(1)}%`;
}

export function isSameLocalDay(iso: string | null | undefined, yyyyMmDd: string): boolean {
  if (!iso || !yyyyMmDd) return true;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}` === yyyyMmDd;
}

export interface LeadDynamicAnswer {
  questionId?: string;
  key?: string;
  label: string;
  value: string;
  answeredAtUtc?: string;
}

interface LeadDynamicAnswersPayload {
  version?: number;
  answers?: Array<{
    questionId?: string;
    key?: string;
    label?: string;
    value?: unknown;
    answeredAtUtc?: string;
  }>;
}

function normalizeDynamicAnswerValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return String(value).trim();
}

export function parseDynamicAnswersJson(raw: unknown): LeadDynamicAnswer[] {
  if (raw == null) return [];

  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }

  if (!parsed || typeof parsed !== 'object') return [];

  const answers = (parsed as LeadDynamicAnswersPayload).answers;
  if (!Array.isArray(answers)) return [];

  return answers
    .filter((answer) => answer && typeof answer === 'object')
    .map((answer) => {
      const label = String(answer.label || answer.key || '').trim();
      const value = normalizeDynamicAnswerValue(answer.value);
      return {
        questionId: answer.questionId,
        key: answer.key,
        label,
        value,
        answeredAtUtc: answer.answeredAtUtc,
      };
    })
    .filter((answer) => answer.label);
}

export function formatDynamicAnswerDisplayValue(
  value: string,
  translate: (key: string) => string
): string {
  if (!value) return '—';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'yes') return translate('sourcing.dynamicAnswers.yes');
  if (normalized === 'no') return translate('sourcing.dynamicAnswers.no');
  return value;
}

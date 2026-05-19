/** Canonical application/candidate source values (API + selects). Keep in sync everywhere. */
export const CANDIDATE_SOURCE_VALUES = [
  'Website',
  'LinkedIn',
  'Referral',
  'Email',
  'Indeed',
  'Agency',
  'Other',
] as const;

export type CandidateSourceValue = (typeof CANDIDATE_SOURCE_VALUES)[number];

const LABEL_KEY: Record<CandidateSourceValue, string> = {
  Website: 'candidates.sources.website',
  LinkedIn: 'candidates.sources.linkedin',
  Referral: 'candidates.sources.referral',
  Email: 'candidates.sources.email',
  Indeed: 'candidates.sources.indeed',
  Agency: 'candidates.sources.agency',
  Other: 'candidates.sources.other',
};

export function candidateSourceSelectOptions(t: (key: string) => string): { value: string; label: string }[] {
  return CANDIDATE_SOURCE_VALUES.map((v) => ({ value: v, label: t(LABEL_KEY[v]) }));
}

/** Map stored source (any legacy casing) to a canonical option value for controlled selects. */
export function normalizeCandidateSourceForSelect(raw: string | null | undefined): string {
  const s = String(raw || '').trim();
  if (!s) return '';
  const lower = s.toLowerCase();
  for (const v of CANDIDATE_SOURCE_VALUES) {
    if (v.toLowerCase() === lower) return v;
  }
  const compact = lower.replace(/[\s_-]+/g, '');
  for (const v of CANDIDATE_SOURCE_VALUES) {
    if (v.toLowerCase().replace(/[\s_-]+/g, '') === compact) return v;
  }
  return s;
}

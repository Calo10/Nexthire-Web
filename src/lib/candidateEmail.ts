const PLACEHOLDER_EMAIL_SUFFIX = '@sourcing.placeholder.invalid';

/** Synthetic emails invented on lead→candidate convert — never show in UI. */
export function isPlaceholderCandidateEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(PLACEHOLDER_EMAIL_SUFFIX);
}

/** Display email for lists/drawers; hides synthetic convert placeholders. */
export function displayCandidateEmail(email?: string | null, emptyLabel = '—'): string {
  const trimmed = email?.trim() ?? '';
  if (!trimmed || isPlaceholderCandidateEmail(trimmed)) return emptyLabel;
  return trimmed;
}

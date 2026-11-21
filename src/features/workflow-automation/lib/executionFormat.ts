export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDuration(
  startIso: string | null | undefined,
  endIso: string | null | undefined,
): string {
  if (!startIso) return '—';
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return '—';
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (Number.isNaN(end) || end < start) return '—';

  const totalSeconds = Math.floor((end - start) / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;

  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  if (hours < 48) return `${hours}h ${remMinutes}m`;

  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h`;
}

export function executionEndTimestamp(execution: {
  status: string;
  completedAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  updatedAt?: string | null;
}): string | null {
  const status = execution.status.toLowerCase();
  if (status === 'completed') return execution.completedAt ?? execution.updatedAt ?? null;
  if (status === 'failed') return execution.failedAt ?? execution.updatedAt ?? null;
  if (status === 'cancelled') return execution.cancelledAt ?? execution.updatedAt ?? null;
  return execution.updatedAt ?? null;
}

/** Nested object tree from flat dotted keys (Candidate.Name → { Lead: { Name } }). */
export function nestVariables(
  variables: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!variables) return {};
  const root: Record<string, unknown> = {};

  for (const [rawKey, value] of Object.entries(variables)) {
    const parts = rawKey.split('.').filter(Boolean);
    if (parts.length === 0) continue;

    let cursor: Record<string, unknown> = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      if (isLeaf) {
        cursor[part] = value;
      } else {
        const next = cursor[part];
        if (!next || typeof next !== 'object' || Array.isArray(next)) {
          cursor[part] = {};
        }
        cursor = cursor[part] as Record<string, unknown>;
      }
    }
  }

  return root;
}

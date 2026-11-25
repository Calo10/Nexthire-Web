import type { ReactNode } from 'react';

export default function DetailField({ label, children }: { label: string; children?: ReactNode }) {
  const empty = children === null || children === undefined || children === '' || children === false;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-dark-text">{empty ? '—' : children}</dd>
    </div>
  );
}

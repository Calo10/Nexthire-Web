interface LeadStatusPillProps {
  status: string | null | undefined;
  label?: string;
}

export default function LeadStatusPill({ status, label }: LeadStatusPillProps) {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '_');
  const color = (() => {
    if (normalized === 'new') return 'bg-purple-100 text-purple-700';
    if (normalized === 'contacted') return 'bg-blue-100 text-blue-700';
    if (normalized === 'qualified') return 'bg-green-100 text-green-700';
    if (normalized === 'converted') return 'bg-green-100 text-green-700';
    if (normalized === 'rejected') return 'bg-red-100 text-red-700';
    if (normalized === 'archived') return 'bg-gray-100 text-gray-600';
    return 'bg-gray-100 text-gray-700';
  })();

  const display =
    label ||
    (status
      ? String(status)
          .replace(/_/g, ' ')
          .split(' ')
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
      : '—');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{display}</span>
  );
}

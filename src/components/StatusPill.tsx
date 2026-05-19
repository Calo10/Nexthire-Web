import { useTranslation } from 'react-i18next';

interface StatusPillProps {
  status: string;
  className?: string;
}

export default function StatusPill({ status, className = '' }: StatusPillProps) {
  const { t, i18n } = useTranslation();
  const raw = String(status || '');
  const normalized = raw.trim().toLowerCase();

  const getStatusColor = (normalizedStatus: string) => {
    // Jobs: open | closed | draft | on_hold
    if (normalizedStatus === 'open') return 'bg-yellow-100 text-yellow-700';
    if (normalizedStatus === 'closed') return 'bg-gray-100 text-gray-700';
    if (normalizedStatus === 'draft') return 'bg-slate-100 text-slate-700';
    if (normalizedStatus === 'on_hold' || normalizedStatus === 'on hold') return 'bg-purple-100 text-purple-700';

    // Tasks (and generic fallbacks)
    if (normalizedStatus === 'in_progress' || normalizedStatus === 'in progress' || normalizedStatus === 'in-progress') {
      return 'bg-orange-100 text-orange-700';
    }
    if (normalizedStatus === 'done' || normalizedStatus === 'completed') return 'bg-green-100 text-green-700';
    if (normalizedStatus === 'blocked') return 'bg-red-100 text-red-700';

    return 'bg-gray-100 text-gray-700';
  };

  const toTitleCase = (value: string) =>
    value
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

  const label = (() => {
    // Prefer i18n when a matching key exists (jobs.status.*)
    const key = `jobs.status.${normalized}`;
    if (normalized && typeof (i18n as any)?.exists === 'function' && (i18n as any).exists(key)) {
      return t(key);
    }
    return toTitleCase(raw.trim());
  })();

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(normalized)} ${className}`}
    >
      {label}
    </span>
  );
}

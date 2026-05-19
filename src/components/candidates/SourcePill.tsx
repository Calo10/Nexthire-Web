interface SourcePillProps {
  source: string;
  className?: string;
}

function normalizeSource(raw: string) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function toTitleCaseFromKey(key: string) {
  const parts = String(key || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  const titled = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  const joined = titled.join(' ');
  // Preserve common brand casing
  if (joined.toLowerCase() === 'linkedin') return 'LinkedIn';
  if (joined.toLowerCase() === 'indeed') return 'Indeed';
  return joined || '—';
}

function getSourceColor(normalized: string) {
  if (normalized.includes('linkedin')) return 'bg-blue-100 text-blue-700';
  if (normalized.includes('referral')) return 'bg-purple-100 text-purple-700';
  if (normalized.includes('website')) return 'bg-teal-100 text-teal-700';
  if (normalized.includes('email')) return 'bg-amber-100 text-amber-700';
  if (normalized.includes('indeed')) return 'bg-indigo-100 text-indigo-700';
  if (normalized.includes('agency')) return 'bg-fuchsia-100 text-fuchsia-700';
  if (normalized.includes('public_apply')) return 'bg-gray-100 text-gray-700';
  return 'bg-gray-100 text-gray-700';
}

export default function SourcePill({ source, className = '' }: SourcePillProps) {
  const normalized = normalizeSource(source);
  const label = toTitleCaseFromKey(normalized);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(normalized)} ${className}`}
    >
      {label}
    </span>
  );
}


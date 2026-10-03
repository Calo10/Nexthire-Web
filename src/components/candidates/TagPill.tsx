import { formatTagLabel, tagColorClass } from '../../lib/candidateTagStyle';

export default function TagPill({
  name,
  className = '',
  onRemove,
  removeLabel,
}: {
  name: string;
  className?: string;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const label = formatTagLabel(name);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tagColorClass(label)} ${className}`}>
      {label}
      {onRemove ? (
        <button
          type="button"
          className="leading-none opacity-70 hover:opacity-100 disabled:opacity-40"
          aria-label={removeLabel}
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

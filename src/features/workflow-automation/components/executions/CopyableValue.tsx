import { useState } from 'react';
import { isGuid } from '../../lib/executionDisplay';

type Props = {
  value: string;
  compact?: boolean;
};

export default function CopyableValue({ value, compact = true }: Props) {
  const [copied, setCopied] = useState(false);
  const display = compact && isGuid(value) ? `${value.slice(0, 8)}…` : value;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title={value}
      className="inline-flex items-center gap-2 max-w-full text-left text-xs font-medium text-gray-600 hover:text-[#0077E6]"
    >
      <span className="font-mono truncate">{display}</span>
      <span className="shrink-0 text-[11px] uppercase tracking-wide text-gray-400">
        {copied ? 'Copied' : 'Copy'}
      </span>
    </button>
  );
}

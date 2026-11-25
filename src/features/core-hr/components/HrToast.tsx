import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export type HrToastState = {
  tone: 'success' | 'error' | 'warning';
  text: string;
  linkTo?: string;
  linkLabel?: string;
} | null;

type Props = {
  toast: HrToastState;
  onDismiss: () => void;
  durationMs?: number;
};

const TONES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
} as const;

export default function HrToast({ toast, onDismiss, durationMs = 6000 }: Props) {
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(id);
  }, [toast, onDismiss, durationMs]);

  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] max-w-sm">
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${TONES[toast.tone]}`}
      >
        <div className="min-w-0 flex-1">
          <p>{toast.text}</p>
          {toast.linkTo ? (
            <Link to={toast.linkTo} className="mt-1 inline-block font-semibold underline">
              {toast.linkLabel}
            </Link>
          ) : null}
        </div>
        <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  );
}

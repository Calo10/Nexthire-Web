import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** White rounded card used across the analytics workspace. */
export default function ChartPanel({ title, subtitle, action, className = '', children }: Props) {
  return (
    <section className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-dark-text">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function ChartEmpty({ text, height = 220 }: { text: string; height?: number }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-400" style={{ height }}>
      {text}
    </div>
  );
}

export function PanelSkeleton({ className = '', height = 220 }: { className?: string; height?: number }) {
  return <div aria-hidden className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} style={{ height }} />;
}

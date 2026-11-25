import type { ReactNode } from 'react';
import Button from '../Button';

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
};

export default function PageHeader({ title, subtitle, actionLabel, onAction, children }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-text">{title}</h1>
        {subtitle ? <p className="text-sm text-gray-500 mt-1 max-w-2xl">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {children}
        {actionLabel && onAction ? (
          <Button type="button" onClick={onAction} className="whitespace-nowrap">
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

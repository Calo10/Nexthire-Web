import type { ReactNode } from 'react';
import ErrorMessage from '../../../../components/ErrorMessage';

type Props = {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyTitle: string;
  emptySubtitle?: string;
  children: ReactNode;
};

export default function TabAsyncState({
  loading,
  error,
  empty,
  emptyTitle,
  emptySubtitle,
  children,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        <p className="mt-3 text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50/40 p-4">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (empty) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
        <p className="text-sm font-medium text-dark-text">{emptyTitle}</p>
        {emptySubtitle ? <p className="text-sm text-gray-500 mt-1">{emptySubtitle}</p> : null}
      </div>
    );
  }

  return <>{children}</>;
}

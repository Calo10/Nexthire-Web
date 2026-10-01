import { useTranslation } from 'react-i18next';

interface CandidatesPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

function pageWindow(current: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const anchors = [1, totalPages, current - 1, current, current + 1].filter(
    (n) => n >= 1 && n <= totalPages,
  );
  const sorted = [...new Set(anchors)].sort((a, b) => a - b);
  const window: Array<number | 'ellipsis'> = [];

  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) window.push('ellipsis');
    window.push(sorted[i]);
  }

  return window;
}

export default function CandidatesPagination({
  page,
  pageSize,
  total,
  totalPages,
  isLoading = false,
  onPageChange,
}: CandidatesPaginationProps) {
  const { t } = useTranslation();
  const safePageSize = Math.max(1, pageSize);
  const pages = Math.max(1, totalPages);
  const from = total === 0 ? 0 : (page - 1) * safePageSize + 1;
  const to = Math.min(page * safePageSize, total);

  return (
    <div className="flex flex-col gap-3 px-4 py-4 border-t border-gray-200 bg-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-gray-600">
        {t('candidates.pagination.showing', { from, to, total })}
      </p>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={isLoading || page <= 1}
        >
          {t('candidates.pagination.prev')}
        </button>
        {pageWindow(page, pages).map((entry, index) =>
          entry === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-gray-400">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              className={`min-w-9 px-3 py-2 text-sm font-medium rounded-lg border ${
                entry === page
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
              } disabled:opacity-50`}
              onClick={() => onPageChange(entry)}
              disabled={isLoading || entry === page}
              aria-current={entry === page ? 'page' : undefined}
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={isLoading || page >= pages}
        >
          {t('candidates.pagination.next')}
        </button>
      </div>
    </div>
  );
}

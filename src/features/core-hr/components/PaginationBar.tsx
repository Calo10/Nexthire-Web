import { useTranslation } from 'react-i18next';

type Props = {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  disabled?: boolean;
};

function pageWindow(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) out.push('…');
  for (let p = start; p <= end; p += 1) out.push(p);
  if (end < pages - 1) out.push('…');
  out.push(pages);
  return out;
}

export default function PaginationBar({
  page,
  pageSize,
  total,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  disabled,
}: Props) {
  const { t, i18n } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nf = (n: number) => n.toLocaleString(i18n.language || 'en');
  const btn =
    'h-9 min-w-9 rounded-lg border px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>{t('coreHr.employees.pagination.showing', { from: nf(from), to: nf(to), total: nf(total) })}</span>
        <label className="flex items-center gap-2">
          <span className="hidden sm:inline">{t('coreHr.employees.pagination.perPage')}</span>
          <select
            value={pageSize}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label={t('coreHr.employees.pagination.perPage')}
            className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <nav className="flex items-center gap-1" aria-label={t('coreHr.employees.pagination.label')}>
        <button
          type="button"
          className={`${btn} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t('coreHr.employees.pagination.previous')}
        </button>
        {pageWindow(page, pages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              disabled={disabled}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
              className={`${btn} ${
                p === page
                  ? 'border-teal-600 bg-teal-600 text-white'
                  : 'hidden border-gray-300 bg-white text-gray-700 hover:bg-gray-50 sm:inline-block'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          className={`${btn} border-gray-300 bg-white text-gray-700 hover:bg-gray-50`}
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('coreHr.employees.pagination.next')}
        </button>
      </nav>
    </div>
  );
}

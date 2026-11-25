import { useTranslation } from 'react-i18next';
import { formatNumber } from '../../utils/hrReportsFormat';

type Props = {
  columns: string[];
  rows: Record<string, unknown>[];
  truncatedAt?: number;
  rowCount?: number;
  /** Optional key → label map (e.g. dataset field labels). */
  labels?: Record<string, string>;
  maxHeightClass?: string;
};

function cell(v: unknown, locale: string | undefined): string {
  if (v == null) return '';
  if (typeof v === 'number') return formatNumber(v, locale, 2);
  if (typeof v === 'boolean') return v ? '✓' : '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export default function ReportPreviewTable({ columns, rows, truncatedAt, rowCount, labels, maxHeightClass = 'max-h-96' }: Props) {
  const { t, i18n } = useTranslation();
  if (columns.length === 0 || rows.length === 0) {
    return <p className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-400">{t('coreHr.reports.states.noRows')}</p>;
  }
  return (
    <div>
      <div className={`overflow-auto rounded-xl border border-gray-100 ${maxHeightClass}`}>
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold">
                  {labels?.[c] ?? c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50/70">
                {columns.map((c) => (
                  <td key={c} className={`whitespace-nowrap px-3 py-2 text-dark-text ${typeof r[c] === 'number' ? 'tabular-nums text-right' : ''}`}>
                    {cell(r[c], i18n.language)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {t('coreHr.reports.states.rowCount', { count: rowCount ?? rows.length })}
        {truncatedAt && truncatedAt > 0 ? ` · ${t('coreHr.reports.states.truncated', { count: truncatedAt })}` : ''}
      </p>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { DOCUMENT_CATEGORIES } from '../../models/employee';
import type { HrDocumentCategoryCount } from '../../models/hrDocument';

type Props = {
  total: number;
  counts: HrDocumentCategoryCount[];
  selected: string;
  onSelect: (category: string) => void;
  loading?: boolean;
};

export default function HrDocumentCategorySidebar({ total, counts, selected, onSelect, loading }: Props) {
  const { t, i18n } = useTranslation();
  const byCategory = new Map(counts.map((c) => [c.category, c.count]));
  // Known categories first (stable order), then any extra category the API reports.
  const extras = counts.map((c) => c.category).filter((c) => !(DOCUMENT_CATEGORIES as readonly string[]).includes(c));
  const categories = [...DOCUMENT_CATEGORIES, ...extras];
  const nf = (n: number) => n.toLocaleString(i18n.language || 'en');

  const row = (key: string, label: string, count: number | null) => {
    const active = selected === key;
    return (
      <li key={key || 'all'}>
        <button
          type="button"
          aria-current={active ? 'true' : undefined}
          onClick={() => onSelect(key)}
          className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            active ? 'bg-teal-50 font-semibold text-teal-800' : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="truncate">{label}</span>
          <span className={`text-xs ${active ? 'text-teal-700' : 'text-gray-400'}`}>
            {loading && count === null ? '…' : count !== null ? nf(count) : ''}
          </span>
        </button>
      </li>
    );
  };

  return (
    <nav aria-label={t('coreHr.documentsHub.categories.title')} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
      <h2 className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {t('coreHr.documentsHub.categories.title')}
      </h2>
      <ul className="space-y-0.5">
        {row('', t('coreHr.documentsHub.categories.all'), total)}
        {categories.map((c) =>
          row(c, t(`coreHr.employees.documents.categories.${c}`, { defaultValue: c }), byCategory.get(c) ?? 0),
        )}
      </ul>
    </nav>
  );
}

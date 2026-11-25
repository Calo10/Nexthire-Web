import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReportDefinition } from '../../models/hrReports';
import { PanelSkeleton } from './ChartPanel';

type Props = {
  reports: ReportDefinition[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (c: string) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (v: boolean) => void;
  canEdit: boolean;
  canCreate: boolean;
  onRun: (r: ReportDefinition) => void;
  onToggleFavorite: (r: ReportDefinition) => void;
  onEdit: (r: ReportDefinition) => void;
  onDuplicate: (r: ReportDefinition) => void;
  onArchive: (r: ReportDefinition) => void;
};

function Star({ filled }: { filled: boolean }) {
  return (
    <svg className={`h-5 w-5 ${filled ? 'fill-amber-400 text-amber-400' : 'fill-none text-gray-300 hover:text-amber-400'}`} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.48 3.5a.56.56 0 011.04 0l2.13 5.11a.56.56 0 00.47.34l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 00-.18.56l1.28 5.39a.56.56 0 01-.84.61l-4.73-2.89a.56.56 0 00-.58 0l-4.73 2.89a.56.56 0 01-.84-.61l1.28-5.39a.56.56 0 00-.18-.56l-4.2-3.6a.56.56 0 01.32-.99l5.52-.44a.56.56 0 00.47-.34L11.48 3.5z" />
    </svg>
  );
}

export default function ReportLibraryGrid({
  reports,
  loading,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  canEdit,
  canCreate,
  onRun,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onArchive,
}: Props) {
  const { t } = useTranslation();
  const categories = useMemo(() => Array.from(new Set(reports.map((r) => r.category).filter(Boolean))).sort(), [reports]);
  const visible = category ? reports.filter((r) => r.category === category) : reports;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('coreHr.reports.library.searchPlaceholder')}
          aria-label={t('coreHr.reports.library.searchPlaceholder')}
          className="h-10 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={favoritesOnly} onChange={(e) => onFavoritesOnlyChange(e.target.checked)} className="rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
          {t('coreHr.reports.library.favoritesOnly')}
        </label>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={t('coreHr.reports.library.categories')}>
        {['', ...categories].map((c) => {
          const active = c === category;
          return (
            <button
              key={c || '__all__'}
              type="button"
              aria-pressed={active}
              onClick={() => onCategoryChange(c)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'
              }`}
            >
              {c || t('coreHr.reports.library.allCategories')}
            </button>
          );
        })}
      </div>

      {loading && reports.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <PanelSkeleton key={i} height={150} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-sm text-gray-500">{t('coreHr.reports.library.empty')}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r) => (
            <article key={r.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">{r.category}</span>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(r)}
                  aria-pressed={r.isFavorite}
                  aria-label={r.isFavorite ? t('coreHr.reports.library.unfavorite') : t('coreHr.reports.library.favorite')}
                >
                  <Star filled={r.isFavorite} />
                </button>
              </div>
              <h3 className="mt-3 text-base font-semibold text-dark-text">{r.name}</h3>
              <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-gray-500">{r.description || t('coreHr.reports.library.noDescription')}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-400">
                {r.isSystem ? <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">{t('coreHr.reports.library.system')}</span> : null}
                <span>{r.visibility}</span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                <button type="button" onClick={() => onRun(r)} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700">
                  {t('coreHr.reports.library.run')}
                </button>
                <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                  {canEdit && !r.isSystem ? (
                    <button type="button" onClick={() => onEdit(r)} className="hover:text-violet-700">
                      {t('common.actions.edit')}
                    </button>
                  ) : null}
                  {canCreate ? (
                    <button type="button" onClick={() => onDuplicate(r)} className="hover:text-violet-700">
                      {t('coreHr.reports.library.duplicate')}
                    </button>
                  ) : null}
                  {canEdit && !r.isSystem ? (
                    <button type="button" onClick={() => onArchive(r)} className="hover:text-red-600">
                      {t('coreHr.reports.library.archive')}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

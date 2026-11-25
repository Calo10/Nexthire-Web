import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import type { OrgLevel } from '../../models/organization';

type Props = {
  levels: OrgLevel[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

export default function OrgSettingsPanel({ levels, loading, error, onRetry }: Props) {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="space-y-3">
        <ErrorMessage message={error} />
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t('coreHr.organization.retry')}
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm" aria-label={t('coreHr.organization.settings.levelsTitle')}>
      <header className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-dark-text">{t('coreHr.organization.settings.levelsTitle')}</h3>
        <p className="text-xs text-gray-500">{t('coreHr.organization.settings.levelsHint')}</p>
      </header>
      {loading && levels.length === 0 ? (
        <div className="h-40 animate-pulse" />
      ) : levels.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <h4 className="text-base font-semibold text-dark-text">{t('coreHr.organization.settings.emptyTitle')}</h4>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{t('coreHr.organization.settings.emptyDescription')}</p>
        </div>
      ) : (
        <ol className="divide-y divide-gray-100">
          {levels.map((l, i) => (
            <li key={l.id} className={`flex items-center gap-4 px-4 py-3 ${l.isActive ? '' : 'opacity-60'}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
                {l.rank || i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-dark-text">
                  {l.name}
                  {l.code ? <span className="ml-2 text-xs font-normal text-gray-500">{l.code}</span> : null}
                </p>
                {l.description ? <p className="truncate text-xs text-gray-500">{l.description}</p> : null}
              </div>
              <span className="shrink-0 text-xs text-gray-500">{t('coreHr.organization.settings.positionCount', { count: l.positionCount })}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

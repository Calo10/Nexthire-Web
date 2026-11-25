import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import type { OrgPersonRef, ReportingOverview } from '../../models/organization';
import EmployeeAvatar from '../EmployeeAvatar';

type Props = {
  overview: ReportingOverview | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canManage: boolean;
  onChangeManager: (person: { id: string; name: string }) => void;
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-dark-text">{value}</p>
    </div>
  );
}

function Person({ person, subtitle, trailing }: { person: OrgPersonRef; subtitle?: string | null; trailing?: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <EmployeeAvatar name={person.name} seed={person.id} url={person.photoUrl} size="md" />
      <div className="min-w-0 flex-1">
        <Link to={`/app/hr/employees/${person.id}`} className="block truncate text-sm font-medium text-dark-text hover:text-teal-700">
          {person.name}
        </Link>
        <p className="truncate text-xs text-gray-500">{subtitle || person.jobTitle || ''}</p>
      </div>
      {trailing}
    </li>
  );
}

export default function OrgReportingPanel({ overview, loading, error, onRetry, canManage, onChangeManager }: Props) {
  const { t, i18n } = useTranslation();
  const nf = (n: number) => n.toLocaleString(i18n.language || 'en', { maximumFractionDigits: 1 });

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
  if (loading && !overview) {
    return <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />;
  }
  if (!overview) return null;

  const managers = [...overview.managers].sort((a, b) => b.directReports - a.directReports);
  const linkBtn = 'shrink-0 text-xs font-medium text-teal-700 hover:text-teal-800 focus:outline-none focus:underline';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t('coreHr.organization.reporting.avgSpan')} value={nf(overview.averageSpanOfControl)} />
        <Stat label={t('coreHr.organization.reporting.maxSpan')} value={nf(overview.maxSpanOfControl)} />
        <Stat label={t('coreHr.organization.reporting.managers')} value={overview.managerCount} />
        <Stat label={t('coreHr.organization.reporting.orphans')} value={overview.orphanCount} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm" aria-label={t('coreHr.organization.reporting.managersTitle')}>
          <header className="border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-dark-text">{t('coreHr.organization.reporting.managersTitle')}</h3>
            <p className="text-xs text-gray-500">{t('coreHr.organization.reporting.managersHint')}</p>
          </header>
          {managers.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500">{t('coreHr.organization.reporting.noManagers')}</p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto">
              {managers.map((m) => (
                <Person
                  key={m.id}
                  person={m}
                  subtitle={[m.jobTitle, m.departmentName].filter(Boolean).join(' · ')}
                  trailing={
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700" title={t('coreHr.organization.reporting.totalReports', { count: m.totalReports })}>
                        {t('coreHr.organization.reporting.directReports', { count: m.directReports })}
                      </span>
                      {canManage ? (
                        <button type="button" className={linkBtn} onClick={() => onChangeManager({ id: m.id, name: m.name })}>
                          {t('coreHr.organization.reporting.changeManager')}
                        </button>
                      ) : null}
                    </div>
                  }
                />
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm" aria-label={t('coreHr.organization.reporting.orphansTitle')}>
          <header className="border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-dark-text">{t('coreHr.organization.reporting.orphansTitle')}</h3>
            <p className="text-xs text-gray-500">{t('coreHr.organization.reporting.orphansHint')}</p>
          </header>
          {overview.orphans.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500">{t('coreHr.organization.reporting.noOrphans')}</p>
          ) : (
            <ul className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto">
              {overview.orphans.map((o) => (
                <Person
                  key={o.id}
                  person={o}
                  subtitle={[o.jobTitle, o.departmentName].filter(Boolean).join(' · ')}
                  trailing={
                    canManage ? (
                      <button type="button" className={linkBtn} onClick={() => onChangeManager({ id: o.id, name: o.name })}>
                        {t('coreHr.organization.reporting.assignManager')}
                      </button>
                    ) : null
                  }
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

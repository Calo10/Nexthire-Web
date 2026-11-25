import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import type { OrgLocation } from '../../models/organization';
import { formatLocationLine } from '../../utils/organizationFormat';

type Props = {
  locations: OrgLocation[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canManage: boolean;
  onAdd: () => void;
  onEdit: (location: OrgLocation) => void;
};

export default function OrgLocationsGrid({ locations, loading, error, onRetry, canManage, onAdd, onEdit }: Props) {
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
  if (loading && locations.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[140px] animate-pulse rounded-xl border border-gray-200 bg-white" />
        ))}
      </div>
    );
  }
  if (locations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
        <h2 className="text-base font-semibold text-dark-text">{t('coreHr.organization.locations.emptyTitle')}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{t('coreHr.organization.locations.emptyDescription')}</p>
        {canManage ? (
          <div className="mt-5">
            <Button size="sm" onClick={onAdd}>
              + {t('coreHr.organization.actions.addLocation')}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {locations.map((l) => {
        const line = formatLocationLine(l);
        return (
          <li key={l.id} className={`flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${l.isActive ? '' : 'opacity-60'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-dark-text">{l.name}</p>
                <p className="truncate text-xs text-gray-500">{line || l.addressLine || t('common.none')}</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                {l.isHeadquarters ? (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">{t('coreHr.organization.locations.headquarters')}</span>
                ) : null}
                {l.isRemote ? (
                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">{t('coreHr.organization.locations.remote')}</span>
                ) : null}
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-gray-50 py-2">
                <dd className="text-lg font-bold text-dark-text">{l.employeeCount}</dd>
                <dt className="text-[11px] text-gray-500">{t('coreHr.organization.locations.employees')}</dt>
              </div>
              <div className="rounded-lg bg-gray-50 py-2">
                <dd className="text-lg font-bold text-dark-text">{l.departmentCount}</dd>
                <dt className="text-[11px] text-gray-500">{t('coreHr.organization.locations.departments')}</dt>
              </div>
            </dl>
            {canManage ? (
              <button
                type="button"
                onClick={() => onEdit(l)}
                className="mt-3 self-start text-xs font-medium text-teal-700 hover:text-teal-800 focus:outline-none focus:underline"
              >
                {t('common.actions.edit')}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

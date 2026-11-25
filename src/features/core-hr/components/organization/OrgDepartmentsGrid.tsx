import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import type { DepartmentListItem } from '../../models/organization';
import { safeColor, tintColor } from '../../utils/organizationFormat';
import EmployeeAvatar from '../EmployeeAvatar';
import OrgDeptIcon from './OrgDeptIcon';

type Props = {
  departments: DepartmentListItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canManage: boolean;
  activeId?: string | null;
  onSelect: (dept: DepartmentListItem) => void;
  onAdd: () => void;
};

export default function OrgDepartmentsGrid({ departments, loading, error, onRetry, canManage, activeId, onSelect, onAdd }: Props) {
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
  if (loading && departments.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[176px] animate-pulse rounded-xl border border-gray-200 bg-white" />
        ))}
      </div>
    );
  }
  if (departments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
        <h2 className="text-base font-semibold text-dark-text">{t('coreHr.organization.departments.emptyTitle')}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{t('coreHr.organization.departments.emptyDescription')}</p>
        {canManage ? (
          <div className="mt-5">
            <Button size="sm" onClick={onAdd}>
              + {t('coreHr.organization.actions.addDepartment')}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {departments.map((d) => {
        const color = safeColor(d.color);
        const util = d.utilizationPercent;
        const active = d.id === activeId;
        return (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => onSelect(d)}
              aria-pressed={active}
              className={`flex h-full w-full flex-col rounded-xl border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                active ? 'border-teal-500 ring-2 ring-teal-500/30' : 'border-gray-200'
              } ${d.isActive ? '' : 'opacity-60'}`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: tintColor(color), color }}>
                  <OrgDeptIcon name={d.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-dark-text">{d.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {[d.code, d.parentDepartmentName].filter(Boolean).join(' · ') || t('coreHr.organization.departments.topLevel')}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {d.headName ? (
                  <>
                    <EmployeeAvatar name={d.headName} seed={d.headEmployeeId ?? undefined} url={d.headPhotoUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-dark-text">{d.headName}</p>
                      <p className="text-[11px] text-gray-500">{t('coreHr.organization.departments.head')}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">{t('coreHr.organization.chart.noHead')}</p>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 py-1.5">
                  <dd className="text-sm font-bold text-dark-text">{d.employeeCount}</dd>
                  <dt className="text-[11px] text-gray-500">{t('coreHr.organization.departments.employees')}</dt>
                </div>
                <div className="rounded-lg bg-gray-50 py-1.5">
                  <dd className="text-sm font-bold text-dark-text">{d.positionCount}</dd>
                  <dt className="text-[11px] text-gray-500">{t('coreHr.organization.departments.positions')}</dt>
                </div>
                <div className="rounded-lg bg-gray-50 py-1.5">
                  <dd className="text-sm font-bold text-dark-text">{d.openPositionCount}</dd>
                  <dt className="text-[11px] text-gray-500">{t('coreHr.organization.departments.open')}</dt>
                </div>
              </dl>
              {util != null ? (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px] text-gray-500">
                    <span>{t('coreHr.organization.departments.utilization')}</span>
                    <span className="font-medium text-dark-text">{Math.round(util)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, Math.max(0, util))}%` }} />
                  </div>
                </div>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

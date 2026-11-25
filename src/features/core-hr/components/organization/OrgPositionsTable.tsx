import { useTranslation } from 'react-i18next';
import type { OrgPosition } from '../../models/organization';
import { OCCUPANCY_CLASSES, positionStatusTone } from '../../utils/organizationFormat';
import EmployeeAvatar from '../EmployeeAvatar';

type Props = {
  items: OrgPosition[];
  loading: boolean;
  activeId?: string | null;
  /** Hide the department column when the list is already scoped to one department. */
  hideDepartment?: boolean;
  onOpen: (position: OrgPosition) => void;
};

export default function OrgPositionsTable({ items, loading, activeId, hideDepartment, onOpen }: Props) {
  const { t } = useTranslation();
  const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500';

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm" aria-busy={loading}>
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className={th}>{t('coreHr.organization.positions.columns.position')}</th>
            {hideDepartment ? null : <th scope="col" className={th}>{t('coreHr.organization.positions.columns.department')}</th>}
            <th scope="col" className={th}>{t('coreHr.organization.positions.columns.level')}</th>
            <th scope="col" className={th}>{t('coreHr.organization.positions.columns.location')}</th>
            <th scope="col" className={th}>{t('coreHr.organization.positions.columns.occupants')}</th>
            <th scope="col" className={th}>{t('coreHr.organization.positions.columns.status')}</th>
          </tr>
        </thead>
        <tbody className={`divide-y divide-gray-100 bg-white ${loading ? 'opacity-60' : ''}`}>
          {items.map((p) => {
            const tone = positionStatusTone(p);
            const shown = p.occupants.slice(0, 3);
            return (
              <tr
                key={p.id}
                tabIndex={0}
                onClick={() => onOpen(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpen(p);
                  }
                }}
                className={`cursor-pointer hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 ${
                  p.id === activeId ? 'bg-teal-50/60' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-dark-text">{p.title}</p>
                  {p.code ? <p className="text-xs text-gray-500">{p.code}</p> : null}
                </td>
                {hideDepartment ? null : <td className="px-4 py-3 text-gray-700">{p.departmentName ?? t('common.none')}</td>}
                <td className="px-4 py-3 text-gray-700">{p.levelName ?? t('common.none')}</td>
                <td className="px-4 py-3 text-gray-700">{p.locationName ?? t('common.none')}</td>
                <td className="px-4 py-3">
                  {shown.length === 0 ? (
                    <span className="text-gray-400">{t('common.none')}</span>
                  ) : (
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {shown.map((o) => (
                          <EmployeeAvatar key={o.id} name={o.name} seed={o.id} url={o.photoUrl} size="xs" className="ring-2 ring-white" />
                        ))}
                      </div>
                      <span className="ml-2 max-w-[140px] truncate text-xs text-gray-600">
                        {shown[0].name}
                        {p.occupants.length > 1 ? ` +${p.occupants.length - 1}` : ''}
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${OCCUPANCY_CLASSES[tone]}`}>
                    {t('coreHr.organization.positions.occupancy', { filled: p.filledCount, total: p.headcount })}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

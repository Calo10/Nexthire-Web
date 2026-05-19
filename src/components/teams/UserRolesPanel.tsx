import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import type { Role, UserRoleAssignment } from '../../types/teams';

interface UserRolesPanelProps {
  selectedUserLabel: string | null;
  rolesCatalog: Role[];
  assigned: UserRoleAssignment[];
  catalogLoading: boolean;
  assignedLoading: boolean;
  error: string | null;
  onAssign: (roleId: string) => Promise<void>;
  onRemove: (roleId: string) => void;
  busyRoleId: string | null;
}

export default function UserRolesPanel({
  selectedUserLabel,
  rolesCatalog,
  assigned,
  catalogLoading,
  assignedLoading,
  error,
  onAssign,
  onRemove,
  busyRoleId,
}: UserRolesPanelProps) {
  const { t } = useTranslation();
  const [pickRoleId, setPickRoleId] = useState('');

  const assignedIds = useMemo(() => new Set(assigned.map((a) => a.roleId)), [assigned]);

  const assignable = useMemo(
    () => rolesCatalog.filter((r) => !assignedIds.has(r.id)),
    [rolesCatalog, assignedIds]
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickRoleId) return;
    await onAssign(pickRoleId);
    setPickRoleId('');
  };

  return (
    <div className="flex flex-col h-full min-h-[280px] border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/80">
        <h2 className="text-base font-semibold text-dark-text">{t('teams.roles.title')}</h2>
        {selectedUserLabel ? (
          <p className="text-xs text-gray-500 truncate mt-0.5">{selectedUserLabel}</p>
        ) : (
          <p className="text-xs text-gray-500 mt-0.5">{t('teams.selectMember')}</p>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-6">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t('teams.roles.assigned')}</h3>
          {assignedLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !selectedUserLabel ? (
            <p className="text-sm text-gray-500">{t('teams.selectMember')}</p>
          ) : assigned.length === 0 ? (
            <p className="text-sm text-gray-500">{t('teams.roles.empty')}</p>
          ) : (
            <ul className="space-y-2">
              {assigned.map((a) => (
                <li
                  key={a.roleId}
                  className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-gray-100 bg-gray-50/50"
                >
                  <span className="text-sm text-dark-text truncate">
                    {a.roleName ?? rolesCatalog.find((r) => r.id === a.roleId)?.name ?? a.roleId}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-600 hover:text-red-800 shrink-0 disabled:opacity-50"
                    disabled={busyRoleId === a.roleId}
                    onClick={() => onRemove(a.roleId)}
                  >
                    {t('teams.actions.removeRole')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{t('teams.roles.catalog')}</h3>
          {catalogLoading ? (
            <p className="text-sm text-gray-500">{t('common.loading')}</p>
          ) : assignable.length === 0 && rolesCatalog.length > 0 ? (
            <p className="text-sm text-gray-500">{t('teams.roles.allAssigned')}</p>
          ) : rolesCatalog.length === 0 ? (
            <p className="text-sm text-gray-500">{t('teams.roles.emptyCatalog')}</p>
          ) : !selectedUserLabel ? (
            <p className="text-sm text-gray-500">{t('teams.selectMember')}</p>
          ) : (
            <form onSubmit={handleAssign} className="flex flex-col sm:flex-row gap-2">
              <select
                value={pickRoleId}
                onChange={(e) => setPickRoleId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('teams.roles.role')}</option>
                {assignable.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" disabled={!pickRoleId || busyRoleId !== null}>
                {t('teams.actions.addRole')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import Button from '../Button';
import type { OrgUser } from '../../types/orgUsers';
import { orgUserDisplayName } from '../../types/orgUsers';

interface OrgUsersPanelProps {
  users: OrgUser[];
  isLoading: boolean;
  error: string | null;
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
  onInviteUser: () => void;
}

function formatRoles(user: OrgUser): string {
  if (!user.roles?.length) return '';
  return user.roles
    .map((r) => r.roleName ?? r.roleCode ?? '')
    .filter(Boolean)
    .join(', ');
}

function formatStatus(status: string | undefined, t: (key: string) => string): string {
  if (!status) return t('common.none');
  const key = `teams.members.status.${status}`;
  const translated = t(key);
  return translated !== key ? translated : status;
}

export default function OrgUsersPanel({
  users,
  isLoading,
  error,
  selectedUserId,
  onSelectUser,
  onInviteUser,
}: OrgUsersPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full min-h-[280px] border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50/80">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-dark-text truncate">{t('teams.orgUsers.title')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t('teams.orgUsers.subtitle')}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onInviteUser}>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('teams.actions.inviteUser')}
          </span>
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-gray-500">{t('teams.orgUsers.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="pb-2 pr-2 font-medium">{t('teams.members.name')}</th>
                  <th className="pb-2 pr-2 font-medium hidden sm:table-cell">{t('teams.members.email')}</th>
                  <th className="pb-2 pr-2 font-medium hidden md:table-cell">{t('teams.members.appRoles')}</th>
                  <th className="pb-2 font-medium w-28">{t('teams.members.statusLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedUserId === user.id ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => onSelectUser(user.id)}
                  >
                    <td className="py-2 pr-2 font-medium text-dark-text">{orgUserDisplayName(user)}</td>
                    <td className="py-2 pr-2 text-gray-600 hidden sm:table-cell">{user.email}</td>
                    <td className="py-2 pr-2 text-gray-600 hidden md:table-cell">
                      {formatRoles(user) || t('common.none')}
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : user.status === 'pending_invite'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {formatStatus(user.status, t)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

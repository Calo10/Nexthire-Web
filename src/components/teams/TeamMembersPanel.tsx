import { useTranslation } from 'react-i18next';
import Button from '../Button';
import type { TeamMember } from '../../types/teams';

interface TeamMembersPanelProps {
  teamName: string;
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;
  selectedUserId: string | null;
  onSelectMember: (userId: string) => void;
  onAddToTeam: () => void;
  onRemoveMember: (userId: string) => void;
  onToggleLead: (userId: string, next: boolean) => void;
  busyUserId: string | null;
}

export default function TeamMembersPanel({
  teamName,
  members,
  isLoading,
  error,
  selectedUserId,
  onSelectMember,
  onAddToTeam,
  onRemoveMember,
  onToggleLead,
  busyUserId,
}: TeamMembersPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full min-h-[280px] border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50/80">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-dark-text truncate">{t('teams.teamMembers.title')}</h2>
          <p className="text-xs text-gray-500 truncate mt-0.5">{teamName}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onAddToTeam}>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('teams.actions.addToTeam')}
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
        ) : members.length === 0 ? (
          <p className="text-sm text-gray-500">{t('teams.teamMembers.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="pb-2 pr-2 font-medium">{t('teams.members.name')}</th>
                  <th className="pb-2 pr-2 font-medium hidden sm:table-cell">{t('teams.members.email')}</th>
                  <th className="pb-2 pr-2 font-medium w-24">{t('teams.members.lead')}</th>
                  <th className="pb-2 text-right font-medium w-28">{t('teams.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.userId}
                    className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedUserId === m.userId ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => onSelectMember(m.userId)}
                  >
                    <td className="py-2 pr-2 font-medium text-dark-text">{m.displayName}</td>
                    <td className="py-2 pr-2 text-gray-600 hidden sm:table-cell">{m.email ?? t('common.none')}</td>
                    <td className="py-2 pr-2" onClick={(e) => e.stopPropagation()}>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={m.isTeamLead}
                          disabled={busyUserId === m.userId}
                          onChange={(e) => onToggleLead(m.userId, e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </label>
                    </td>
                    <td className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                        disabled={busyUserId === m.userId}
                        onClick={() => onRemoveMember(m.userId)}
                      >
                        {t('teams.actions.removeMember')}
                      </button>
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

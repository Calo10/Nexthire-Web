import { useTranslation } from 'react-i18next';
import type { Team } from '../../types/teams';

interface TeamsTableProps {
  teams: Team[];
  isLoading: boolean;
  selectedTeamId: string | null;
  onView: (team: Team) => void;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
}

export default function TeamsTable({
  teams,
  isLoading,
  selectedTeamId,
  onView,
  onEdit,
  onDelete,
}: TeamsTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-14 px-6 text-gray-500">
        <p className="text-sm">{t('teams.empty')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80">
            <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">{t('teams.table.name')}</th>
            <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">{t('teams.table.description')}</th>
            <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">{t('teams.table.status')}</th>
            <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">{t('teams.table.members')}</th>
            <th className="text-right py-3 px-6 text-sm font-semibold text-gray-700">{t('teams.table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr
              key={team.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                selectedTeamId === team.id ? 'bg-primary/5' : ''
              }`}
            >
              <td className="py-3 px-6">
                <span className="text-sm font-medium text-dark-text">{team.name}</span>
              </td>
              <td className="py-3 px-6 max-w-xs">
                <span className="text-sm text-gray-600 line-clamp-2">
                  {team.description?.trim() ? team.description : t('common.none')}
                </span>
              </td>
              <td className="py-3 px-6">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    team.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {team.isActive ? t('teams.status.active') : t('teams.status.inactive')}
                </span>
              </td>
              <td className="py-3 px-6">
                <span className="text-sm text-gray-600">
                  {team.memberCount !== undefined ? team.memberCount : t('common.none')}
                </span>
              </td>
              <td className="py-3 px-6 text-right">
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onView(team)}
                    className="text-sm font-medium text-primary hover:text-purple-700"
                  >
                    {t('teams.actions.view')}
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => onEdit(team)}
                    className="text-sm font-medium text-gray-700 hover:text-dark-text"
                  >
                    {t('teams.actions.edit')}
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => onDelete(team)}
                    className="text-sm font-medium text-red-600 hover:text-red-800"
                  >
                    {t('teams.actions.delete')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import { teamsApi } from '../../api/teamsApi';
import type { OrgUser } from '../../types/orgUsers';
import { orgUserDisplayName } from '../../types/orgUsers';

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  orgUsers: OrgUser[];
  orgUsersLoading: boolean;
  existingMemberIds: string[];
  onAdded: (userId: string) => Promise<void>;
}

export default function AddTeamMemberModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  orgUsers,
  orgUsersLoading,
  existingMemberIds,
  onAdded,
}: AddTeamMemberModalProps) {
  const { t } = useTranslation();
  const [userId, setUserId] = useState('');
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberIdSet = useMemo(() => new Set(existingMemberIds), [existingMemberIds]);

  const eligibleUsers = useMemo(
    () => orgUsers.filter((u) => !memberIdSet.has(u.id)),
    [orgUsers, memberIdSet]
  );

  useEffect(() => {
    if (!isOpen) {
      setUserId('');
      setIsTeamLead(false);
      setSubmitting(false);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setError(null);
    setSubmitting(true);
    try {
      await teamsApi.addTeamMember(teamId, { userId, isTeamLead });
      await onAdded(userId);
      onClose();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : t('teams.errors.member');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('teams.addToTeam.title')}
      subtitle={t('teams.addToTeam.subtitle', { team: teamName })}
      width="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" form="add-team-member-form" disabled={!userId || submitting || eligibleUsers.length === 0}>
            {submitting ? t('common.actions.saving') : t('teams.actions.addToTeam')}
          </Button>
        </>
      }
    >
      <form id="add-team-member-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        <p className="text-sm text-gray-600">{t('teams.addToTeam.hint')}</p>

        {orgUsersLoading ? (
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        ) : eligibleUsers.length === 0 ? (
          <p className="text-sm text-gray-500">{t('teams.addToTeam.noEligible')}</p>
        ) : (
          <>
            <div>
              <label htmlFor="add-team-member-user" className="block text-sm font-medium text-gray-700 mb-1">
                {t('teams.addToTeam.selectUser')}
              </label>
              <select
                id="add-team-member-user"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{t('teams.addToTeam.selectPlaceholder')}</option>
                {eligibleUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {orgUserDisplayName(u)} · {u.email}
                  </option>
                ))}
              </select>
            </div>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isTeamLead}
                onChange={(e) => setIsTeamLead(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{t('teams.actions.teamLead')}</span>
            </label>
          </>
        )}
      </form>
    </Modal>
  );
}

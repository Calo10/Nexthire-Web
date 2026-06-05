import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ErrorMessage from '../components/ErrorMessage';
import TeamFormModal from '../components/teams/TeamFormModal';
import TeamsTable from '../components/teams/TeamsTable';
import TeamMembersPanel from '../components/teams/TeamMembersPanel';
import OrgUsersPanel from '../components/teams/OrgUsersPanel';
import UserRolesPanel from '../components/teams/UserRolesPanel';
import CreateOrgUserModal from '../components/teams/CreateOrgUserModal';
import AddTeamMemberModal from '../components/teams/AddTeamMemberModal';
import { useAuth } from '../contexts/AuthContext';
import { useTeams } from '../hooks/useTeams';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { useOrgUsers } from '../hooks/useOrgUsers';
import { useRoles } from '../hooks/useRoles';
import { orgUserDisplayName } from '../types/orgUsers';
import { useUserRoles } from '../hooks/useUserRoles';
import { teamsApi } from '../api/teamsApi';
import { rolesApi } from '../api/rolesApi';
import type { Team } from '../types/teams';

export default function TeamsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const shouldFetch = isAuthenticated && !authLoading;

  const { data: teams, isLoading: teamsLoading, error: teamsError, refetch: refetchTeams } = useTeams(shouldFetch);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedMemberUserId, setSelectedMemberUserId] = useState<string | null>(null);

  const {
    data: teamMembers,
    isLoading: teamMembersLoading,
    error: teamMembersError,
    refetch: refetchTeamMembers,
  } = useTeamMembers(selectedTeamId, shouldFetch);

  const {
    data: orgUsers,
    isLoading: orgUsersLoading,
    error: orgUsersError,
    refetch: refetchOrgUsers,
  } = useOrgUsers(shouldFetch);

  const { data: rolesCatalog, isLoading: rolesLoading, error: rolesError } = useRoles(shouldFetch);

  const {
    data: userRoles,
    isLoading: userRolesLoading,
    error: userRolesError,
    refetch: refetchUserRoles,
  } = useUserRoles(selectedMemberUserId, shouldFetch);

  const selectedTeam = useMemo(
    () => (selectedTeamId ? teams.find((x) => x.id === selectedTeamId) ?? null : null),
    [teams, selectedTeamId]
  );

  const teamsForTable = useMemo(
    () =>
      teams.map((team) =>
        team.id === selectedTeamId ? { ...team, memberCount: teamMembers.length } : team
      ),
    [teams, selectedTeamId, teamMembers]
  );

  const selectedOrgUser = useMemo(
    () => (selectedMemberUserId ? orgUsers.find((u) => u.id === selectedMemberUserId) ?? null : null),
    [orgUsers, selectedMemberUserId]
  );

  const selectedTeamMember = useMemo(
    () => (selectedMemberUserId ? teamMembers.find((m) => m.userId === selectedMemberUserId) ?? null : null),
    [teamMembers, selectedMemberUserId]
  );

  const selectedUserLabel = useMemo(() => {
    if (selectedOrgUser) {
      return `${orgUserDisplayName(selectedOrgUser)}${selectedOrgUser.email ? ` · ${selectedOrgUser.email}` : ''}`;
    }
    if (selectedTeamMember) {
      return `${selectedTeamMember.displayName}${selectedTeamMember.email ? ` · ${selectedTeamMember.email}` : ''}`;
    }
    return null;
  }, [selectedOrgUser, selectedTeamMember]);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formTeam, setFormTeam] = useState<Team | null>(null);

  const [inviteUserOpen, setInviteUserOpen] = useState(false);
  const [addToTeamOpen, setAddToTeamOpen] = useState(false);
  const [deleteTeamOpen, setDeleteTeamOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [removeRoleOpen, setRemoveRoleOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<string | null>(null);

  const [memberBusyUserId, setMemberBusyUserId] = useState<string | null>(null);
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const err = teamsError;
    if (!err) return;
    if ((err as { status?: number }).status === 401) {
      logout();
      navigate('/login', { replace: true });
    }
  }, [teamsError, logout, navigate]);

  useEffect(() => {
    if (!selectedTeamId) return;
    if (!teamsLoading && teams.every((x) => x.id !== selectedTeamId)) {
      setSelectedTeamId(null);
      setSelectedMemberUserId(null);
    }
  }, [teams, teamsLoading, selectedTeamId]);

  useEffect(() => {
    if (!selectedMemberUserId) return;
    const inOrg = orgUsers.some((u) => u.id === selectedMemberUserId);
    const inTeam = selectedTeamId ? teamMembers.some((m) => m.userId === selectedMemberUserId) : false;
    if (!orgUsersLoading && !teamMembersLoading && !inOrg && !inTeam) {
      setSelectedMemberUserId(null);
    }
  }, [orgUsers, teamMembers, orgUsersLoading, teamMembersLoading, selectedMemberUserId, selectedTeamId]);

  const handleView = (team: Team) => {
    setSelectedTeamId(team.id);
    setSelectedMemberUserId(null);
  };

  const handleEdit = (team: Team) => {
    setFormMode('edit');
    setFormTeam(team);
    setFormOpen(true);
  };

  const handleNewTeam = () => {
    setFormMode('create');
    setFormTeam(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload: { name: string; description: string; isActive: boolean }) => {
    setPageError(null);
    try {
      if (formMode === 'create') {
        const created = await teamsApi.createTeam({
          name: payload.name,
          description: payload.description || null,
          isActive: payload.isActive,
        });
        refetchTeams();
        setSelectedTeamId(created.id);
        setSelectedMemberUserId(null);
      } else if (formTeam) {
        await teamsApi.updateTeam(formTeam.id, {
          name: payload.name,
          description: payload.description || null,
          isActive: payload.isActive,
        });
        refetchTeams();
      }
      setFormOpen(false);
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setPageError((e as { message?: string }).message || t('teams.errors.saveTeam'));
    }
  };

  const requestDeleteTeam = (team: Team) => {
    setTeamToDelete(team);
    setDeleteTeamOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    setPageError(null);
    try {
      await teamsApi.deleteTeam(teamToDelete.id);
      if (selectedTeamId === teamToDelete.id) {
        setSelectedTeamId(null);
        setSelectedMemberUserId(null);
      }
      setDeleteTeamOpen(false);
      setTeamToDelete(null);
      refetchTeams();
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setPageError((e as { message?: string }).message || t('teams.errors.deleteTeam'));
    }
  };

  const assignUserToTeam = async (userId: string) => {
    if (!selectedTeamId) return;
    await teamsApi.addTeamMember(selectedTeamId, { userId, isTeamLead: false });
    refetchTeamMembers();
    refetchTeams();
  };

  const handleOrgUserCreated = async (userId: string) => {
    setPageError(null);
    refetchOrgUsers();
    setSelectedMemberUserId(userId);
    if (!selectedTeamId) return;
    try {
      await assignUserToTeam(userId);
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setPageError((e as { message?: string }).message || t('teams.errors.member'));
      throw e;
    }
  };

  const handleTeamMemberAdded = async (userId: string) => {
    setPageError(null);
    refetchTeamMembers();
    refetchTeams();
    setSelectedMemberUserId(userId);
  };

  const requestRemoveMember = (userId: string) => {
    setMemberToRemove(userId);
    setRemoveMemberOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!selectedTeamId || !memberToRemove) return;
    setPageError(null);
    try {
      await teamsApi.removeTeamMember(selectedTeamId, memberToRemove);
      if (selectedMemberUserId === memberToRemove) setSelectedMemberUserId(null);
      setRemoveMemberOpen(false);
      setMemberToRemove(null);
      refetchTeamMembers();
      refetchTeams();
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setPageError((e as { message?: string }).message || t('teams.errors.member'));
    }
  };

  const handleToggleLead = async (userId: string, next: boolean) => {
    if (!selectedTeamId) return;
    setMemberBusyUserId(userId);
    setPageError(null);
    try {
      await teamsApi.setTeamMemberLead(selectedTeamId, userId, next);
      refetchTeamMembers();
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setPageError((e as { message?: string }).message || t('teams.errors.member'));
    } finally {
      setMemberBusyUserId(null);
    }
  };

  const handleAssignRole = async (roleId: string) => {
    if (!selectedMemberUserId) return;
    setRoleBusyId(roleId);
    setPageError(null);
    try {
      await rolesApi.assignUserRole(selectedMemberUserId, { roleId });
      refetchUserRoles();
      refetchOrgUsers();
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setPageError((e as { message?: string }).message || t('teams.errors.assignRole'));
    } finally {
      setRoleBusyId(null);
    }
  };

  const requestRemoveRole = useCallback((roleId: string) => {
    setRoleToRemove(roleId);
    setRemoveRoleOpen(true);
  }, []);

  const confirmRemoveRole = async () => {
    if (!selectedMemberUserId || !roleToRemove) return;
    setPageError(null);
    try {
      await rolesApi.removeUserRole(selectedMemberUserId, roleToRemove);
      setRemoveRoleOpen(false);
      setRoleToRemove(null);
      refetchUserRoles();
      refetchOrgUsers();
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setPageError((e as { message?: string }).message || t('teams.errors.removeRole'));
    }
  };

  const teamMembersErrorMsg = teamMembersError
    ? (teamMembersError as { message?: string }).message || t('teams.errors.loadMembers')
    : null;
  const orgUsersErrorMsg = orgUsersError
    ? (orgUsersError as { message?: string }).message || t('teams.errors.loadOrgUsers')
    : null;
  const rolesErrMsg = rolesError ? (rolesError as { message?: string }).message || t('teams.errors.loadRoles') : null;
  const userRolesErrMsg = userRolesError
    ? (userRolesError as { message?: string }).message || t('teams.errors.loadUserRoles')
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <TopBar />

      <div className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-dark-text">{t('teams.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('teams.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="md" onClick={() => setInviteUserOpen(true)}>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                {t('teams.inviteUser.button')}
              </span>
            </Button>
            <Button variant="primary" size="md" onClick={handleNewTeam}>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('teams.newTeam')}
              </span>
            </Button>
          </div>
        </div>

        {teamsError ? (
          <div className="mb-6">
            <ErrorMessage message={(teamsError as { message?: string }).message || t('teams.errors.loadTeams')} />
          </div>
        ) : null}

        {pageError ? (
          <div className="mb-6">
            <ErrorMessage message={pageError} />
          </div>
        ) : null}

        <Card className="p-0 overflow-hidden">
          <TeamsTable
            teams={teamsForTable}
            isLoading={teamsLoading}
            selectedTeamId={selectedTeamId}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={requestDeleteTeam}
          />
        </Card>

        {selectedTeam ? (
          <div className="mt-6">
            <TeamMembersPanel
              teamName={selectedTeam.name}
              members={teamMembers}
              isLoading={teamMembersLoading}
              error={teamMembersErrorMsg}
              selectedUserId={selectedMemberUserId}
              onSelectMember={setSelectedMemberUserId}
              onAddToTeam={() => setAddToTeamOpen(true)}
              onRemoveMember={requestRemoveMember}
              onToggleLead={handleToggleLead}
              busyUserId={memberBusyUserId}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <OrgUsersPanel
            users={orgUsers}
            isLoading={orgUsersLoading}
            error={orgUsersErrorMsg}
            selectedUserId={selectedMemberUserId}
            onSelectUser={setSelectedMemberUserId}
            onInviteUser={() => setInviteUserOpen(true)}
          />

          <UserRolesPanel
            selectedUserLabel={selectedUserLabel}
            rolesCatalog={rolesCatalog}
            assigned={userRoles}
            catalogLoading={rolesLoading}
            assignedLoading={!!selectedMemberUserId && userRolesLoading}
            error={rolesErrMsg || userRolesErrMsg}
            onAssign={handleAssignRole}
            onRemove={requestRemoveRole}
            busyRoleId={roleBusyId}
          />
        </div>
      </div>

      <TeamFormModal
        isOpen={formOpen}
        mode={formMode}
        team={formTeam}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <CreateOrgUserModal
        isOpen={inviteUserOpen}
        onClose={() => setInviteUserOpen(false)}
        roles={rolesCatalog}
        rolesLoading={rolesLoading}
        teamName={selectedTeam?.name ?? null}
        onCreated={handleOrgUserCreated}
      />

      {selectedTeam ? (
        <AddTeamMemberModal
          isOpen={addToTeamOpen}
          onClose={() => setAddToTeamOpen(false)}
          teamId={selectedTeam.id}
          teamName={selectedTeam.name}
          orgUsers={orgUsers}
          orgUsersLoading={orgUsersLoading}
          existingMemberIds={teamMembers.map((m) => m.userId)}
          onAdded={handleTeamMemberAdded}
        />
      ) : null}

      <Modal
        isOpen={deleteTeamOpen}
        onClose={() => {
          setDeleteTeamOpen(false);
          setTeamToDelete(null);
        }}
        title={t('common.actions.delete')}
        subtitle={teamToDelete?.name}
        width="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTeamOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-600"
              onClick={confirmDeleteTeam}
            >
              {t('common.actions.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">{t('teams.confirm.deleteTeam')}</p>
      </Modal>

      <Modal
        isOpen={removeMemberOpen}
        onClose={() => {
          setRemoveMemberOpen(false);
          setMemberToRemove(null);
        }}
        title={t('teams.actions.removeMember')}
        width="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoveMemberOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-600"
              onClick={confirmRemoveMember}
            >
              {t('teams.actions.removeMember')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">{t('teams.confirm.removeMember')}</p>
      </Modal>

      <Modal
        isOpen={removeRoleOpen}
        onClose={() => {
          setRemoveRoleOpen(false);
          setRoleToRemove(null);
        }}
        title={t('teams.actions.removeRole')}
        width="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoveRoleOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-600"
              onClick={confirmRemoveRole}
            >
              {t('teams.actions.removeRole')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">{t('teams.confirm.removeRole')}</p>
      </Modal>
    </div>
  );
}

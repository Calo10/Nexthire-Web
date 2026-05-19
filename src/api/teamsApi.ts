import type { ApiError } from '../lib/api';
import { apiClient } from '../lib/api';
import type {
  AddTeamMemberPayload,
  CreateTeamPayload,
  Team,
  TeamMember,
  UpdateTeamPayload,
} from '../types/teams';

function numOrUndef(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

function normalizeTeam(raw: Record<string, unknown> | null | undefined): Team | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? raw.teamId ?? '');
  const name = String(raw.name ?? '').trim();
  if (!id || !name) return null;
  let isActive = true;
  if (typeof raw.isActive === 'boolean') isActive = raw.isActive;
  else if (typeof raw.active === 'boolean') isActive = raw.active;
  else if (typeof raw.is_active === 'boolean') isActive = raw.is_active;
  return {
    id,
    name,
    description: raw.description != null ? String(raw.description) : null,
    isActive,
    memberCount: numOrUndef(raw.memberCount ?? raw.member_count ?? raw.membersCount),
  };
}

function normalizeTeamsResponse(result: unknown): Team[] {
  const rawItems: unknown[] = Array.isArray(result)
    ? result
    : result && typeof result === 'object'
      ? Array.isArray((result as { items?: unknown }).items)
        ? ((result as { items: unknown[] }).items as unknown[])
        : Array.isArray((result as { data?: unknown }).data)
          ? ((result as { data: unknown[] }).data as unknown[])
          : []
      : [];
  return rawItems
    .map((r) => normalizeTeam(r as Record<string, unknown>))
    .filter(Boolean) as Team[];
}

function normalizeMember(raw: Record<string, unknown> | null | undefined): TeamMember | null {
  if (!raw || typeof raw !== 'object') return null;
  const userId = String(raw.userId ?? raw.user_id ?? raw.id ?? '');
  if (!userId) return null;
  const isTeamLead =
    typeof raw.isTeamLead === 'boolean'
      ? raw.isTeamLead
      : typeof raw.is_team_lead === 'boolean'
        ? raw.is_team_lead
        : Boolean(raw.teamLead ?? raw.team_lead);
  return {
    userId,
    displayName: String(raw.displayName ?? raw.display_name ?? raw.name ?? raw.email ?? 'User'),
    email: raw.email != null ? String(raw.email) : undefined,
    isTeamLead,
  };
}

function normalizeMembersResponse(result: unknown): TeamMember[] {
  const rawItems: unknown[] = Array.isArray(result)
    ? result
    : result && typeof result === 'object'
      ? Array.isArray((result as { items?: unknown }).items)
        ? ((result as { items: unknown[] }).items as unknown[])
        : Array.isArray((result as { data?: unknown }).data)
          ? ((result as { data: unknown[] }).data as unknown[])
          : []
      : [];
  return rawItems
    .map((r) => normalizeMember(r as Record<string, unknown>))
    .filter(Boolean) as TeamMember[];
}

export const teamsApi = {
  getTeams: async (): Promise<Team[]> => {
    const result = await apiClient.get<unknown>('/teams', true);
    return normalizeTeamsResponse(result);
  },

  getTeamById: async (teamId: string): Promise<Team> => {
    const result = await apiClient.get<unknown>(`/teams/${encodeURIComponent(teamId)}`, true);
    const t = normalizeTeam(result as Record<string, unknown>);
    if (!t) {
      const err: ApiError = { message: 'Invalid team response' };
      throw err;
    }
    return t;
  },

  createTeam: async (payload: CreateTeamPayload): Promise<Team> => {
    const body = {
      name: payload.name,
      description: payload.description ?? null,
      isActive: payload.isActive ?? true,
    };
    const result = await apiClient.post<unknown>('/teams', body, true);
    const t = normalizeTeam(result as Record<string, unknown>);
    if (!t) {
      const err: ApiError = { message: 'Team created but response was invalid' };
      throw err;
    }
    return t;
  },

  updateTeam: async (teamId: string, payload: UpdateTeamPayload): Promise<Team> => {
    const result = await apiClient.put<unknown>(`/teams/${encodeURIComponent(teamId)}`, payload, true);
    const t = normalizeTeam(result as Record<string, unknown>);
    if (!t) {
      const err: ApiError = { message: 'Invalid team response' };
      throw err;
    }
    return t;
  },

  deleteTeam: async (teamId: string): Promise<void> => {
    await apiClient.delete<void>(`/teams/${encodeURIComponent(teamId)}`, true);
  },

  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const result = await apiClient.get<unknown>(`/teams/${encodeURIComponent(teamId)}/members`, true);
    return normalizeMembersResponse(result);
  },

  addTeamMember: async (teamId: string, payload: AddTeamMemberPayload): Promise<TeamMember> => {
    const body = {
      userId: payload.userId,
      isTeamLead: payload.isTeamLead ?? false,
    };
    const result = await apiClient.post<unknown>(
      `/teams/${encodeURIComponent(teamId)}/members`,
      body,
      true
    );
    const m = normalizeMember(result as Record<string, unknown>);
    if (!m) {
      const err: ApiError = { message: 'Member added but response was invalid' };
      throw err;
    }
    return m;
  },

  removeTeamMember: async (teamId: string, userId: string): Promise<void> => {
    await apiClient.delete<void>(
      `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
      true
    );
  },

  /** Toggle team lead on a membership (PATCH — common REST shape). */
  setTeamMemberLead: async (teamId: string, userId: string, isTeamLead: boolean): Promise<TeamMember> => {
    const result = await apiClient.patch<unknown>(
      `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
      { isTeamLead },
      true
    );
    const m = normalizeMember(result as Record<string, unknown>);
    if (!m) {
      const err: ApiError = { message: 'Could not update team member' };
      throw err;
    }
    return m;
  },
};

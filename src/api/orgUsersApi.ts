import { apiClient } from '../lib/api';
import type {
  CreateOrgUserPayload,
  CreateOrgUserResponse,
  OrgUser,
  OrgUserRole,
  OrgUserSummary,
} from '../types/orgUsers';

function normalizeOrgUserRole(raw: Record<string, unknown>): OrgUserRole {
  return {
    userId: raw.userId != null ? String(raw.userId) : raw.user_id != null ? String(raw.user_id) : undefined,
    roleId: raw.roleId != null ? String(raw.roleId) : raw.role_id != null ? String(raw.role_id) : undefined,
    roleCode: raw.roleCode != null ? String(raw.roleCode) : raw.role_code != null ? String(raw.role_code) : undefined,
    roleName: raw.roleName != null ? String(raw.roleName) : raw.role_name != null ? String(raw.role_name) : undefined,
    assignedAt:
      raw.assignedAt != null
        ? String(raw.assignedAt)
        : raw.assigned_at != null
          ? String(raw.assigned_at)
          : undefined,
  };
}

function normalizeOrgUser(raw: unknown): OrgUser | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  const id = String(u.id ?? u.userId ?? u.user_id ?? '');
  const email = String(u.email ?? '').trim();
  if (!id || !email) return null;
  const firstName = String(u.firstName ?? u.first_name ?? '').trim();
  const lastName = String(u.lastName ?? u.last_name ?? '').trim();
  const phoneRaw = u.phone;
  return {
    id,
    nexaUserId:
      u.nexaUserId != null
        ? String(u.nexaUserId)
        : u.nexa_user_id != null
          ? String(u.nexa_user_id)
          : undefined,
    email,
    firstName,
    lastName,
    phone: phoneRaw == null ? null : String(phoneRaw),
    nexaOrgRole:
      u.nexaOrgRole != null
        ? String(u.nexaOrgRole)
        : u.nexa_org_role != null
          ? String(u.nexa_org_role)
          : undefined,
    status: u.status != null ? String(u.status) : undefined,
    roles: Array.isArray(u.roles)
      ? (u.roles as Array<Record<string, unknown>>).map(normalizeOrgUserRole)
      : undefined,
    createdAt:
      u.createdAt != null
        ? String(u.createdAt)
        : u.created_at != null
          ? String(u.created_at)
          : undefined,
  };
}

function normalizeOrgUsersResponse(result: unknown): OrgUser[] {
  const rawItems: unknown[] = Array.isArray(result)
    ? result
    : result && typeof result === 'object'
      ? Array.isArray((result as { items?: unknown }).items)
        ? ((result as { items: unknown[] }).items as unknown[])
        : Array.isArray((result as { data?: unknown }).data)
          ? ((result as { data: unknown[] }).data as unknown[])
          : Array.isArray((result as { users?: unknown }).users)
            ? ((result as { users: unknown[] }).users as unknown[])
            : []
      : [];
  return rawItems.map((r) => normalizeOrgUser(r)).filter(Boolean) as OrgUser[];
}

export const orgUsersApi = {
  list: async (): Promise<OrgUser[]> => {
    const result = await apiClient.get<unknown>('/org/users', true);
    return normalizeOrgUsersResponse(result);
  },

  create: async (payload: CreateOrgUserPayload): Promise<CreateOrgUserResponse> => {
    const body: Record<string, unknown> = {
      email: payload.email.trim(),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      nexaOrgRole: 'member',
      sendLoginLink: payload.sendLoginLink !== false,
    };
    const phone = payload.phone?.trim();
    if (phone) body.phone = phone;
    if (payload.nextHireRoleId?.trim()) {
      body.nextHireRoleId = payload.nextHireRoleId.trim();
    }

    const result = await apiClient.post<unknown>('/org/users', body, true);
    const r = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
    const user = normalizeOrgUser(r.user);
    if (!user) {
      throw { message: 'User created but response was invalid', status: 502 };
    }
    const summary: OrgUserSummary = {
      id: user.id,
      email: user.email,
      nexaOrgRole: user.nexaOrgRole,
      status: user.status,
      roles: user.roles,
    };
    return {
      user: summary,
      invite: r.invite && typeof r.invite === 'object' ? (r.invite as CreateOrgUserResponse['invite']) : undefined,
    };
  },
};

import type { ApiError } from '../lib/api';
import { apiClient } from '../lib/api';
import type { AssignUserRolePayload, Role, UserRoleAssignment } from '../types/teams';

function normalizeRole(raw: Record<string, unknown> | null | undefined): Role | null {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id ?? raw.roleId ?? '');
  const name = String(raw.name ?? raw.title ?? '').trim();
  if (!id || !name) return null;
  const code = raw.code != null ? String(raw.code).trim() : undefined;
  return {
    id,
    name,
    code: code || undefined,
    description: raw.description != null ? String(raw.description) : null,
  };
}

function normalizeRolesResponse(result: unknown): Role[] {
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
    .map((r) => normalizeRole(r as Record<string, unknown>))
    .filter(Boolean) as Role[];
}

function normalizeUserRole(raw: Record<string, unknown> | null | undefined): UserRoleAssignment | null {
  if (!raw || typeof raw !== 'object') return null;
  const roleId = String(raw.roleId ?? raw.role_id ?? raw.id ?? '');
  if (!roleId) return null;
  return {
    roleId,
    roleName: raw.roleName != null ? String(raw.roleName) : raw.name != null ? String(raw.name) : undefined,
    assignedAt:
      raw.assignedAt != null
        ? String(raw.assignedAt)
        : raw.assigned_at != null
          ? String(raw.assigned_at)
          : null,
  };
}

function normalizeUserRolesResponse(result: unknown): UserRoleAssignment[] {
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
    .map((r) => normalizeUserRole(r as Record<string, unknown>))
    .filter(Boolean) as UserRoleAssignment[];
}

export const rolesApi = {
  getRoles: async (): Promise<Role[]> => {
    const result = await apiClient.get<unknown>('/roles', true);
    return normalizeRolesResponse(result);
  },

  getUserRoles: async (userId: string): Promise<UserRoleAssignment[]> => {
    const result = await apiClient.get<unknown>(`/users/${encodeURIComponent(userId)}/roles`, true);
    return normalizeUserRolesResponse(result);
  },

  assignUserRole: async (userId: string, payload: AssignUserRolePayload): Promise<UserRoleAssignment> => {
    const result = await apiClient.post<unknown>(
      `/users/${encodeURIComponent(userId)}/roles`,
      { roleId: payload.roleId },
      true
    );
    const ur = normalizeUserRole(result as Record<string, unknown>);
    if (!ur) {
      const err: ApiError = { message: 'Role assigned but response was invalid' };
      throw err;
    }
    return ur;
  },

  removeUserRole: async (userId: string, roleId: string): Promise<void> => {
    await apiClient.delete<void>(`/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`, true);
  },
};

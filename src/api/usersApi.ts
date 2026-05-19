import { apiClient } from '../lib/api';
import type { UserOption } from '../types/users';

// Best-effort: backend may expose /users or /me/team
export const usersApi = {
  list: async (): Promise<UserOption[]> => {
    try {
      const users = await apiClient.get<any>('/users', true);
      if (Array.isArray(users)) {
        return users.map((u) => ({
          id: String(u.id ?? u.userId ?? u.sub ?? ''),
          displayName: String(u.displayName ?? u.name ?? u.email ?? 'User'),
          email: u.email ? String(u.email) : undefined,
        })).filter((u) => !!u.id);
      }
    } catch {
      // fallthrough
    }

    const team = await apiClient.get<any>('/me/team', true);
    if (Array.isArray(team)) {
      return team.map((u) => ({
        id: String(u.id ?? u.userId ?? u.sub ?? ''),
        displayName: String(u.displayName ?? u.name ?? u.email ?? 'User'),
        email: u.email ? String(u.email) : undefined,
      })).filter((u) => !!u.id);
    }

    return [];
  },
};


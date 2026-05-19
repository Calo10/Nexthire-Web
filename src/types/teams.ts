/** Teams, members, and org roles — aligned with NextHire API JSON (camelCase or snake_case). */

export interface Team {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  memberCount?: number;
}

export interface CreateTeamPayload {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateTeamPayload {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface TeamMember {
  userId: string;
  displayName: string;
  email?: string;
  isTeamLead: boolean;
}

export interface AddTeamMemberPayload {
  userId: string;
  isTeamLead?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
}

export interface UserRoleAssignment {
  roleId: string;
  roleName?: string;
  assignedAt?: string | null;
}

export interface AssignUserRolePayload {
  roleId: string;
}

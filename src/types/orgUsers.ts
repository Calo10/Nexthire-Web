export interface CreateOrgUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  nexaOrgRole: 'member';
  nextHireRoleId?: string;
  sendLoginLink?: boolean;
}

export interface OrgUserRole {
  userId?: string;
  roleId?: string;
  roleCode?: string;
  roleName?: string;
  assignedAt?: string;
}

export interface OrgUser {
  id: string;
  nexaUserId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  nexaOrgRole?: string;
  status?: string;
  roles?: OrgUserRole[];
  createdAt?: string;
}

export type OrgUserSummary = Pick<
  OrgUser,
  'id' | 'email' | 'nexaOrgRole' | 'status' | 'roles'
>;

export interface CreateOrgUserResponse {
  user: OrgUserSummary;
  invite?: {
    inviteId?: string;
    email?: string;
    role?: string;
    status?: string;
  };
}

export function orgUserDisplayName(user: Pick<OrgUser, 'firstName' | 'lastName' | 'email'>): string {
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return name || user.email;
}

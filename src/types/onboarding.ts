export interface ProvisionTrialRequest {
  name: string;
  timezone?: string;
  adminEmail: string;
  adminFullName: string;
  sendLoginLink?: boolean;
  loginCallbackUrl?: string;
}

export interface ProvisionTrialResponse {
  organizationId: string;
  name: string;
  slug?: string;
  createdAt?: string;
  adminUserId?: string;
  adminEmail: string;
  adminFullName: string;
  adminUserCreated?: boolean;
  adminRole?: string;
  nextHireUserId?: string;
  loginLinkSent: boolean;
}

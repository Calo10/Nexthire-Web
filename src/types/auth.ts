export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO date string
  requiresOrgSetup: boolean;
  user?: {
    userId: string;
    email: string;
    fullName?: string;
  };
  organization?: {
    organizationId: string;
    name: string;
    slug?: string;
  };
  features?: Record<string, any>;
}

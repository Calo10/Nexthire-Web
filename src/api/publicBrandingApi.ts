import { publicRequest } from './publicApiClient';
import { normalizePublicOrganizationBranding } from '../lib/organizationBranding';
import type { PublicOrganizationBranding } from '../types/organizationBranding';

export const publicBrandingApi = {
  getBranding: async (orgId: string): Promise<PublicOrganizationBranding> => {
    const raw = await publicRequest<unknown>(`/orgs/${encodeURIComponent(orgId)}/branding`, {
      method: 'GET',
    });
    return normalizePublicOrganizationBranding(raw);
  },
};

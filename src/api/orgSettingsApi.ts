import { apiClient } from '../lib/api';
import type {
  ColorPaletteOption,
  OrganizationSettings,
  SaveOrganizationSettingsRequest,
} from '../types/organizationBranding';

export const orgSettingsApi = {
  getSettings: (): Promise<OrganizationSettings> => {
    return apiClient.get<OrganizationSettings>('/org/settings');
  },

  listPalettes: (): Promise<ColorPaletteOption[]> => {
    return apiClient.get<ColorPaletteOption[]>('/org/settings/palettes');
  },

  saveSettings: (payload: SaveOrganizationSettingsRequest): Promise<OrganizationSettings> => {
    return apiClient.put<OrganizationSettings>('/org/settings', payload);
  },
};

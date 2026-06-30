export type ColorPaletteId =
  | 'nexa_default'
  | 'professional_blue'
  | 'modern_teal'
  | 'warm_neutral'
  | 'growth_green'
  | 'bold_contrast';

export interface ColorPaletteTokens {
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  footerBackground?: string;
  footerText?: string;
  footerAccent?: string;
}

export interface ColorPaletteOption {
  id: ColorPaletteId;
  name: string;
  description: string;
  tokens: ColorPaletteTokens;
}

export interface OrganizationSettings {
  orgId: string;
  displayName: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoBase64: string | null;
  logoContentType: string | null;
  colorPalette: ColorPaletteId;
  fitScoringEnabled?: boolean;
  palette: ColorPaletteTokens;
  createdAt: string;
  updatedAt: string;
}

export interface PublicOrganizationBranding {
  orgId: string;
  displayName: string | null;
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoBase64: string | null;
  logoContentType: string | null;
  colorPalette: ColorPaletteId;
  palette: ColorPaletteTokens | null;
}

export interface SaveOrganizationSettingsRequest {
  displayName?: string;
  website?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoBase64?: string;
  logoContentType?: string;
  colorPalette: ColorPaletteId;
  fitScoringEnabled?: boolean | null;
  removeLogo?: boolean;
}

export const LOGO_MAX_BYTES = 512 * 1024;
export const LOGO_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type LogoContentType = (typeof LOGO_ACCEPTED_TYPES)[number];

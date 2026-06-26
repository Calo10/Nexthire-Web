import {
  LOGO_ACCEPTED_TYPES,
  LOGO_MAX_BYTES,
  type ColorPaletteTokens,
  type LogoContentType,
  type PublicOrganizationBranding,
} from '../types/organizationBranding';

const PUBLIC_BRANDING_CACHE_PREFIX = 'nh-public-branding:v4:';

/** Neutral page canvas — never a saturated brand tint on public careers pages. */
const NEUTRAL_PAGE_BG = '#f7fafc';
const NEUTRAL_SURFACE = '#ffffff';

export function normalizePublicOrganizationBranding(raw: unknown): PublicOrganizationBranding {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const paletteRaw = data.palette;

  const str = (value: unknown): string => String(value ?? '').trim();

  let palette: ColorPaletteTokens | null = null;
  if (paletteRaw && typeof paletteRaw === 'object') {
    const p = paletteRaw as Record<string, unknown>;
    palette = {
      primary: str(p.primary),
      primaryForeground: str(p.primaryForeground),
      secondary: str(p.secondary),
      accent: str(p.accent),
      background: str(p.background),
      surface: str(p.surface),
      text: str(p.text),
      textMuted: str(p.textMuted),
      border: str(p.border),
      footerBackground: str(p.footerBackground) || undefined,
      footerText: str(p.footerText) || undefined,
      footerAccent: str(p.footerAccent) || undefined,
    };
  }

  const strOrNull = (value: unknown): string | null => {
    if (value == null) return null;
    const trimmed = String(value).trim();
    return trimmed || null;
  };

  return {
    orgId: String(data.orgId ?? ''),
    displayName: strOrNull(data.displayName),
    website: strOrNull(data.website),
    contactEmail: strOrNull(data.contactEmail),
    contactPhone: strOrNull(data.contactPhone),
    logoBase64: strOrNull(data.logoBase64),
    logoContentType: strOrNull(data.logoContentType),
    colorPalette: (data.colorPalette as PublicOrganizationBranding['colorPalette']) ?? 'nexa_default',
    palette,
  };
}

export function readPublicBrandingCache(orgId: string): PublicOrganizationBranding | null {
  try {
    const raw = sessionStorage.getItem(`${PUBLIC_BRANDING_CACHE_PREFIX}${orgId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicOrganizationBranding;
    return parsed?.orgId ? parsed : null;
  } catch {
    return null;
  }
}

export function writePublicBrandingCache(orgId: string, branding: PublicOrganizationBranding): void {
  try {
    sessionStorage.setItem(`${PUBLIC_BRANDING_CACHE_PREFIX}${orgId}`, JSON.stringify(branding));
  } catch {
    // Ignore quota or storage errors — network fetch still works.
  }
}

export function brandingLogoSrc(
  logoBase64: string | null | undefined,
  logoContentType: string | null | undefined
): string | null {
  if (!logoBase64?.trim() || !logoContentType?.trim()) return null;
  const raw = logoBase64.replace(/^data:[^;]+;base64,/, '').trim();
  if (!raw) return null;
  return `data:${logoContentType};base64,${raw}`;
}

export function applyBrandingCssVars(element: HTMLElement, palette: ColorPaletteTokens | null | undefined): void {
  if (!palette) return;

  // Canvas stays neutral; palette colors apply to text, borders, and CTAs only.
  element.style.setProperty('--brand-page-bg', NEUTRAL_PAGE_BG);
  element.style.setProperty('--brand-surface', NEUTRAL_SURFACE);
  element.style.setProperty('--brand-primary', palette.primary);
  element.style.setProperty('--brand-primary-fg', palette.primaryForeground);
  element.style.setProperty('--brand-heading', palette.secondary);
  element.style.setProperty('--brand-body', palette.text);
  element.style.setProperty('--brand-muted', palette.textMuted);
  element.style.setProperty('--brand-border', palette.border);

  element.style.setProperty('--brand-footer-bg', palette.footerBackground || palette.secondary || '#021926');
  element.style.setProperty('--brand-footer-text', palette.footerText || '#ffffff');
  element.style.setProperty('--brand-footer-accent', palette.footerAccent || palette.primary);

  element.style.setProperty('--color-primary', palette.primary);
  element.style.setProperty('--color-primary-foreground', palette.primaryForeground);
}

export function clearBrandingCssVars(element: HTMLElement): void {
  const vars = [
    '--brand-page-bg',
    '--brand-surface',
    '--brand-primary',
    '--brand-primary-fg',
    '--brand-heading',
    '--brand-body',
    '--brand-muted',
    '--brand-border',
    '--brand-footer-bg',
    '--brand-footer-text',
    '--brand-footer-accent',
    '--color-primary',
    '--color-primary-foreground',
  ];
  for (const name of vars) {
    element.style.removeProperty(name);
  }
}

export function isAcceptedLogoType(type: string): type is LogoContentType {
  return (LOGO_ACCEPTED_TYPES as readonly string[]).includes(type);
}

export async function readLogoFile(file: File): Promise<{ base64: string; contentType: LogoContentType }> {
  if (!isAcceptedLogoType(file.type)) {
    throw new Error('INVALID_TYPE');
  }
  if (file.size > LOGO_MAX_BYTES) {
    throw new Error('TOO_LARGE');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('READ_FAILED'));
    reader.readAsDataURL(file);
  });

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match || !isAcceptedLogoType(match[1])) {
    throw new Error('INVALID_TYPE');
  }

  return { base64: match[2], contentType: match[1] };
}

export function stripDataUrlPrefix(base64: string): string {
  return base64.replace(/^data:[^;]+;base64,/, '').trim();
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidContactEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function isValidWebsiteUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateOrganizationContactFields(values: {
  website: string;
  contactEmail: string;
  contactPhone: string;
}): Partial<Record<'website' | 'contactEmail' | 'contactPhone', string>> {
  const errors: Partial<Record<'website' | 'contactEmail' | 'contactPhone', string>> = {};
  const website = values.website.trim();
  const contactEmail = values.contactEmail.trim();
  const contactPhone = values.contactPhone.trim();

  if (website) {
    if (website.length > 500) errors.website = 'MAX_LENGTH';
    else if (!isValidWebsiteUrl(website)) errors.website = 'INVALID_URL';
  }

  if (contactEmail) {
    if (contactEmail.length > 320) errors.contactEmail = 'MAX_LENGTH';
    else if (!isValidContactEmail(contactEmail)) errors.contactEmail = 'INVALID_EMAIL';
  }

  if (contactPhone && contactPhone.length > 80) {
    errors.contactPhone = 'MAX_LENGTH';
  }

  return errors;
}

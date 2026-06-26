/** Normalized org shape used in AuthContext + localStorage (`nh_org`). */
export interface StoredOrganization {
  id: string;
  name: string;
}

export function getAuthCallbackUrl(): string {
  const base = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${base.replace(/\/$/, '')}/auth/callback`;
}

export function normalizeOrganization(raw: unknown): StoredOrganization | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = o.organizationId ?? o.id;
  if (id == null || id === '') return null;
  return {
    id: String(id),
    name: typeof o.name === 'string' ? o.name : '',
  };
}

export function organizationNameValid(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 120;
}

export function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp || typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function clearStoredAuthSession(): void {
  localStorage.removeItem('nhAccessToken');
  localStorage.removeItem('nh_user');
  localStorage.removeItem('nh_org');
  localStorage.removeItem('nh_subscription');
  localStorage.removeItem('nh_features');
  localStorage.removeItem('nexaAccessToken');
  localStorage.removeItem('nexaRefreshToken');
  localStorage.removeItem('nexaExpiresAt');
  localStorage.removeItem('requires_org_setup');
}

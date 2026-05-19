/**
 * NextHire tenant id for APIs (WhatsApp, etc.).
 * Prefer Auth `org`; then `nh_org` in localStorage; then JWT claims.
 */
export function resolveTenantId(org: unknown): string {
  if (org && typeof org === 'object') {
    const o = org as Record<string, unknown>;
    const fromOrg = String(o.id ?? o.orgId ?? o.organizationId ?? o.tenantId ?? '').trim();
    if (fromOrg) return fromOrg;
  }
  try {
    const rawOrg = localStorage.getItem('nh_org');
    if (rawOrg) {
      const parsed = JSON.parse(rawOrg) as Record<string, unknown>;
      const fromStored = String(parsed.id ?? parsed.orgId ?? parsed.organizationId ?? parsed.tenantId ?? '').trim();
      if (fromStored) return fromStored;
    }
  } catch {
    // no-op
  }
  try {
    const token = localStorage.getItem('nhAccessToken');
    if (!token) return '';
    const parts = token.split('.');
    if (parts.length < 2) return '';
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as Record<string, unknown>;
    return String(payload.org_id ?? payload.tenant_id ?? payload.orgId ?? payload.tenantId ?? '').trim();
  } catch {
    return '';
  }
}

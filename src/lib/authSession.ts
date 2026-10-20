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

const ACCOUNTS_KEY = 'nh_accounts';
const ADD_ACCOUNT_FLAG = 'nh_add_account';
const MAX_ACCOUNTS = 2;

export interface StoredAccountSession {
  userId: string;
  email: string;
  name?: string;
  nhAccessToken: string;
  nexaAccessToken?: string;
  nexaRefreshToken?: string;
  nexaExpiresAt?: string;
  userJson: string;
  orgJson?: string;
  subscriptionJson?: string;
  featuresJson?: string;
  requiresOrgSetup: boolean;
}

export interface AccountSummary {
  userId: string;
  email: string;
  name?: string;
}

export function accountKey(account: { email: string; userId?: string }): string {
  const email = account.email.trim().toLowerCase();
  return email || account.userId || '';
}

export function markAddingAccount(): void {
  localStorage.setItem(ADD_ACCOUNT_FLAG, '1');
}

export function isAddingAccount(): boolean {
  return localStorage.getItem(ADD_ACCOUNT_FLAG) === '1';
}

export function clearAddingAccount(): void {
  localStorage.removeItem(ADD_ACCOUNT_FLAG);
}

function readOptional(key: string): string | undefined {
  const value = localStorage.getItem(key);
  return value && value.length > 0 ? value : undefined;
}

function writeOptional(key: string, value: string | undefined): void {
  if (value) localStorage.setItem(key, value);
  else localStorage.removeItem(key);
}

export function captureActiveAccount(): StoredAccountSession | null {
  const token = localStorage.getItem('nhAccessToken');
  const userJson = localStorage.getItem('nh_user');
  if (!token || !userJson || isJwtExpired(token)) return null;

  try {
    const user = JSON.parse(userJson) as { id?: string; email?: string; name?: string };
    if (!user.email) return null;
    return {
      userId: String(user.id ?? ''),
      email: user.email,
      name: user.name,
      nhAccessToken: token,
      nexaAccessToken: readOptional('nexaAccessToken'),
      nexaRefreshToken: readOptional('nexaRefreshToken'),
      nexaExpiresAt: readOptional('nexaExpiresAt'),
      userJson,
      orgJson: readOptional('nh_org'),
      subscriptionJson: readOptional('nh_subscription'),
      featuresJson: readOptional('nh_features'),
      requiresOrgSetup: localStorage.getItem('requires_org_setup') === 'true',
    };
  } catch {
    return null;
  }
}

export function readStoredAccounts(): StoredAccountSession[] {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredAccountSession[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (account) =>
        account &&
        typeof account.email === 'string' &&
        typeof account.nhAccessToken === 'string' &&
        typeof account.userJson === 'string' &&
        !isJwtExpired(account.nhAccessToken)
    );
  } catch {
    return [];
  }
}

function writeStoredAccounts(accounts: StoredAccountSession[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, MAX_ACCOUNTS)));
}

/** Keep the account that is currently in localStorage, plus at most one other. */
export function rememberActiveSession(): void {
  const active = captureActiveAccount();
  if (!active) return;
  const key = accountKey(active);
  const other = readStoredAccounts().find((account) => accountKey(account) !== key);
  writeStoredAccounts(other ? [active, other] : [active]);
}

/** Save the current session before a new login overwrites it. */
export function stashActiveSession(): void {
  const active = captureActiveAccount();
  if (!active) return;
  const key = accountKey(active);
  const others = readStoredAccounts().filter((account) => accountKey(account) !== key);
  writeStoredAccounts([active, ...others]);
}

export function otherAccountSummaries(currentEmail?: string | null): AccountSummary[] {
  const current = (currentEmail || '').trim().toLowerCase();
  return readStoredAccounts()
    .filter((account) => accountKey(account) !== current)
    .map((account) => ({
      userId: account.userId,
      email: account.email,
      name: account.name,
    }));
}

export function activateStoredAccount(account: StoredAccountSession): void {
  localStorage.setItem('nhAccessToken', account.nhAccessToken);
  localStorage.setItem('nh_user', account.userJson);
  writeOptional('nh_org', account.orgJson);
  writeOptional('nh_subscription', account.subscriptionJson);
  writeOptional('nh_features', account.featuresJson);
  writeOptional('nexaAccessToken', account.nexaAccessToken);
  writeOptional('nexaRefreshToken', account.nexaRefreshToken);
  writeOptional('nexaExpiresAt', account.nexaExpiresAt);
  if (account.requiresOrgSetup) localStorage.setItem('requires_org_setup', 'true');
  else localStorage.removeItem('requires_org_setup');
}

export function dropAccount(email: string): StoredAccountSession | null {
  const key = email.trim().toLowerCase();
  const remaining = readStoredAccounts().filter((account) => accountKey(account) !== key);
  writeStoredAccounts(remaining);
  return remaining[0] ?? null;
}

export function findStoredAccount(email: string): StoredAccountSession | null {
  const key = email.trim().toLowerCase();
  return readStoredAccounts().find((account) => accountKey(account) === key) ?? null;
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
  localStorage.removeItem(ACCOUNTS_KEY);
  localStorage.removeItem(ADD_ACCOUNT_FLAG);
}

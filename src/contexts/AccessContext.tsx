import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth, type LoginOrganizationChoice } from './AuthContext';
import { orgUsersApi } from '../api/orgUsersApi';
import { authApi } from '../lib/api';

const salesNavKeys = new Set(['dashboard', 'jobs', 'candidates', 'pipeline']);

type AccessValue = {
  ready: boolean;
  readOnly: boolean;
  organizationsReady: boolean;
  organizations: LoginOrganizationChoice[];
};

const AccessContext = createContext<AccessValue>({
  ready: true,
  readOnly: false,
  organizationsReady: true,
  organizations: [],
});

export function isSalesReadOnly(roleCodes: string[]): boolean {
  const codes = roleCodes.map((code) => code.trim().toLowerCase()).filter(Boolean);
  return codes.length > 0 && codes.every((code) => code === 'sales');
}

export function isSalesNavKey(translationKey: string): boolean {
  return salesNavKeys.has(translationKey);
}

export function isSalesPath(pathname: string): boolean {
  return (
    pathname === '/app/dashboard' ||
    pathname === '/app/jobs' ||
    pathname.startsWith('/app/jobs/') ||
    pathname === '/app/candidates' ||
    pathname.startsWith('/app/candidates/') ||
    pathname === '/app/pipeline' ||
    pathname.startsWith('/app/pipeline/') ||
    pathname === '/pipeline' ||
    pathname.startsWith('/pipeline/')
  );
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, org } = useAuth();
  const [roleCodes, setRoleCodes] = useState<string[] | null>(null);
  const [organizations, setOrganizations] = useState<LoginOrganizationChoice[] | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setRoleCodes(null);
      setOrganizations(null);
      return;
    }
    setRoleCodes(null);
    setOrganizations(null);
    let cancelled = false;
    orgUsersApi
      .getMe()
      .then((me) => {
        if (cancelled) return;
        setRoleCodes((me.roles ?? []).map((role) => role.roleCode || '').filter(Boolean));
      })
      .catch(() => {
        if (!cancelled) setRoleCodes([]);
      });
    authApi
      .listOrganizations()
      .then((items) => {
        if (!cancelled) setOrganizations(items);
      })
      .catch(() => {
        if (!cancelled) setOrganizations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, org?.id]);

  const value = useMemo<AccessValue>(
    () => ({
      ready: roleCodes !== null,
      readOnly: roleCodes !== null && isSalesReadOnly(roleCodes),
      organizationsReady: organizations !== null,
      organizations: organizations ?? [],
    }),
    [roleCodes, organizations]
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess(): AccessValue {
  return useContext(AccessContext);
}

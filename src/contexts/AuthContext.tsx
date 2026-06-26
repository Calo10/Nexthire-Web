import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, setUnauthorizedHandler, setLastLoginTime } from '../lib/api';
import {
  clearStoredAuthSession,
  getAuthCallbackUrl,
  isJwtExpired,
  normalizeOrganization,
  type StoredOrganization,
} from '../lib/authSession';
import { dedupeMagicLinkConsume } from '../lib/magicLinkToken';

interface User {
  id: string;
  email: string;
  name?: string;
}

type Org = StoredOrganization;

interface Subscription {
  planKey: string;
  status: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  org: Org | null;
  subscription: Subscription | null;
  token: string | null;
  isLoading: boolean;
  loginWithMagicLink: (email: string) => Promise<void>;
  requestMagicLink: (
    email: string,
    options?: { forSignup?: boolean }
  ) => Promise<{ devToken?: string }>;
  loginWithPassword: (email: string, password: string) => Promise<{ requiresOrgSetup: boolean }>;
  completeMagicLink: (token: string) => Promise<{ requiresOrgSetup: boolean }>;
  refreshSessionFromStorage: () => void;
  logout: () => void;
}

function persistAuthResponse(response: {
  accessToken: string;
  nexa?: { accessToken?: string; refreshToken?: string; expiresAt?: string };
  requiresOrgSetup: boolean;
  user: { id?: string; userId?: string; email: string; name?: string; fullName?: string };
  organization?: unknown;
  features?: Record<string, unknown> | null;
}): { nextHireToken: string; requiresOrgSetup: boolean } {
  const decodePayload = (jwt: string): Record<string, unknown> | null => {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
      return null;
    }
  };

  const isNextHireJwt = (jwt: string | undefined): boolean => {
    if (!jwt) return false;
    const payload = decodePayload(jwt);
    if (!payload) return false;
    return payload.iss === 'nexthire-api' || payload.aud === 'nexthire-web' || payload.org_id !== undefined;
  };

  const candidateTokenA = response.accessToken;
  const candidateTokenB = response.nexa?.accessToken;
  const nextHireToken = isNextHireJwt(candidateTokenA)
    ? candidateTokenA
    : isNextHireJwt(candidateTokenB)
      ? (candidateTokenB as string)
      : candidateTokenA;
  const nexaTokenToStore =
    nextHireToken === candidateTokenA ? response.nexa?.accessToken : candidateTokenA;

  localStorage.setItem('nhAccessToken', nextHireToken);
  if (response.nexa || nexaTokenToStore) {
    if (nexaTokenToStore) localStorage.setItem('nexaAccessToken', nexaTokenToStore);
    if (response.nexa?.refreshToken) localStorage.setItem('nexaRefreshToken', response.nexa.refreshToken);
    if (response.nexa?.expiresAt) localStorage.setItem('nexaExpiresAt', response.nexa.expiresAt);
  }

  const user = response.user;
  const userId = user.userId ?? user.id ?? '';
  localStorage.setItem(
    'nh_user',
    JSON.stringify({
      id: String(userId),
      email: user.email,
      name: user.name ?? user.fullName,
    })
  );

  const org = normalizeOrganization(response.organization);
  if (org) {
    localStorage.setItem('nh_org', JSON.stringify(org));
  } else {
    localStorage.removeItem('nh_org');
  }

  if (response.features) {
    localStorage.setItem('nh_features', JSON.stringify(response.features));
  }

  if (response.requiresOrgSetup) {
    localStorage.setItem('requires_org_setup', 'true');
  } else {
    localStorage.removeItem('requires_org_setup');
  }

  return { nextHireToken, requiresOrgSetup: response.requiresOrgSetup };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    // Call backend logout endpoint (fire and forget)
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore errors - logout locally regardless
    }

    clearStoredAuthSession();
    
    // Clear state
    setUser(null);
    setOrg(null);
    setSubscription(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Redirect to login
    window.location.href = '/login';
  }, []);

  // Setup 401 handler - only after auth is initialized
  useEffect(() => {
    // Only set up the handler after initial auth check is complete
    if (!isLoading) {
      setUnauthorizedHandler(() => {
        // Always check localStorage directly to avoid race conditions with state updates
        // Only logout if we have a token in storage (meaning we were authenticated)
        const hasToken = localStorage.getItem('nhAccessToken');
        const hasUser = localStorage.getItem('nh_user');
        if (hasToken && hasUser) {
          // We have a token but got 401, so it's invalid/expired - logout
          logout();
        }
        // If no token/user, don't logout (might be a public endpoint or initial load)
      });
    } else {
      // Clear handler during loading to prevent premature logout
      setUnauthorizedHandler(() => {});
    }
  }, [logout, isLoading]);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('nhAccessToken');
    const storedUser = localStorage.getItem('nh_user');
    const storedOrg = localStorage.getItem('nh_org');
    const storedSubscription = localStorage.getItem('nh_subscription');

    if (storedToken && storedUser) {
      if (isJwtExpired(storedToken)) {
        clearStoredAuthSession();
      } else {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          if (storedOrg) {
            setOrg(JSON.parse(storedOrg));
          }
          if (storedSubscription) {
            setSubscription(JSON.parse(storedSubscription));
          }
          setIsAuthenticated(true);
        } catch (error) {
          clearStoredAuthSession();
        }
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithMagicLink = async (email: string): Promise<void> => {
    await authApi.requestMagicLink(email, { callbackUrl: getAuthCallbackUrl() });
  };

  const requestMagicLink = async (
    email: string,
    options?: { forSignup?: boolean }
  ): Promise<{ devToken?: string }> => {
    const res = await authApi.requestMagicLink(email, { callbackUrl: getAuthCallbackUrl() });
    const devToken =
      import.meta.env.DEV && typeof res.token === 'string' && res.token.length > 0 ? res.token : undefined;
    void options?.forSignup;
    return { devToken };
  };

  const refreshSessionFromStorage = useCallback(() => {
    const storedToken = localStorage.getItem('nhAccessToken');
    const storedUser = localStorage.getItem('nh_user');
    const storedOrg = localStorage.getItem('nh_org');
    const storedSubscription = localStorage.getItem('nh_subscription');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setOrg(storedOrg ? JSON.parse(storedOrg) : null);
      setSubscription(storedSubscription ? JSON.parse(storedSubscription) : null);
      setIsAuthenticated(true);
    }
  }, []);

  const loginWithPassword = async (email: string, password: string): Promise<{
    requiresOrgSetup: boolean;
  }> => {
    const response = await authApi.loginWithPassword(email, password);

    if (!response.accessToken) {
      throw new Error('No access token received from server');
    }

    const { nextHireToken, requiresOrgSetup } = persistAuthResponse(response);
    setToken(nextHireToken);
    const storedUser = localStorage.getItem('nh_user');
    const storedOrg = localStorage.getItem('nh_org');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedOrg) setOrg(JSON.parse(storedOrg));
    setIsAuthenticated(true);
    setLastLoginTime();

    return { requiresOrgSetup };
  };

  const completeMagicLink = async (token: string): Promise<{
    requiresOrgSetup: boolean;
  }> => {
    return dedupeMagicLinkConsume(token, async (normalizedToken) => {
      const response = await authApi.exchangeToken(normalizedToken);
      if (!response?.accessToken) {
        throw { message: 'Invalid sign-in response from server.', status: 502 };
      }
      const { nextHireToken, requiresOrgSetup } = persistAuthResponse(response);
      setToken(nextHireToken);
      const storedUser = localStorage.getItem('nh_user');
      const storedOrg = localStorage.getItem('nh_org');
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedOrg) setOrg(JSON.parse(storedOrg));
      setIsAuthenticated(true);
      setLastLoginTime();
      return { requiresOrgSetup };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        org,
        subscription,
        token,
        isLoading,
        loginWithMagicLink,
        requestMagicLink,
        loginWithPassword,
        completeMagicLink,
        refreshSessionFromStorage,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


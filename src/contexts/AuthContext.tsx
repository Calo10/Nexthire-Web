import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, setUnauthorizedHandler, setLastLoginTime } from '../lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Org {
  id: string;
  name: string;
}

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
  loginWithPassword: (email: string, password: string) => Promise<{ requiresOrgSetup: boolean }>;
  completeMagicLink: (token: string) => Promise<{ requiresOrgSetup: boolean }>;
  logout: () => void;
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

    // Clear local storage
    localStorage.removeItem('nhAccessToken');
    localStorage.removeItem('nh_user');
    localStorage.removeItem('nh_org');
    localStorage.removeItem('nh_subscription');
    localStorage.removeItem('nh_features');
    localStorage.removeItem('nexaAccessToken');
    localStorage.removeItem('nexaRefreshToken');
    localStorage.removeItem('nexaExpiresAt');
    localStorage.removeItem('requires_org_setup');
    
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
        // Invalid stored data, clear it
        localStorage.removeItem('nhAccessToken');
        localStorage.removeItem('nh_user');
        localStorage.removeItem('nh_org');
        localStorage.removeItem('nh_subscription');
        localStorage.removeItem('nh_features');
        localStorage.removeItem('nexaAccessToken');
        localStorage.removeItem('nexaRefreshToken');
        localStorage.removeItem('nexaExpiresAt');
      }
    }
    setIsLoading(false);
  }, []);

  const loginWithMagicLink = async (email: string): Promise<void> => {
    await authApi.requestMagicLink(email);
    // Success is handled by showing the success message in the UI
  };

  const loginWithPassword = async (email: string, password: string): Promise<{
    requiresOrgSetup: boolean;
  }> => {
    const response = await authApi.loginWithPassword(email, password);
    
    // Store NextHire access token FIRST - ensure it's saved before anything else
    if (!response.accessToken) {
      throw new Error('No access token received from server');
    }

    // Pick the correct NextHire JWT (issued by nexthire-api) if backend ever returns tokens swapped.
    const decodePayload = (jwt: string): any => {
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
    
    // TEMP Debug logging (dev only) - Remove before production
    if (import.meta.env.DEV) {
      const decoded = (() => {
        try {
          const parts = response.accessToken.split('.');
          if (parts.length !== 3) return {};
          const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          return { header, payload };
        } catch (e) {
          return {};
        }
      })();
      
      console.log('[AuthContext] loginWithPassword - Storing tokens', {
        nextHireTokenLength: response.accessToken.length,
        nextHireTokenFirst15: response.accessToken.substring(0, 15),
        nextHireJWT: decoded.header ? {
          alg: decoded.header.alg,
          kid: decoded.header.kid,
          iss: decoded.payload?.iss,
          aud: decoded.payload?.aud,
        } : null,
        hasNexaToken: !!response.nexa?.accessToken,
        nexaTokenLength: response.nexa?.accessToken?.length || 0,
        storageKey: 'nhAccessToken',
      });
    }
    
    // Store NextHire access token (this is the JWT for NextHire API)
    localStorage.setItem('nhAccessToken', nextHireToken);
    setToken(nextHireToken);

    // Store Nexa tokens separately (for Nexa API calls, not NextHire)
    if (response.nexa || nexaTokenToStore) {
      if (nexaTokenToStore) localStorage.setItem('nexaAccessToken', nexaTokenToStore);
      if (response.nexa?.refreshToken) localStorage.setItem('nexaRefreshToken', response.nexa.refreshToken);
      if (response.nexa?.expiresAt) localStorage.setItem('nexaExpiresAt', response.nexa.expiresAt);
    }

    // Store user data
    localStorage.setItem('nh_user', JSON.stringify(response.user));
    setUser(response.user);

    // Store organization data (if present)
    if (response.organization) {
      localStorage.setItem('nh_org', JSON.stringify(response.organization));
      setOrg(response.organization);
    }

    // Store features if available
    if (response.features) {
      localStorage.setItem('nh_features', JSON.stringify(response.features));
    }

    // Store requiresOrgSetup flag
    if (response.requiresOrgSetup) {
      localStorage.setItem('requires_org_setup', 'true');
    } else {
      localStorage.removeItem('requires_org_setup');
    }

    // Set authenticated state LAST - this ensures token is in localStorage first
    setIsAuthenticated(true);
    
    // Mark login time to prevent immediate logout on 401 errors
    setLastLoginTime();

    return {
      requiresOrgSetup: response.requiresOrgSetup,
    };
  };

  const completeMagicLink = async (token: string): Promise<{
    requiresOrgSetup: boolean;
  }> => {
    const response = await authApi.exchangeToken(token);
    
    // TEMP Debug logging (dev only) - Remove before production
    if (import.meta.env.DEV) {
      const decoded = (() => {
        try {
          const parts = response.accessToken.split('.');
          if (parts.length !== 3) return {};
          const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          return { header, payload };
        } catch (e) {
          return {};
        }
      })();
      
      console.log('[AuthContext] completeMagicLink - Storing tokens', {
        nextHireTokenLength: response.accessToken.length,
        nextHireTokenFirst15: response.accessToken.substring(0, 15),
        nextHireJWT: decoded.header ? {
          alg: decoded.header.alg,
          kid: decoded.header.kid,
          iss: decoded.payload?.iss,
          aud: decoded.payload?.aud,
        } : null,
        hasNexaToken: !!response.nexa?.accessToken,
        nexaTokenLength: response.nexa?.accessToken?.length || 0,
        storageKey: 'nhAccessToken',
      });
    }
    
    // Pick the correct NextHire JWT (issued by nexthire-api) if backend ever returns tokens swapped.
    const decodePayload = (jwt: string): any => {
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

    // Store NextHire access token (this is the JWT for NextHire API)
    localStorage.setItem('nhAccessToken', nextHireToken);
    setToken(nextHireToken);

    // Store Nexa tokens separately (for Nexa API calls, not NextHire)
    if (response.nexa || nexaTokenToStore) {
      if (nexaTokenToStore) localStorage.setItem('nexaAccessToken', nexaTokenToStore);
      if (response.nexa?.refreshToken) localStorage.setItem('nexaRefreshToken', response.nexa.refreshToken);
      if (response.nexa?.expiresAt) localStorage.setItem('nexaExpiresAt', response.nexa.expiresAt);
    }

    // Store user data
    localStorage.setItem('nh_user', JSON.stringify(response.user));
    setUser(response.user);

    // Store organization data (if present)
    if (response.organization) {
      localStorage.setItem('nh_org', JSON.stringify(response.organization));
      setOrg(response.organization);
    }

    // Store features if available
    if (response.features) {
      localStorage.setItem('nh_features', JSON.stringify(response.features));
    }

    // Store requiresOrgSetup flag
    if (response.requiresOrgSetup) {
      localStorage.setItem('requires_org_setup', 'true');
    } else {
      localStorage.removeItem('requires_org_setup');
    }

    setIsAuthenticated(true);
    
    // Mark login time to prevent immediate logout on 401 errors
    setLastLoginTime();

    return {
      requiresOrgSetup: response.requiresOrgSetup,
    };
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
        loginWithPassword,
        completeMagicLink,
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


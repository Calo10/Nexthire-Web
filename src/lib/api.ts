// NextHire API Configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = `${API_BASE}/api`;

// Auth API Routes (centralized - matches NextHire API Swagger)
export const AUTH_ROUTES = {
  MAGIC_LINK: '/auth/magic-link',
  CONSUME: '/auth/consume',
  ME: '/me',
  LOGOUT: '/logout',
  PASSWORD_RESET_REQUEST: '/auth/password/reset/request',
  PASSWORD_RESET_CONFIRM: '/auth/password/reset/confirm',
  PASSWORD_INITIALIZE: '/auth/password/initialize',
  // Note: /auth/password/login and /auth/password/set are not in Swagger
  PASSWORD_LOGIN: '/auth/password/login', // May not exist - check Swagger
  PASSWORD_SET: '/auth/password/set', // May not exist - check Swagger
} as const;

export interface ApiError {
  message: string;
  status?: number;
}

// Callback for 401 handling
let onUnauthorized: (() => void) | null = null;
let lastLoginTime: number = 0;
const LOGIN_GRACE_PERIOD = 30000; // 30 seconds after login, don't auto-logout on 401

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export function setLastLoginTime() {
  lastLoginTime = Date.now();
}

// ApiClient: Automatically adds Authorization header for protected endpoints
// Reads NextHire JWT from localStorage key 'nhAccessToken' (not Nexa token)
class ApiClient {
  private getToken(): string | null {
    // Use nhAccessToken - this is the NextHire JWT, not the Nexa token
    return localStorage.getItem('nhAccessToken');
  }

  // Safe JWT decoder - only extracts header and payload, no validation
  private decodeJWT(token: string): { header?: any; payload?: any } {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return {};
      
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      return { header, payload };
    } catch (e) {
      return {};
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipUnauthorizedHandler: boolean = false
  ): Promise<T> {
    const token = this.getToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Check if this is a dashboard endpoint for enhanced logging
    const isDashboardEndpoint = endpoint.startsWith('/dashboard/');

    const customHeaders = { ...(options.headers as Record<string, string>) };
    const isFormDataBody = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormDataBody ? {} : { 'Content-Type': 'application/json' }),
      ...customHeaders,
    };
    if (isFormDataBody) {
      delete headers['Content-Type'];
    }

    // Automatically add Authorization header for protected endpoints
    // Auth endpoints (magic-link, consume, login, password reset) should NOT have Authorization header
    // Public auth endpoints that don't require token:
    const isPublicAuthEndpoint = endpoint.startsWith('/auth/magic-link') ||
                                 endpoint.startsWith('/auth/consume') ||
                                 endpoint.startsWith('/auth/password/login') ||
                                 endpoint.startsWith('/auth/password/reset/request') ||
                                 endpoint.startsWith('/auth/password/reset/confirm');
    
    // For protected endpoints (dashboard, jobs, /me, etc.), always add Authorization if token exists
    if (token && !isPublicAuthEndpoint) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Safe auth/header logging for ALL NextHire API requests (dev only)
    if (import.meta.env.DEV) {
      const decoded = token ? this.decodeJWT(token) : {};
      const payload = decoded.payload || {};
      const nhTokenInStorage = localStorage.getItem('nhAccessToken');
      const nexaTokenInStorage = localStorage.getItem('nexaAccessToken');

      console.log(`[ApiClient] Request: ${options.method || 'GET'} ${url}`, {
        method: options.method || 'GET',
        endpoint,
        url,
        skipUnauthorizedHandler,
        hasAuthHeader: !!headers['Authorization'],
        tokenLength: token?.length || 0,
        tokenFirst15: token ? token.substring(0, 15) : 'none',
        // Minimal JWT diagnostics (do not log full payload)
        jwtIss: payload?.iss || null,
        jwtAud: payload?.aud || null,
        hasOrgIdClaim: payload?.org_id !== undefined && payload?.org_id !== null,
        // Storage sanity checks
        storage: {
          nhAccessTokenLength: nhTokenInStorage?.length || 0,
          nhAccessTokenFirst15: nhTokenInStorage ? nhTokenInStorage.substring(0, 15) : 'none',
          nexaAccessTokenLength: nexaTokenInStorage?.length || 0,
        },
      });

      // Warn if a protected request is missing Authorization header
      if (!isPublicAuthEndpoint && !headers['Authorization']) {
        console.warn('[ApiClient] Missing Authorization header', {
          method: options.method || 'GET',
          url,
          endpoint,
        });
      }
    }

    // Enhanced debug logging for dashboard endpoints (dev only)
    if (import.meta.env.DEV && isDashboardEndpoint) {
      const nexaToken = localStorage.getItem('nexaAccessToken');
      const decoded = token ? this.decodeJWT(token) : {};
      
      console.log(`[ApiClient] Dashboard Request: ${options.method || 'GET'} ${url}`, {
        method: options.method || 'GET',
        url,
        storageKey: 'nhAccessToken',
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenFirst15: token ? token.substring(0, 15) : 'none',
        hasAuthHeader: !!headers['Authorization'],
        authHeaderPrefix: headers['Authorization'] ? headers['Authorization'].substring(0, 20) + '...' : 'none',
        jwtPayload: decoded.payload ? {
          iss: decoded.payload.iss,
          aud: decoded.payload.aud,
        } : null,
        usingNextHireToken: decoded.payload?.iss === 'nexthire-api' || decoded.payload?.aud === 'nexthire-web',
        hasNexaToken: !!nexaToken,
        nexaTokenLength: nexaToken?.length || 0,
      });
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Read response body for error details (especially for 500 errors)
        let errorData: any = {};
        let responseText = '';
        try {
          responseText = await response.clone().text();
          errorData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          // If JSON parse fails, use text as error message
          errorData = { message: responseText || 'Unknown error' };
        }
        
        // Enhanced logging for errors (dev only)
        if (import.meta.env.DEV && isDashboardEndpoint) {
          console.error(`[ApiClient] Dashboard Error: ${response.status} ${options.method || 'GET'} ${url}`, {
            status: response.status,
            statusText: response.statusText,
            errorData: errorData.message || errorData.error || errorData,
            responseBodySnippet: responseText.substring(0, 200),
            hasAuthHeader: !!headers['Authorization'],
          });
        }
        
        // DEV-only safe log for 401s (do not print token)
        if (import.meta.env.DEV && response.status === 401) {
          console.warn('[ApiClient] 401 Unauthorized', {
            method: options.method || 'GET',
            url,
            endpoint,
            hasAuthHeader: !!headers['Authorization'],
          });
        }

        // Only trigger logout handler if skipUnauthorizedHandler is false
        // Dashboard endpoints should skip this to prevent logout on API errors
        // IMPORTANT: Only treat as 401 if it's actually an authentication error, not a server error
        if (response.status === 401 && token && onUnauthorized && !skipUnauthorizedHandler) {
          const storedToken = localStorage.getItem('nhAccessToken');
          // Only logout if token matches (means it was sent but rejected)
          if (storedToken && token === storedToken) {
            // Don't auto-logout immediately after login (backend may still be warming up / token propagation)
            const msSinceLogin = Date.now() - lastLoginTime;
            if (lastLoginTime && msSinceLogin < LOGIN_GRACE_PERIOD) {
              if (import.meta.env.DEV) {
                console.warn('[ApiClient] Suppressing onUnauthorized due to login grace period', {
                  method: options.method || 'GET',
                  url,
                  msSinceLogin,
                });
              }
            } else {
              onUnauthorized();
            }
          }
        }
        
        // Provide user-friendly error messages
        // IMPORTANT: Distinguish between 401 (auth) and 500 (server) errors
        let errorMessage = 'An error occurred. Please try again.';
        
        if (response.status === 401) {
          if (skipUnauthorizedHandler) {
            // Dashboard endpoints - don't suggest logout, just show API error
            // Override any "session expired" messages from backend for dashboard endpoints
            const backendMessage = errorData.message || errorData.error || '';
            if (backendMessage.toLowerCase().includes('session') || backendMessage.toLowerCase().includes('expired') || backendMessage.toLowerCase().includes('unauthorized')) {
              errorMessage = 'Unable to load data. Please try again.';
            } else {
              errorMessage = backendMessage || 'Unable to load data. Please try again.';
            }
          } else {
            // Other endpoints - can suggest logout
            errorMessage = errorData.message || errorData.error || 'Your session has expired. Please log in again.';
          }
        } else if (response.status === 400) {
          errorMessage = errorData.message || errorData.error || 'Please check your input and try again.';
        } else if (response.status === 403) {
          errorMessage = errorData.message || errorData.error || 'You do not have permission to perform this action.';
        } else if (response.status === 404) {
          errorMessage = errorData.message || errorData.error || 'The requested resource was not found.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please try again later.';
        } else if (response.status >= 500) {
          // Server errors (500, 502, 503, etc.) - show server error message, NOT 401
          errorMessage = errorData.message || errorData.error || 'Server error. Please try again later.';
          // Log full error details for debugging
          if (import.meta.env.DEV) {
            console.error('[ApiClient] Server Error Details:', {
              status: response.status,
              endpoint,
              errorData,
              responseBody: responseText,
            });
          }
        } else if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
        
        throw {
          message: errorMessage,
          status: response.status,
        } as ApiError;
      }

      // 204 No Content (common for DELETE) - return undefined
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      // Some endpoints may return empty body with 200; guard JSON parsing
      const text = await response.text();
      if (!text) return undefined as unknown as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        // Fallback for non-JSON responses
        return text as unknown as T;
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        throw error;
      }
      throw {
        message: 'Network error. Please try again.',
      } as ApiError;
    }
  }

  async post<T>(endpoint: string, data?: unknown, skipUnauthorizedHandler: boolean = false): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: isFormData ? (data as FormData) : data ? JSON.stringify(data) : undefined,
      },
      skipUnauthorizedHandler
    );
  }

  async put<T>(endpoint: string, data?: unknown, skipUnauthorizedHandler: boolean = false): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: isFormData ? (data as FormData) : data ? JSON.stringify(data) : undefined,
      },
      skipUnauthorizedHandler
    );
  }

  async get<T>(endpoint: string, skipUnauthorizedHandler: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
    }, skipUnauthorizedHandler);
  }

  async delete<T>(endpoint: string, skipUnauthorizedHandler: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    }, skipUnauthorizedHandler);
  }

  async patch<T>(endpoint: string, data?: unknown, skipUnauthorizedHandler: boolean = false): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }, skipUnauthorizedHandler);
  }
}

export const apiClient = new ApiClient();

// Auth API endpoints

export const authApi = {
  requestMagicLink: async (email: string): Promise<{ success: boolean; message?: string }> => {
    // Use direct fetch to avoid triggering onUnauthorized on 401
    // This is a public endpoint and 401 shouldn't cause logout/redirect
    // No Authorization header required for public endpoints
    const url = `${API_BASE_URL}${AUTH_ROUTES.MAGIC_LINK}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Provide user-friendly error messages
        let errorMessage = 'Could not send magic link. Please try again.';
        
        if (response.status === 401) {
          errorMessage = errorData.message || errorData.error || 'Unauthorized. Please check your email or contact support.';
        } else if (response.status === 400) {
          errorMessage = errorData.message || errorData.error || 'Invalid email address. Please check and try again.';
        } else if (response.status === 429) {
          errorMessage = 'Too many requests. Please try again later.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (errorData.message || errorData.error) {
          errorMessage = errorData.message || errorData.error;
        }
        
        throw {
          message: errorMessage,
          status: response.status,
        } as ApiError;
      }

      return await response.json();
    } catch (error) {
      // Re-throw ApiError as-is
      if (error && typeof error === 'object' && 'message' in error && 'status' in error) {
        throw error;
      }
      // Network or other errors
      throw {
        message: 'Network error. Please check your connection and try again.',
        status: 0,
      } as ApiError;
    }
  },

  exchangeToken: async (token: string): Promise<{
    accessToken: string;
    nexa: {
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
    };
    requiresOrgSetup: boolean;
    user: {
      id: string;
      email: string;
      name?: string;
    };
    organization: {
      id: string;
      name: string;
    } | null;
    features: Record<string, any> | null;
  }> => {
    // Use direct fetch to avoid triggering onUnauthorized on 401
    // This is part of the login flow and 401 (invalid/expired token) shouldn't cause logout/redirect
    // No Authorization header required for public endpoints
    const url = `${API_BASE_URL}${AUTH_ROUTES.CONSUME}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || errorData.error || 'This link expired or was already used.',
        status: response.status,
      } as ApiError;
    }

    return await response.json();
  },

  loginWithPassword: async (email: string, password: string): Promise<{
    accessToken: string;
    nexa: {
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
    };
    requiresOrgSetup: boolean;
    user: {
      id: string;
      email: string;
      name?: string;
    };
    organization: {
      id: string;
      name: string;
    } | null;
    features: Record<string, any> | null;
  }> => {
    // Use direct fetch for login to avoid triggering onUnauthorized on 401
    // 401 is expected for invalid credentials and shouldn't cause logout/redirect
    // No Authorization header required for public endpoints
    const url = `${API_BASE_URL}${AUTH_ROUTES.PASSWORD_LOGIN}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Provide user-friendly error messages
      let errorMessage = 'Invalid credentials. Please try again.';
      
      if (response.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (response.status === 400) {
        errorMessage = errorData.message || errorData.error || 'Please check your input and try again.';
      } else if (response.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (errorData.message || errorData.error) {
        errorMessage = errorData.message || errorData.error;
      }
      
      throw {
        message: errorMessage,
        status: response.status,
      } as ApiError;
    }

    return await response.json();
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    // Use direct fetch to avoid requiring Authorization header
    // No Authorization header required for public endpoints
    const url = `${API_BASE_URL}${AUTH_ROUTES.PASSWORD_RESET_REQUEST}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || errorData.error || 'Failed to send reset link. Please try again.',
        status: response.status,
      } as ApiError;
    }

    // 204 No Content or 200 OK - success
    return;
  },

  confirmPasswordReset: async (token: string, newPassword: string): Promise<void> => {
    // Use direct fetch to avoid requiring Authorization header
    // No Authorization header required for public endpoints
    const url = `${API_BASE_URL}${AUTH_ROUTES.PASSWORD_RESET_CONFIRM}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || errorData.error || 'Failed to reset password. Please try again.',
        status: response.status,
      } as ApiError;
    }

    // 204 No Content or 200 OK - success
    return;
  },

  initializePassword: async (payload: {
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    const nhToken = localStorage.getItem('nhAccessToken');
    const url = `${API_BASE_URL}${AUTH_ROUTES.PASSWORD_INITIALIZE}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (nhToken) {
      headers['Authorization'] = `Bearer ${nhToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Don't trigger onUnauthorized for initializePassword - let the UI handle the error
      const errorData = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }));
      throw {
        message: errorData.error || errorData.message || 'An error occurred',
        status: response.status,
      } as ApiError;
    }

    // 204 No Content or 200 OK - success
    return;
  },

  setPassword: async (payload: {
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    const nhToken = localStorage.getItem('nhAccessToken');
    const url = `${API_BASE_URL}${AUTH_ROUTES.PASSWORD_SET}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (nhToken) {
      headers['Authorization'] = `Bearer ${nhToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Don't trigger onUnauthorized for setPassword - let the UI handle the error
      // This allows debugging without automatic logout
      const errorData = await response.json().catch(() => ({
        error: `HTTP error! status: ${response.status}`,
      }));
      throw {
        message: errorData.error || errorData.message || 'An error occurred',
        status: response.status,
      } as ApiError;
    }

    // 204 No Content or 200 OK - success
    return;
  },

  getMe: async (): Promise<{
    id: string;
    email: string;
    name?: string;
  }> => {
    return apiClient.get<{
      id: string;
      email: string;
      name?: string;
    }>(AUTH_ROUTES.ME);
  },

  logout: async (): Promise<void> => {
    const nhToken = localStorage.getItem('nhAccessToken');
    const url = `${API_BASE_URL}${AUTH_ROUTES.LOGOUT}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (nhToken) {
      headers['Authorization'] = `Bearer ${nhToken}`;
    }

    // Call logout endpoint (fire and forget - don't wait for response)
    fetch(url, {
      method: 'POST',
      headers,
    }).catch(() => {
      // Ignore errors - logout locally regardless
    });
  },
};

// Onboarding API endpoints
export const onboardingApi = {
  createOrganization: async (data: {
    name: string;
    timezone: string;
  }): Promise<{
    organization: {
      id: string;
      name: string;
    };
    features: any[];
    requiresOrgSetup: boolean;
  }> => {
    const nhToken = localStorage.getItem('nhAccessToken');
    const nexaToken = localStorage.getItem('nexaAccessToken');
    const url = `${API_BASE_URL}/onboarding/organization`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (nhToken) {
      headers['Authorization'] = `Bearer ${nhToken}`;
    }

    if (nexaToken) {
      headers['X-Nexa-Access-Token'] = nexaToken;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`,
      }));
      
      // Handle 401 Unauthorized - only trigger logout if we had a token
      if (response.status === 401 && nhToken && onUnauthorized) {
        // Only call onUnauthorized if we actually sent a token
        onUnauthorized();
      }
      
      throw {
        message: errorData.message || 'An error occurred',
        status: response.status,
      } as ApiError;
    }

    return await response.json();
  },
};

// Dashboard API endpoints
import type { DashboardSummary, RecentActivity, Candidate, ApplicationsByStage, ActivityTrend, Job, Task } from '../types/dashboard';

// Dashboard API endpoints - all use apiClient which automatically adds Authorization: Bearer <NextHireJWT>
// All endpoints call http://localhost:5000/api/dashboard/*
// Parameters: from (ISO 8601 date-time), to (ISO 8601 date-time), jobId (integer)
export const dashboardApi = {
  getSummary: async (params?: { from?: string; to?: string; jobId?: string }): Promise<DashboardSummary> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.jobId) queryParams.append('jobId', params.jobId);
    const query = queryParams.toString();
    // Uses apiClient.get() which automatically adds Authorization: Bearer <token>
    // Skip unauthorized handler - dashboard errors should not logout user
    return apiClient.get(`/dashboard/summary${query ? `?${query}` : ''}`, true);
  },

  getRecentActivity: async (params?: { from?: string; to?: string; jobId?: string }): Promise<RecentActivity[]> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.jobId) queryParams.append('jobId', params.jobId);
    const query = queryParams.toString();
    // Uses apiClient.get() which automatically adds Authorization: Bearer <token>
    // Skip unauthorized handler - dashboard errors should not logout user
    return apiClient.get(`/dashboard/recent-activity${query ? `?${query}` : ''}`, true);
  },

  getCandidates: async (params?: { from?: string; to?: string; jobId?: string }): Promise<Candidate[]> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.jobId) queryParams.append('jobId', params.jobId);
    const query = queryParams.toString();
    // Uses apiClient.get() which automatically adds Authorization: Bearer <token>
    // Fixed endpoint: /dashboard/recent-candidates (was /dashboard/candidates)
    // Skip unauthorized handler - dashboard errors should not logout user
    return apiClient.get(`/dashboard/recent-candidates${query ? `?${query}` : ''}`, true);
  },

  getApplicationsByStage: async (params?: { from?: string; to?: string; jobId?: string }): Promise<ApplicationsByStage[]> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.jobId) queryParams.append('jobId', params.jobId);
    const query = queryParams.toString();
    // Uses apiClient.get() which automatically adds Authorization: Bearer <token>
    // Skip unauthorized handler - dashboard errors should not logout user
    return apiClient.get(`/dashboard/applications-by-stage${query ? `?${query}` : ''}`, true);
  },

  getActivityTrend: async (params?: { from?: string; to?: string; jobId?: string }): Promise<ActivityTrend[]> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.jobId) queryParams.append('jobId', params.jobId);
    const query = queryParams.toString();
    // Uses apiClient.get() which automatically adds Authorization: Bearer <token>
    // Skip unauthorized handler - dashboard errors should not logout user
    return apiClient.get(`/dashboard/activity-trend${query ? `?${query}` : ''}`, true);
  },

  getMyJobs: async (params?: { from?: string; to?: string; jobId?: string }): Promise<Job[]> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.jobId) queryParams.append('jobId', params.jobId);
    const query = queryParams.toString();
    // Uses apiClient.get() which automatically adds Authorization: Bearer <token>
    // Skip unauthorized handler - dashboard errors should not logout user
    return apiClient.get(`/dashboard/my-jobs${query ? `?${query}` : ''}`, true);
  },

  getUpcomingTasks: async (params?: { from?: string; to?: string; jobId?: string }): Promise<Task[]> => {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.jobId) queryParams.append('jobId', params.jobId);
    const query = queryParams.toString();
    // Uses apiClient.get() which automatically adds Authorization: Bearer <token>
    // Skip unauthorized handler - dashboard errors should not logout user
    return apiClient.get(`/dashboard/upcoming-tasks${query ? `?${query}` : ''}`, true);
  },

  getJobs: async (): Promise<Job[]> => {
    // Get all jobs for the filter dropdown
    // Uses apiClient.get() which automatically adds Authorization: Bearer <token>
    // Skip unauthorized handler - dashboard errors should not logout user
    return apiClient.get('/jobs', true);
  },
};

// Jobs API endpoints
export const jobsApi = {
  createJob: async (payload: {
    title: string;
    description: string;
    company: string;
    location: string;
    salary: number;
  }): Promise<{
    id: number;
    title: string;
    description: string;
    company: string;
    location: string;
    salary: number;
    status: string;
    createdAt: string;
  }> => {
    return apiClient.post('/jobs', payload);
  },

  // PUT /api/jobs/{id}
  // Payload:
  // {
  //   "title": "string",
  //   "department": "string",
  //   "location": "string",
  //   "description": "string",
  //   "status": "string"
  // }
  updateJob: async (
    id: string,
    payload: {
      title: string;
      department?: string;
      location?: string;
      description?: string;
      status: string;
    }
  ): Promise<unknown> => {
    // Skip global unauthorized handler to show local drawer error if API misconfigured.
    return apiClient.put(`/jobs/${encodeURIComponent(id)}`, payload, true);
  },
};


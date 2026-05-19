export interface PublicApiError extends Error {
  status?: number;
  details?: unknown;
}

const DEFAULT_BASE =
  import.meta.env.VITE_PUBLIC_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000';

const API_ROOT = String(DEFAULT_BASE).replace(/\/+$/, '');
const BASE_URL = `${String(DEFAULT_BASE).replace(/\/+$/, '')}/api/public`;

const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_PUBLIC_API_TIMEOUT_MS || 15000);

async function parseResponseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function makeError(message: string, status?: number, details?: unknown): PublicApiError {
  const err = new Error(message) as PublicApiError;
  err.status = status;
  err.details = details;
  return err;
}

export async function publicRequest<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return requestWithUrl<T>(url, options);
}

export async function publicApiRequest<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const url = `${API_ROOT}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return requestWithUrl<T>(url, options);
}

async function requestWithUrl<T>(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isFormData =
      typeof FormData !== 'undefined' &&
      options.body &&
      typeof options.body === 'object' &&
      (options.body as any) instanceof FormData;

    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers || {}),
      },
    });

    const body = await parseResponseBody(res);
    if (!res.ok) {
      const message =
        body && typeof body === 'object' && 'message' in (body as any)
          ? String((body as any).message)
          : `Request failed (${res.status})`;
      throw makeError(message, res.status, body);
    }

    return body as T;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw makeError('Request timed out', 0);
    }
    if (e && typeof e === 'object' && 'status' in e) throw e as PublicApiError;
    throw makeError(e?.message || 'Request failed');
  } finally {
    window.clearTimeout(timeout);
  }
}


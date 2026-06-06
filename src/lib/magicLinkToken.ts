/**
 * Parse magic-link token from URL. Handles encoding and '+' → space mangling in query strings.
 */
export function extractMagicLinkToken(search: string, hash: string = ''): string | null {
  const query = search.startsWith('?') || search === '' ? search : `?${search}`;
  const params = new URLSearchParams(query);
  let raw = params.get('token') ?? params.get('code');

  if (!raw && hash) {
    const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
    const hashParams = new URLSearchParams(fragment);
    raw = hashParams.get('token') ?? hashParams.get('code') ?? hashParams.get('access_token');
  }

  if (!raw?.trim()) return null;

  let token = raw.trim();
  // Query parsers turn '+' into space; restore for base64-style tokens
  if (token.includes(' ')) {
    token = token.replace(/ /g, '+');
  }

  if (token.includes('%')) {
    try {
      token = decodeURIComponent(token);
    } catch {
      // use as-is
    }
  }

  return token;
}

/** Module-level: one in-flight consume per token (React StrictMode mounts twice). */
const consumeInflight = new Map<string, Promise<{ requiresOrgSetup: boolean }>>();

export function dedupeMagicLinkConsume(
  token: string,
  run: (normalizedToken: string) => Promise<{ requiresOrgSetup: boolean }>
): Promise<{ requiresOrgSetup: boolean }> {
  const key = token.trim();
  if (!key) {
    return Promise.reject({ message: 'Missing token', status: 400 });
  }

  // Tab already has a session (e.g. first consume succeeded, UI errored on navigation)
  const existingAccess = localStorage.getItem('nhAccessToken');
  if (existingAccess) {
    return Promise.resolve({
      requiresOrgSetup: localStorage.getItem('requires_org_setup') === 'true',
    });
  }

  const pending = consumeInflight.get(key);
  if (pending) return pending;

  const promise = run(key).finally(() => {
    consumeInflight.delete(key);
  });
  consumeInflight.set(key, promise);
  return promise;
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAccess } from '../../../contexts/AccessContext';
import { offboardingsApi } from '../api/offboardingsApi';
import { OFFBOARDING_PERMISSIONS, type OffboardingPermission } from '../models/offboarding';

// Capabilities rarely change within a session; cache per organization to avoid refetching on every mount.
const cache = new Map<string, Promise<string[]>>();

function load(orgKey: string): Promise<string[]> {
  let p = cache.get(orgKey);
  if (!p) {
    p = offboardingsApi.capabilities().catch((err) => {
      cache.delete(orgKey);
      throw err;
    });
    cache.set(orgKey, p);
  }
  return p;
}

export type OffboardingCapabilities = {
  ready: boolean;
  /** True when capabilities could not be loaded (e.g. 403 for roles without offboarding access). */
  denied: boolean;
  capabilities: string[];
  has: (permission: OffboardingPermission) => boolean;
  /** Capability AND not a read-only (sales) session. Use for any mutating UI. */
  can: (permission: OffboardingPermission) => boolean;
};

export function useOffboardingCapabilities(enabled = true): OffboardingCapabilities {
  const { org } = useAuth();
  const { readOnly } = useAccess();
  const orgKey = org?.id ?? 'default';
  const [state, setState] = useState<{ ready: boolean; denied: boolean; caps: string[] }>({
    ready: false,
    denied: false,
    caps: [],
  });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState((s) => ({ ...s, ready: false }));
    load(orgKey)
      .then((caps) => {
        if (!cancelled) setState({ ready: true, denied: caps.length === 0, caps });
      })
      .catch(() => {
        if (!cancelled) setState({ ready: true, denied: true, caps: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, orgKey]);

  const has = useCallback(
    (permission: OffboardingPermission) => state.caps.some((c) => c.toLowerCase() === permission.toLowerCase()),
    [state.caps],
  );
  const can = useCallback((permission: OffboardingPermission) => !readOnly && has(permission), [has, readOnly]);

  return useMemo(
    () => ({ ready: state.ready, denied: state.denied, capabilities: state.caps, has, can }),
    [state, has, can],
  );
}

export { OFFBOARDING_PERMISSIONS };

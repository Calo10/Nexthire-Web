import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useAccess } from '../../../contexts/AccessContext';
import { employeesApi } from '../api/employeesApi';
import { HR_PERMISSIONS, type HrPermission } from '../models/employee';

// Capabilities rarely change within a session; cache per organization to avoid refetching on every mount.
const cache = new Map<string, Promise<string[]>>();

function load(orgKey: string): Promise<string[]> {
  let p = cache.get(orgKey);
  if (!p) {
    p = employeesApi.capabilities().catch((err) => {
      cache.delete(orgKey);
      throw err;
    });
    cache.set(orgKey, p);
  }
  return p;
}

export type HrCapabilities = {
  ready: boolean;
  /** True when capabilities could not be loaded (e.g. 403 for roles without Core HR access). */
  denied: boolean;
  capabilities: string[];
  has: (permission: HrPermission) => boolean;
  /** Capability AND not a read-only (sales) session. Use for any mutating UI. */
  can: (permission: HrPermission) => boolean;
};

export function useHrCapabilities(enabled = true): HrCapabilities {
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
        if (!cancelled) setState({ ready: true, denied: false, caps });
      })
      .catch(() => {
        if (!cancelled) setState({ ready: true, denied: true, caps: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, orgKey]);

  const has = useCallback(
    (permission: HrPermission) => state.caps.some((c) => c.toLowerCase() === permission.toLowerCase()),
    [state.caps],
  );
  const can = useCallback((permission: HrPermission) => !readOnly && has(permission), [has, readOnly]);

  return useMemo(
    () => ({ ready: state.ready, denied: state.denied, capabilities: state.caps, has, can }),
    [state, has, can],
  );
}

export { HR_PERMISSIONS };

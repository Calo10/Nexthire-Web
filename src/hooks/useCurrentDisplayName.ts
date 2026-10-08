import { useEffect, useState } from 'react';
import { orgUsersApi } from '../api/orgUsersApi';
import { useAuth } from '../contexts/AuthContext';

export function useCurrentDisplayName(): string {
  const { user, isAuthenticated } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setDisplayName(null);
      return;
    }
    let cancelled = false;
    void orgUsersApi
      .getMe()
      .then((me) => {
        if (!cancelled) setDisplayName(me.displayName);
      })
      .catch(() => {
        if (!cancelled) setDisplayName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  return displayName?.trim() || user?.name?.trim() || user?.email || 'User';
}

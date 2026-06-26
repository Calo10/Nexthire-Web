import { useCallback, useEffect, useState } from 'react';
import type { PublicApiError } from '../../api/publicApiClient';
import { publicBrandingApi } from '../../api/publicBrandingApi';
import { readPublicBrandingCache, writePublicBrandingCache } from '../../lib/organizationBranding';
import type { PublicOrganizationBranding } from '../../types/organizationBranding';

function getInitialBranding(orgId: string | null | undefined): {
  branding: PublicOrganizationBranding | null;
  isLoading: boolean;
} {
  if (!orgId) return { branding: null, isLoading: false };
  const cached = readPublicBrandingCache(orgId);
  return { branding: cached, isLoading: !cached };
}

export function usePublicOrgBranding(orgId: string | null | undefined) {
  const [branding, setBranding] = useState<PublicOrganizationBranding | null>(() => getInitialBranding(orgId).branding);
  const [isLoading, setIsLoading] = useState(() => getInitialBranding(orgId).isLoading);
  const [error, setError] = useState<PublicApiError | null>(null);

  const refetch = useCallback(() => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    void publicBrandingApi
      .getBranding(orgId)
      .then((data) => {
        setBranding(data);
        writePublicBrandingCache(orgId, data);
      })
      .catch((err) => {
        setError(err as PublicApiError);
        setBranding(null);
      })
      .finally(() => setIsLoading(false));
  }, [orgId]);

  useEffect(() => {
    if (!orgId) {
      setBranding(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const cached = readPublicBrandingCache(orgId);
    if (cached) {
      setBranding(cached);
      setIsLoading(false);
    } else {
      setBranding(null);
      setIsLoading(true);
    }
    setError(null);

    let cancelled = false;

    publicBrandingApi
      .getBranding(orgId)
      .then((data) => {
        if (!cancelled) {
          setBranding(data);
          writePublicBrandingCache(orgId, data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err as PublicApiError);
          if (!cached) setBranding(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return { branding, isLoading, error, refetch };
}

import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { applyBrandingCssVars, brandingLogoSrc, clearBrandingCssVars } from '../lib/organizationBranding';
import { usePublicOrgBranding } from '../hooks/public/usePublicOrgBranding';
import type { PublicOrganizationBranding } from '../types/organizationBranding';

interface PublicOrgBrandingContextValue {
  branding: PublicOrganizationBranding | null;
  isLoading: boolean;
  orgDisplayName: string;
  logoSrc: string | null;
}

const PublicOrgBrandingContext = createContext<PublicOrgBrandingContextValue | undefined>(undefined);

export function PublicOrgBrandingProvider({ children }: { children: ReactNode }) {
  const { orgId } = useParams();
  const { org } = useAuth();
  const { branding, isLoading } = usePublicOrgBranding(orgId);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (branding?.palette) {
      applyBrandingCssVars(el, branding.palette);
    } else if (!isLoading) {
      clearBrandingCssVars(el);
    }
  }, [branding, isLoading]);

  const logoSrc = useMemo(
    () => (isLoading ? null : brandingLogoSrc(branding?.logoBase64, branding?.logoContentType)),
    [branding?.logoBase64, branding?.logoContentType, isLoading]
  );

  const orgDisplayName = isLoading ? '' : branding?.displayName?.trim() || org?.name || '';

  const value = useMemo(
    () => ({
      branding,
      isLoading,
      orgDisplayName,
      logoSrc,
    }),
    [branding, isLoading, orgDisplayName, logoSrc]
  );

  return (
    <PublicOrgBrandingContext.Provider value={value}>
      <div ref={rootRef} className="public-org-branding min-h-full flex flex-col">
        {children}
      </div>
    </PublicOrgBrandingContext.Provider>
  );
}

export function usePublicOrgBrandingContext() {
  const context = useContext(PublicOrgBrandingContext);
  if (context === undefined) {
    throw new Error('usePublicOrgBrandingContext must be used within PublicOrgBrandingProvider');
  }
  return context;
}

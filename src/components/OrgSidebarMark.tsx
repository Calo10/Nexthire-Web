import { useEffect, useState } from 'react';
import { orgSettingsApi } from '../api/orgSettingsApi';
import { useAuth } from '../contexts/AuthContext';
import { brandingLogoSrc } from '../lib/organizationBranding';

let logoRequest: Promise<string | null> | null = null;

function loadOrganizationLogo(): Promise<string | null> {
  return orgSettingsApi
    .getSettings()
    .then((settings) => brandingLogoSrc(settings.logoBase64, settings.logoContentType))
    .catch(() => {
      logoRequest = null;
      return null;
    });
}

export default function OrgSidebarMark({ className = 'w-10 h-10 text-base' }: { className?: string }) {
  const { user } = useAuth();
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const fallback = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    let cancelled = false;
    logoRequest ??= loadOrganizationLogo();
    void logoRequest.then((src) => {
      if (!cancelled) setLogoSrc(src);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (logoSrc) {
    return (
      <div className={`${className} shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white flex items-center justify-center`}>
        <img src={logoSrc} alt="" className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div className={`${className} shrink-0 bg-primary rounded-full flex items-center justify-center text-white font-semibold`}>
      {fallback}
    </div>
  );
}

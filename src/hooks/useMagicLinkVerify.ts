import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { extractMagicLinkToken } from '../lib/magicLinkToken';
import type { ApiError } from '../lib/api';

export function useMagicLinkVerify() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { completeMagicLink } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = extractMagicLinkToken(location.search, location.hash);

    if (!token) {
      setError(t('verify.linkExpired'));
      setLoading(false);
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const result = await completeMagicLink(token);
        if (cancelled) return;
        navigate(result.requiresOrgSetup ? '/onboarding/company' : '/app/dashboard', { replace: true });
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as ApiError;
        const message =
          apiErr?.message ||
          (err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '') ||
          t('verify.linkExpired');
        if (import.meta.env.DEV) {
          console.error('[magic-link consume]', apiErr);
        }
        setError(message);
        setLoading(false);
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [location.search, location.hash, navigate, completeMagicLink, t]);

  return { loading, error };
}

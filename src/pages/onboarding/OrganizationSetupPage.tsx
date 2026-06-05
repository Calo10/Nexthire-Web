import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { onboardingApi, type ApiError } from '../../lib/api';
import { organizationNameValid, normalizeOrganization } from '../../lib/authSession';
import { useAuth } from '../../contexts/AuthContext';
import AuthMarketingShell from '../../components/auth/AuthMarketingShell';
import { ONBOARDING_TIMEZONES } from '../../lib/timezones';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ErrorMessage from '../../components/ErrorMessage';

export default function OrganizationSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout, refreshSessionFromStorage } = useAuth();
  const [organizationName, setOrganizationName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const nhToken = localStorage.getItem('nhAccessToken');
    const nexaToken = localStorage.getItem('nexaAccessToken');
    const org = localStorage.getItem('nh_org');
    const requiresOrgSetup = localStorage.getItem('requires_org_setup');

    if (!nhToken || !nexaToken) {
      navigate('/login', { replace: true });
      return;
    }

    if (org && requiresOrgSetup !== 'true') {
      navigate('/app/dashboard', { replace: true });
      return;
    }

    setIsChecking(false);
  }, [navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!organizationNameValid(organizationName)) {
      setError(t('onboarding.errors.nameLength'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await onboardingApi.createOrganization({
        name: organizationName.trim(),
        timezone: timezone.trim() || undefined,
      });

      const org = normalizeOrganization(response.organization);
      if (org) {
        localStorage.setItem('nh_org', JSON.stringify(org));
      }
      localStorage.setItem('nh_features', JSON.stringify(response.features ?? {}));
      localStorage.setItem('requires_org_setup', 'false');
      refreshSessionFromStorage();

      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      const apiError = err as ApiError;

      if (apiError.status === 401) {
        logout();
        return;
      }

      setError(apiError.message || t('onboarding.errors.createFailed'));
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AuthMarketingShell>
      <Card className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-dark-text text-center mb-2">{t('onboarding.title')}</h1>
          <p className="text-gray-600 text-center text-sm">{t('onboarding.description')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error ? <ErrorMessage message={error} /> : null}

          <div>
            <label htmlFor="organizationName" className="block text-sm font-medium text-dark-text mb-2">
              {t('onboarding.organizationName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="organizationName"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder={t('onboarding.organizationNamePlaceholder')}
              required
              minLength={2}
              maxLength={120}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">{t('onboarding.nameHint')}</p>
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-dark-text mb-2">
              {t('onboarding.timezone')}
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 bg-white"
            >
              <option value="">{t('onboarding.timezoneDefault')}</option>
              {ONBOARDING_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isLoading || !organizationNameValid(organizationName)}
              className="w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>{t('onboarding.creating')}</span>
                </>
              ) : (
                t('onboarding.createWorkspace')
              )}
            </Button>

            <button
              type="button"
              onClick={() => logout()}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-800 underline"
              disabled={isLoading}
            >
              {t('onboarding.logOut')}
            </button>
          </div>
        </form>
      </Card>
    </AuthMarketingShell>
  );
}

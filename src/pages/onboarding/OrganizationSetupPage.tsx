import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { onboardingApi, type ApiError } from '../../lib/api';
import Logo from '../../components/Logo';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ErrorMessage from '../../components/ErrorMessage';
import LanguageSwitcher from '../../components/LanguageSwitcher';

// Common timezones
const TIMEZONES = [
  { value: 'America/Costa_Rica', label: 'America/Costa_Rica (CST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'America/Denver', label: 'America/Denver (MST)' },
  { value: 'America/Phoenix', label: 'America/Phoenix (MST)' },
  { value: 'America/Toronto', label: 'America/Toronto (EST)' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City (CST)' },
  { value: 'UTC', label: 'UTC' },
];

export default function OrganizationSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [organizationName, setOrganizationName] = useState('');
  const [timezone, setTimezone] = useState('America/Costa_Rica');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Guard: Check if user should be on this page
  useEffect(() => {
    const nhToken = localStorage.getItem('nhAccessToken');
    const nexaToken = localStorage.getItem('nexaAccessToken');
    const org = localStorage.getItem('nh_org');
    const requiresOrgSetup = localStorage.getItem('requires_org_setup');

    // If missing either token, redirect to login
    if (!nhToken || !nexaToken) {
      navigate('/login', { replace: true });
      return;
    }

    // If org exists and requires_org_setup is not true, redirect to dashboard
    if (org && requiresOrgSetup !== 'true') {
      navigate('/app/dashboard', { replace: true });
      return;
    }

    setIsChecking(false);
  }, [navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate name (min 2 chars)
    if (!organizationName.trim() || organizationName.trim().length < 2) {
      setError(t('onboarding.title')); // Using title as placeholder, will add proper translation
      return;
    }

    setIsLoading(true);

    try {
      const response = await onboardingApi.createOrganization({
        name: organizationName.trim(),
        timezone: timezone,
      });

      // Save organization and features
      localStorage.setItem('nh_org', JSON.stringify(response.organization));
      localStorage.setItem('nh_features', JSON.stringify(response.features ?? null));

      // Set requires_org_setup to false
      localStorage.setItem('requires_org_setup', 'false');

      // Navigate to dashboard
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      const apiError = err as ApiError;
      
      // Handle 401 - clear storage and redirect to login
      if (apiError.status === 401) {
        localStorage.removeItem('nhAccessToken');
        localStorage.removeItem('nexaAccessToken');
        localStorage.removeItem('nh_user');
        localStorage.removeItem('nh_org');
        localStorage.removeItem('nh_features');
        localStorage.removeItem('requires_org_setup');
        localStorage.removeItem('nexa_refresh_token');
        localStorage.removeItem('nexa_expires_at');
        navigate('/login', { replace: true });
        return;
      }

      // Show error message
      setError(apiError.message || 'Failed to create organization. Please try again.');
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background patterns - matching login design */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-200 opacity-40 rounded-full blur-[100px]"></div>
        <div className="absolute -top-10 -right-32 w-[600px] h-[500px] bg-purple-200 opacity-35 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/3 -left-16 w-[400px] h-[300px] bg-purple-200 opacity-30 rounded-full blur-[80px] transform rotate-12"></div>
        <div className="absolute top-1/2 -right-20 w-[450px] h-[350px] bg-purple-200 opacity-30 rounded-full blur-[90px] transform -rotate-12"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-purple-200 opacity-35 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-0 w-[550px] h-[450px] bg-purple-200 opacity-30 rounded-full blur-[110px]"></div>
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-white opacity-25 rounded-full blur-[90px]"></div>
        <div className="absolute bottom-1/4 right-1/3 w-[380px] h-[380px] bg-white opacity-20 rounded-full blur-[85px]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-white opacity-15 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <Logo className="justify-center mb-6" size="xl" />
        </div>

        <Card className="p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-dark-text text-center mb-2">
              {t('onboarding.title')}
            </h1>
            <p className="text-gray-600 text-center">
              {t('onboarding.description')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage message={error} />}

            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-dark-text mb-2">
                {t('onboarding.organizationName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Acme Inc."
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-dark-text mb-2">
                {t('onboarding.timezone')} <span className="text-red-500">*</span>
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading || !organizationName.trim() || organizationName.trim().length < 2}
                className="w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('onboarding.creating')}</span>
                  </>
                ) : (
                  t('onboarding.createWorkspace')
                )}
              </Button>

              <button
                type="button"
                onClick={() => {
                  // Clear all localStorage
                  localStorage.removeItem('nh_access_token');
                  localStorage.removeItem('nexa_access_token');
                  localStorage.removeItem('nh_user');
                  localStorage.removeItem('nh_org');
                  localStorage.removeItem('nh_features');
                  localStorage.removeItem('requires_org_setup');
                  localStorage.removeItem('nexa_refresh_token');
                  localStorage.removeItem('nexa_expires_at');
                  navigate('/login', { replace: true });
                }}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800 underline"
                disabled={isLoading}
              >
                {t('onboarding.logOut')}
              </button>
            </div>
          </form>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2024 NextHire. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-4">
            <a href="/privacy" className="text-primary hover:text-purple-700">
              Privacy Policy
            </a>
            <a href="/terms" className="text-primary hover:text-purple-700">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

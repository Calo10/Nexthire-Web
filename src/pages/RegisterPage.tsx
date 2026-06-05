import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { onboardingApi } from '../lib/api';
import { getAuthCallbackUrl, organizationNameValid } from '../lib/authSession';
import { ONBOARDING_TIMEZONES } from '../lib/timezones';
import AuthMarketingShell from '../components/auth/AuthMarketingShell';
import SignupStepper from '../components/auth/SignupStepper';
import Card from '../components/Card';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const requiresSetup = localStorage.getItem('requires_org_setup') === 'true';
      navigate(requiresSetup ? '/onboarding/company' : '/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!organizationNameValid(companyName)) {
      setError(t('register.errors.companyName'));
      return;
    }

    const fullName = adminFullName.trim();
    if (fullName.length < 2) {
      setError(t('register.errors.adminName'));
      return;
    }

    setIsLoading(true);

    try {
      const result = await onboardingApi.provisionTrial({
        name: companyName.trim(),
        timezone: timezone.trim() || undefined,
        adminEmail: adminEmail.trim(),
        adminFullName: fullName,
        sendLoginLink: true,
        loginCallbackUrl: getAuthCallbackUrl(),
      });

      navigate('/register/check-email', {
        replace: true,
        state: {
          email: result.adminEmail,
          organizationName: result.name,
          loginLinkSent: result.loginLinkSent,
        },
      });
    } catch (err) {
      const raw =
        err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : '';
      const errorMessage =
        raw === '__PROVISIONING_NOT_CONFIGURED__'
          ? t('register.errors.provisionNotConfigured')
          : raw || t('register.errors.provision');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 text-sm';

  return (
    <AuthMarketingShell>
      <Card className="p-8">
        <SignupStepper current={1} />
        <h1 className="text-2xl font-semibold text-dark-text text-center mb-2">{t('register.title')}</h1>
        <p className="text-sm text-gray-600 text-center mb-6">{t('register.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <ErrorMessage message={error} /> : null}

          <div>
            <label htmlFor="company-name" className="block text-sm font-medium text-dark-text mb-2">
              {t('register.companyName')} <span className="text-red-500">*</span>
            </label>
            <input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder={t('register.companyNamePlaceholder')}
              required
              minLength={2}
              maxLength={120}
              disabled={isLoading}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-dark-text mb-2">
              {t('register.timezone')}
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={isLoading}
              className={`${inputClass} bg-white`}
            >
              <option value="">{t('register.timezoneDefault')}</option>
              {ONBOARDING_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="admin-name" className="block text-sm font-medium text-dark-text mb-2">
              {t('register.adminFullName')} <span className="text-red-500">*</span>
            </label>
            <input
              id="admin-name"
              type="text"
              autoComplete="name"
              value={adminFullName}
              onChange={(e) => setAdminFullName(e.target.value)}
              placeholder={t('register.adminFullNamePlaceholder')}
              required
              minLength={2}
              disabled={isLoading}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-dark-text mb-2">
              {t('register.email')} <span className="text-red-500">*</span>
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder={t('register.emailPlaceholder')}
              required
              disabled={isLoading}
              className={inputClass}
            />
          </div>

          <Button
            type="submit"
            disabled={
              isLoading ||
              !organizationNameValid(companyName) ||
              !adminEmail.trim() ||
              adminFullName.trim().length < 2
            }
            className="w-full flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                <span>{t('register.provisioning')}</span>
              </>
            ) : (
              <>
                {t('register.cta')}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </Button>

          <p className="text-sm text-gray-600 text-center">{t('register.hint')}</p>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="text-primary hover:text-purple-700 font-medium">
            {t('common.login')}
          </Link>
        </p>
      </Card>
    </AuthMarketingShell>
  );
}

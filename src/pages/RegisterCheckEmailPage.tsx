import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import AuthMarketingShell from '../components/auth/AuthMarketingShell';
import SignupStepper from '../components/auth/SignupStepper';
import Card from '../components/Card';
import Button from '../components/Button';

type LocationState = {
  email?: string;
  organizationName?: string;
  loginLinkSent?: boolean;
};

export default function RegisterCheckEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? {};
  const email = state.email?.trim() || '';
  const organizationName = state.organizationName?.trim() || '';
  const loginLinkSent = state.loginLinkSent !== false;

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  if (!email) {
    return null;
  }

  return (
    <AuthMarketingShell>
      <Card className="p-8">
        <SignupStepper current={2} />
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-dark-text">{t('register.checkEmail.title')}</h1>
          {organizationName ? (
            <p className="text-sm font-medium text-primary">{organizationName}</p>
          ) : null}
          {loginLinkSent ? (
            <p className="text-gray-600">{t('register.checkEmail.sent', { email })}</p>
          ) : (
            <p className="text-gray-600">{t('register.checkEmail.createdNoLink', { email })}</p>
          )}
          <p className="text-sm text-gray-500">{t('register.checkEmail.nextStep')}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/register')}>
            {t('register.checkEmail.registerAnother')}
          </Button>
          <p className="text-sm text-gray-600 text-center">
            {t('register.hasAccount')}{' '}
            <Link to="/login" className="text-primary hover:text-purple-700 font-medium">
              {t('common.login')}
            </Link>
          </p>
        </div>
      </Card>
    </AuthMarketingShell>
  );
}

import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { authApi, type ApiError } from '../lib/api';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError(t('resetPassword.invalidLink'));
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (success) {
      // Auto redirect to login after 2 seconds
      const timer = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validation
    if (newPassword.length < 8) {
      setFieldErrors({ newPassword: t('resetPassword.minLength') });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: t('resetPassword.passwordsDoNotMatch') });
      return;
    }

    if (!token) {
      setError(t('resetPassword.invalidLink'));
      return;
    }

    setIsLoading(true);

    try {
      await authApi.confirmPasswordReset(token, newPassword);
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setFieldErrors({});
    } catch (err) {
      const apiError = err as ApiError;

      if (apiError.status === 400) {
        const errorMessage = apiError.message || '';
        if (errorMessage.toLowerCase().includes('password')) {
          setFieldErrors({ newPassword: errorMessage });
        } else {
          setError(errorMessage);
        }
      } else if (apiError.status === 401 || apiError.status === 404) {
        setError(t('resetPassword.invalidExpiredLink'));
      } else {
        setError(apiError.message || t('resetPassword.invalidExpiredLink'));
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-2xl font-semibold text-dark-text text-center mb-6">
            {t('resetPassword.title')}
          </h1>

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-dark-text">
                {t('resetPassword.passwordUpdated')}
              </h2>
              <p className="text-gray-600">
                {t('resetPassword.passwordUpdatedDescription')}
              </p>
            </div>
          ) : error && !token ? (
            <div className="space-y-4">
              <ErrorMessage message={error} />
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-purple-700 font-medium"
                >
                  {t('resetPassword.requestNewLink')}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <ErrorMessage message={error} />}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-dark-text mb-2">
                  {t('resetPassword.newPassword')}
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  required
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    fieldErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.newPassword}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {t('resetPassword.minLength')}
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-text mb-2">
                  {t('resetPassword.confirmPassword')}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  required
                  disabled={isLoading}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
                    fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword || !token}
                className="w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('resetPassword.updating')}</span>
                  </>
                ) : (
                  t('resetPassword.updatePassword')
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary hover:text-purple-700 font-medium"
                >
                  {t('resetPassword.backToLogin')}
                </Link>
              </div>
            </form>
          )}
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>{t('resetPassword.copyright')}</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link to="/privacy" className="text-primary hover:text-purple-700">
              {t('resetPassword.privacyPolicy')}
            </Link>
            <Link to="/terms" className="text-primary hover:text-purple-700">
              {t('resetPassword.termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

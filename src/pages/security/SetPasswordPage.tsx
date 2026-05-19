import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../../components/Logo';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ErrorMessage from '../../components/ErrorMessage';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { authApi, type ApiError } from '../../lib/api';

export default function SetPasswordPage() {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setShowToast(false);

    // Validate both fields are filled
    if (!newPassword || !confirmPassword) {
      setError(t('setPassword.bothFieldsRequired'));
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: t('setPassword.passwordsDoNotMatch') });
      return;
    }

    setIsLoading(true);

    try {
      await authApi.initializePassword({
        newPassword,
        confirmPassword,
      });

      // Success - show toast
      setShowToast(true);
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setFieldErrors({});

      // Hide toast after 3 seconds
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      const apiError = err as ApiError;

      // Handle 409 Conflict - password already set
      if (apiError.status === 409) {
        setError(t('setPassword.passwordAlreadySet'));
      } else if (apiError.status === 400) {
        // Handle 400 - validation errors
        setError(apiError.message || t('setPassword.bothFieldsRequired'));
      } else {
        setError(apiError.message || t('setPassword.bothFieldsRequired'));
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
            {t('setPassword.title')}
          </h1>

          {/* Toast notification */}
          {showToast && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-700 font-medium">{t('setPassword.passwordSetSuccessfully')}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <ErrorMessage message={error} />}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-dark-text mb-2">
                {t('setPassword.newPassword')}
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('setPassword.newPasswordPlaceholder')}
                required
                disabled={isLoading}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  fieldErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {fieldErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.newPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-text mb-2">
                {t('setPassword.confirmPassword')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('setPassword.confirmPasswordPlaceholder')}
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
              disabled={isLoading || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('setPassword.settingPassword')}</span>
                  </>
                ) : (
                  t('setPassword.setPassword')
                )}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-primary hover:text-purple-700 font-medium"
              >
                {t('setPassword.backToLogin')}
              </Link>
            </div>
          </form>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>{t('setPassword.copyright')}</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link to="/privacy" className="text-primary hover:text-purple-700">
              {t('setPassword.privacyPolicy')}
            </Link>
            <Link to="/terms" className="text-primary hover:text-purple-700">
              {t('setPassword.termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

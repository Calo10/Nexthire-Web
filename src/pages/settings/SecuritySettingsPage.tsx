import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi, type ApiError } from '../../lib/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';

export default function SecuritySettingsPage() {
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
      setError(t('settings.security.bothFieldsRequired'));
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: t('settings.security.passwordsDoNotMatch') });
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

      // Handle 401 - show error but don't logout (for debugging)
      if (apiError.status === 401) {
        setError(apiError.message || 'Unauthorized. Please check your authentication token.');
      } else if (apiError.status === 400) {
        // Handle 400 - validation errors
        setError(apiError.message || 'Please check your input and try again.');
      } else {
        setError(apiError.message || 'Failed to save password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toast notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-700 font-medium">{t('settings.security.passwordSavedSuccessfully')}</p>
            </div>
          </div>
        </div>
      )}

      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-dark-text mb-2">{t('settings.security.title')}</h2>
          <p className="text-gray-600 text-sm">
            {t('settings.security.description')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <ErrorMessage message={error} />}

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-dark-text mb-2">
              {t('settings.security.newPassword')}
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('settings.security.newPasswordPlaceholder')}
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
              {t('settings.security.confirmPassword')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('settings.security.confirmPasswordPlaceholder')}
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

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:text-purple-700 font-medium"
            >
              {t('settings.security.forgotPassword')}
            </Link>
            <Button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('settings.security.saving')}</span>
                  </>
                ) : (
                  t('settings.security.savePassword')
                )}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

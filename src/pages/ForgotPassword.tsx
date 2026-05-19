import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { authApi, type ApiError } from '../lib/api';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await authApi.requestPasswordReset(email);
      setIsSubmitted(true);
      setEmail('');
    } catch (err) {
      const apiError = err as ApiError;
      // Always show success message to avoid revealing if email exists
      // But still log the error for debugging
      setIsSubmitted(true);
      setEmail('');
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
          <h1 className="text-2xl font-semibold text-dark-text text-center mb-2">
            {t('forgotPassword.title')}
          </h1>
          <p className="text-gray-600 text-center mb-6">
            {t('forgotPassword.description')}
          </p>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <ErrorMessage message={error} />}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-text mb-2">
                  {t('forgotPassword.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{t('forgotPassword.sending')}</span>
                  </>
                ) : (
                  t('forgotPassword.sendResetLink')
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary hover:text-purple-700 font-medium"
                >
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-dark-text">
                {t('forgotPassword.checkEmail')}
              </h2>
              <p className="text-gray-600">
                {t('forgotPassword.emailSent')}
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="text-sm text-primary hover:text-purple-700 font-medium"
                >
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            </div>
          )}
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>{t('forgotPassword.copyright')}</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link to="/privacy" className="text-primary hover:text-purple-700">
              {t('forgotPassword.privacyPolicy')}
            </Link>
            <Link to="/terms" className="text-primary hover:text-purple-700">
              {t('forgotPassword.termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

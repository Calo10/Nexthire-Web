import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMagicLinkVerify } from '../hooks/useMagicLinkVerify';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AuthVerify() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loading, error } = useMagicLinkVerify();

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-200 opacity-40 rounded-full blur-[100px]" />
        <div className="absolute -top-10 -right-32 w-[600px] h-[500px] bg-purple-200 opacity-35 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-16 w-[400px] h-[300px] bg-purple-200 opacity-30 rounded-full blur-[80px] transform rotate-12" />
        <div className="absolute top-1/2 -right-20 w-[450px] h-[350px] bg-purple-200 opacity-30 rounded-full blur-[90px] transform -rotate-12" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-purple-200 opacity-35 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[550px] h-[450px] bg-purple-200 opacity-30 rounded-full blur-[110px]" />
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-white opacity-25 rounded-full blur-[90px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[380px] h-[380px] bg-white opacity-20 rounded-full blur-[85px]" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-white opacity-15 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <Logo className="justify-center mb-6" size="xl" />
        </div>

        <Card className="p-8">
          {loading ? (
            <div className="text-center space-y-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
              <h2 className="text-xl font-semibold text-dark-text mb-2">{t('verify.verifying')}</h2>
              <p className="text-gray-600">{t('verify.signingIn')}</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-dark-text mb-2">{t('verify.linkExpired')}</h2>
              <p className="text-gray-600 mb-6 text-sm break-words">{error}</p>
              <Button onClick={() => navigate('/register')} className="w-full">
                {t('verify.sendNewLink')}
              </Button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-500 hover:text-primary underline"
              >
                {t('common.login')}
              </button>
            </div>
          ) : null}
        </Card>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>{t('forgotPassword.copyright')}</p>
          <div className="mt-2 flex justify-center gap-4">
            <a href="/privacy" className="text-primary hover:text-purple-700">
              {t('forgotPassword.privacyPolicy')}
            </a>
            <a href="/terms" className="text-primary hover:text-purple-700">
              {t('forgotPassword.termsOfService')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

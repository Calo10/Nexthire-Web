import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallback() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeMagicLink } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token') || searchParams.get('code');

    if (!token) {
      setError(t('verify.linkExpired'));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }

    const handleAuth = async () => {
      try {
        await completeMagicLink(token);
        navigate('/app/dashboard', { replace: true });
      } catch (err) {
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? (err.message as string)
            : t('verify.linkExpired');
        setError(errorMessage);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleAuth();
  }, [searchParams, navigate, completeMagicLink]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-dark-text mb-2">{t('verify.linkExpired')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">{t('verify.signingIn')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h2 className="text-xl font-semibold text-dark-text mb-2">{t('verify.signingIn')}</h2>
        <p className="text-gray-600">{t('verify.verifying')}</p>
      </div>
    </div>
  );
}


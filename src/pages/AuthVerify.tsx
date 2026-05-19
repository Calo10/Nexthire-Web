import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AuthVerify() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { completeMagicLink } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Prevent double-calling in React StrictMode
    if (hasRunRef.current) {
      return;
    }

    // Extract and decode token from URL
    const searchParams = new URLSearchParams(location.search);
    let token = searchParams.get('token') ?? '';

    // Decode token if it's URL-encoded (only decode once)
    if (token && token.includes('%')) {
      try {
        token = decodeURIComponent(token);
      } catch (e) {
        // If decode fails, use original token
      }
    }

    if (!token) {
      setError(t('verify.linkExpired'));
      setLoading(false);
      return;
    }

    // Mark as run before making the API call
    hasRunRef.current = true;

    const verifyToken = async () => {
      try {
        const result = await completeMagicLink(token);
        
        // Redirect based on requiresOrgSetup
        if (result.requiresOrgSetup) {
          navigate('/onboarding/organization', { replace: true });
        } else {
          navigate('/app/dashboard', { replace: true });
        }
      } catch (err) {
        // Only show error, do NOT redirect
        setError(t('verify.linkExpired'));
        setLoading(false);
        // No automatic redirect - user stays on error page
      }
    };

    verifyToken();
  }, [location.search, navigate, completeMagicLink]);

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
          {loading ? (
            <div className="text-center space-y-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <h2 className="text-xl font-semibold text-dark-text mb-2">
                {t('verify.verifying')}
              </h2>
              <p className="text-gray-600">
                {t('verify.signingIn')}
              </p>
            </div>
          ) : error ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-dark-text mb-2">
                {t('verify.linkExpired')}
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => navigate('/login')} className="w-full">
                {t('verify.sendNewLink')}
              </Button>
            </div>
          ) : null}
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

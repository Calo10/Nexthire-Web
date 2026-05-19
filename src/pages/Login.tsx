import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';

type LoginMethod = 'magic-link' | 'password';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginWithMagicLink, loginWithPassword, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (loginMethod === 'magic-link') {
        await loginWithMagicLink(email);
        setIsSubmitted(true);
        setEmail('');
      } else {
        // Password login
        const result = await loginWithPassword(email, password);
        
        // Navigate based on requiresOrgSetup
        if (result.requiresOrgSetup) {
          navigate('/onboarding/organization', { replace: true });
        } else {
          navigate('/app/dashboard', { replace: true });
        }
      }
    } catch (err) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? (err.message as string)
          : loginMethod === 'magic-link'
          ? 'Could not send magic link. Please try again.'
          : 'Invalid credentials. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background patterns - matching the design exactly */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large organic blurred shapes positioned exactly as in the design */}
        
        {/* Top Left - Large soft purple shape */}
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-purple-200 opacity-40 rounded-full blur-[100px]"></div>
        
        {/* Top Right - Large soft purple shape */}
        <div className="absolute -top-10 -right-32 w-[600px] h-[500px] bg-purple-200 opacity-35 rounded-full blur-[120px]"></div>
        
        {/* Mid-Left - Elongated curved shape */}
        <div className="absolute top-1/3 -left-16 w-[400px] h-[300px] bg-purple-200 opacity-30 rounded-full blur-[80px] transform rotate-12"></div>
        
        {/* Mid-Right - Curved shape */}
        <div className="absolute top-1/2 -right-20 w-[450px] h-[350px] bg-purple-200 opacity-30 rounded-full blur-[90px] transform -rotate-12"></div>
        
        {/* Bottom Left - Wave-like pattern */}
        <div className="absolute bottom-0 left-0 w-[500px] h-[400px] bg-purple-200 opacity-35 rounded-full blur-[100px]"></div>
        
        {/* Bottom Right - Wave-like pattern */}
        <div className="absolute bottom-0 right-0 w-[550px] h-[450px] bg-purple-200 opacity-30 rounded-full blur-[110px]"></div>
        
        {/* Additional white shapes for depth */}
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] bg-white opacity-25 rounded-full blur-[90px]"></div>
        <div className="absolute bottom-1/4 right-1/3 w-[380px] h-[380px] bg-white opacity-20 rounded-full blur-[85px]"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-white opacity-15 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Logo className="justify-center mb-6" size="xl" />
        </div>
        
        <Card className="p-8">
          <h1 className="text-2xl font-semibold text-dark-text text-center mb-6">
            Log in to NextHire
          </h1>
          
          {/* Login Method Toggle */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('magic-link');
                  setError(null);
                  setIsSubmitted(false);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'magic-link'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                Magic Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setError(null);
                  setIsSubmitted(false);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginMethod === 'password'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                Password
              </button>
            </div>
          </div>
          
          {!isSubmitted || loginMethod === 'password' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && <ErrorMessage message={error} />}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-text mb-2">
                  {t('login.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {loginMethod === 'password' && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-dark-text mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                  <div className="mt-2 flex justify-end">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:text-purple-700"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>
              )}
              
              <Button 
                type="submit" 
                disabled={isLoading || !email || (loginMethod === 'password' && !password)}
                className="w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{loginMethod === 'magic-link' ? 'Sending...' : 'Logging in...'}</span>
                  </>
                ) : (
                  <>
                    {loginMethod === 'magic-link' ? t('login.sendMagicLink') : 'Log in'}
                    {loginMethod === 'magic-link' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </>
                )}
              </Button>
              
              <p className="text-sm text-gray-600 text-center">
                {loginMethod === 'magic-link' 
                  ? t('login.magicLinkDescription')
                  : 'Log in with your email and password.'
                }
              </p>

              {/* Optional helper link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod(loginMethod === 'magic-link' ? 'password' : 'magic-link');
                    setError(null);
                    setIsSubmitted(false);
                  }}
                  className="text-sm text-gray-500 hover:text-primary"
                  disabled={isLoading}
                >
                  {loginMethod === 'magic-link' 
                    ? 'Prefer password? Use Password'
                    : 'Prefer magic link? Use Magic Link'
                  }
                </button>
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
                {t('login.checkEmail')}
              </h2>
              <p className="text-gray-600">
                {t('login.emailSent', { email })}
              </p>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/login" className="text-primary hover:text-purple-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </Card>
        
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2026 NextHire. All rights reserved.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link to="/privacy" className="text-primary hover:text-purple-700">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-primary hover:text-purple-700">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

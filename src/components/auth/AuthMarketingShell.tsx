import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../Logo';
import LanguageSwitcher from '../LanguageSwitcher';

interface AuthMarketingShellProps {
  children: ReactNode;
  showLanguageSwitcher?: boolean;
}

export default function AuthMarketingShell({ children, showLanguageSwitcher = true }: AuthMarketingShellProps) {
  const { t } = useTranslation();

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
        {showLanguageSwitcher ? (
          <div className="flex justify-end mb-4">
            <LanguageSwitcher />
          </div>
        ) : null}
        <div className="text-center mb-8">
          <Logo className="justify-center mb-6" size="xl" />
        </div>
        {children}
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

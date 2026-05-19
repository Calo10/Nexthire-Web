import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../components/Logo';
import Button from '../components/Button';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/">
              <Logo />
            </Link>
            <nav className="flex items-center gap-6">
              <LanguageSwitcher />
              <Link to="/pricing" className="text-gray-600 hover:text-dark-text transition-colors">
                {t('common.pricing')}
              </Link>
              <Link to="/login">
                <Button variant="outline" size="sm">{t('common.login')}</Button>
              </Link>
              <Link to="/login">
                <Button size="sm">{t('common.getStarted')}</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <Logo />
              <p className="mt-4 text-sm text-gray-600">
                The modern way to hire faster and smarter.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-dark-text mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/pricing" className="text-sm text-gray-600 hover:text-dark-text">
                    {t('common.pricing')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-dark-text mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="text-sm text-gray-600 hover:text-dark-text">
                    {t('common.login')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-dark-text mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/terms" className="text-sm text-gray-600 hover:text-dark-text">
                    {t('common.terms')}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-sm text-gray-600 hover:text-dark-text">
                    {t('common.privacy')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            {t('common.copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}


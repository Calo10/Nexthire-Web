import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../components/Logo';
import Button from '../components/Button';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function PublicJobsLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white/90 backdrop-blur border-b border-gray-200 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="inline-flex">
              <Logo />
            </Link>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Link to="/login">
                <Button variant="primary" size="sm">
                  {t('common.login')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <Logo />
            </div>
            <div>
              <h3 className="font-semibold text-dark-text mb-4">{t('publicJobs.footer.about')}</h3>
              <ul className="space-y-2">
                <li className="text-sm text-gray-600">{t('publicJobs.footer.company')}</li>
                <li className="text-sm text-gray-600">{t('publicJobs.footer.careers')}</li>
                <li className="text-sm text-gray-600">{t('publicJobs.footer.blog')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-dark-text mb-4">{t('publicJobs.footer.resources')}</h3>
              <ul className="space-y-2">
                <li className="text-sm text-gray-600">{t('publicJobs.footer.helpCenter')}</li>
                <li className="text-sm text-gray-600">{t('publicJobs.footer.support')}</li>
                <li className="text-sm text-gray-600">{t('publicJobs.footer.contact')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-dark-text mb-4">{t('publicJobs.footer.community')}</h3>
              <ul className="space-y-2">
                <li className="text-sm text-gray-600">{t('publicJobs.footer.events')}</li>
                <li className="text-sm text-gray-600">{t('publicJobs.footer.forums')}</li>
                <li className="text-sm text-gray-600">{t('publicJobs.footer.developers')}</li>
              </ul>
              <div className="flex items-center gap-3 mt-6 text-gray-400">
                <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center">in</div>
                <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center">f</div>
                <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center">x</div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div>NextHire © 2024</div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-dark-text transition-colors">
                {t('common.privacy')}
              </Link>
              <Link to="/terms" className="hover:text-dark-text transition-colors">
                {t('common.terms')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


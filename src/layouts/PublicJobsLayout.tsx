import { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import LanguageSwitcher from '../components/LanguageSwitcher';
import PublicOrgLogo from '../components/public/PublicOrgLogo';
import PublicOrgContactInfo from '../components/public/PublicOrgContactInfo';
import { PublicOrgBrandingProvider } from '../contexts/PublicOrgBrandingContext';

export default function PublicJobsLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { orgId } = useParams();

  return (
    <PublicOrgBrandingProvider>
      <div className="min-h-screen flex flex-col brand-surface">
        <header className="brand-surface border-b brand-border relative z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-24 py-2">
              <Link to={`/org/${encodeURIComponent(String(orgId || ''))}/jobs`} className="inline-flex min-w-0">
                <PublicOrgLogo size="xl" />
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

        <main className="flex-1 brand-page-bg">{children}</main>

        <footer className="brand-footer border-t mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div className="md:col-span-1">
                <PublicOrgLogo size="lg" variant="footer" />
              </div>
              <div>
                <h3 className="font-semibold brand-footer-heading mb-4">{t('publicJobs.footer.about')}</h3>
                <ul className="space-y-2">
                  <li className="text-sm brand-footer-muted">{t('publicJobs.footer.company')}</li>
                  <li className="text-sm brand-footer-muted">{t('publicJobs.footer.careers')}</li>
                  <li className="text-sm brand-footer-muted">{t('publicJobs.footer.blog')}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold brand-footer-heading mb-4">{t('publicJobs.footer.contact')}</h3>
                <PublicOrgContactInfo />
              </div>
              <div>
                <h3 className="font-semibold brand-footer-heading mb-4">{t('publicJobs.footer.community')}</h3>
                <ul className="space-y-2">
                  <li className="text-sm brand-footer-muted">{t('publicJobs.footer.events')}</li>
                  <li className="text-sm brand-footer-muted">{t('publicJobs.footer.forums')}</li>
                  <li className="text-sm brand-footer-muted">{t('publicJobs.footer.developers')}</li>
                </ul>
                <div className="flex items-center gap-3 mt-6">
                  <div className="w-9 h-9 rounded-lg border brand-footer-icon flex items-center justify-center">in</div>
                  <div className="w-9 h-9 rounded-lg border brand-footer-icon flex items-center justify-center">f</div>
                  <div className="w-9 h-9 rounded-lg border brand-footer-icon flex items-center justify-center">x</div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t brand-footer-border flex flex-col sm:flex-row items-center justify-between gap-4 text-sm brand-footer-muted">
              <div>NextHire © 2026</div>
              <div className="flex items-center gap-6">
                <Link to="/privacy" className="brand-footer-link transition-colors">
                  {t('common.privacy')}
                </Link>
                <Link to="/terms" className="brand-footer-link transition-colors">
                  {t('common.terms')}
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </PublicOrgBrandingProvider>
  );
}

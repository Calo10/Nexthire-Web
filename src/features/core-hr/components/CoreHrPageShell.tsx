import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '../../../components/TopBar';

export type CoreHrBreadcrumb = { label: string; to?: string };

type CoreHrPageShellProps = {
  title: string;
  subtitle?: string;
  /** When set, replaces the "Core HR" eyebrow with a breadcrumb trail. */
  breadcrumbs?: CoreHrBreadcrumb[];
  actions?: ReactNode;
  /**
   * Kept for call-site compatibility. Content is always full-width like Recruitment
   * (`p-8`, no max-width) so modules share the same right margin.
   */
  wide?: boolean;
  children?: ReactNode;
};

export default function CoreHrPageShell({ title, subtitle, breadcrumbs, actions, children }: CoreHrPageShellProps) {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <TopBar />
      <div className="w-full p-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {breadcrumbs && breadcrumbs.length > 0 ? (
              <nav aria-label="Breadcrumb" className="mb-1 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
                {breadcrumbs.map((crumb, i) => (
                  <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                    {i > 0 ? <span aria-hidden>/</span> : null}
                    {crumb.to ? (
                      <Link to={crumb.to} className="font-medium hover:text-teal-700">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-700" aria-current="page">
                        {crumb.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            ) : (
              <p className="text-sm font-medium text-gray-500 mb-1">{t('modules.coreHr')}</p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-dark-text">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-gray-500 max-w-2xl">{subtitle}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

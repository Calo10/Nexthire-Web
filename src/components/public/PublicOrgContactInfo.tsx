import { useTranslation } from 'react-i18next';
import { usePublicOrgBrandingContext } from '../../contexts/PublicOrgBrandingContext';

function telHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, '').replace(/[^\d+()-]/g, '')}`;
}

function formatWebsiteLabel(website: string): string {
  return website.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export default function PublicOrgContactInfo() {
  const { t } = useTranslation();
  const { branding } = usePublicOrgBrandingContext();

  if (!branding) return null;

  const website = branding.website?.trim() || null;
  const contactEmail = branding.contactEmail?.trim() || null;
  const contactPhone = branding.contactPhone?.trim() || null;

  if (!website && !contactEmail && !contactPhone) return null;

  return (
    <ul className="space-y-3 text-sm">
      {website ? (
        <li>
          <a
            href={website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-start gap-2.5 brand-footer-link transition-colors group"
          >
            <svg
              className="w-4 h-4 mt-0.5 shrink-0 opacity-70 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 21a9 9 0 100-18 9 9 0 000 18z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.6 9h16.8M3.6 15h16.8" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3c2.2 2.4 3.4 5.5 3.4 9s-1.2 6.6-3.4 9" />
            </svg>
            <span className="break-all">
              <span className="block text-xs font-medium brand-footer-label">{t('publicJobs.footer.website')}</span>
              {formatWebsiteLabel(website)}
            </span>
          </a>
        </li>
      ) : null}
      {contactEmail ? (
        <li>
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-start gap-2.5 brand-footer-link transition-colors group"
          >
            <svg
              className="w-4 h-4 mt-0.5 shrink-0 opacity-70 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <span className="break-all">
              <span className="block text-xs font-medium brand-footer-label">{t('publicJobs.footer.email')}</span>
              {contactEmail}
            </span>
          </a>
        </li>
      ) : null}
      {contactPhone ? (
        <li>
          <a
            href={telHref(contactPhone)}
            className="inline-flex items-start gap-2.5 brand-footer-link transition-colors group"
          >
            <svg
              className="w-4 h-4 mt-0.5 shrink-0 opacity-70 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <span>
              <span className="block text-xs font-medium brand-footer-label">{t('publicJobs.footer.phone')}</span>
              {contactPhone}
            </span>
          </a>
        </li>
      ) : null}
    </ul>
  );
}

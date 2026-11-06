import { useTranslation } from 'react-i18next';

export function isAccountSuspended(error: { status?: number; code?: string; details?: unknown } | null | undefined) {
  if (!error || error.status !== 403) return false;
  if (error.code === 'account_suspended') return true;
  const details = error.details;
  if (!details || typeof details !== 'object') return false;
  return 'code' in details && (details as { code?: unknown }).code === 'account_suspended';
}

export default function AccountSuspendedNotice() {
  const { t } = useTranslation();

  return (
    <div className="brand-card rounded-2xl p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86l-8.2 14.2A1.5 1.5 0 003.39 20h17.22a1.5 1.5 0 001.3-1.94l-8.2-14.2a1.5 1.5 0 00-2.42 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold brand-heading">{t('publicJobs.suspended.title')}</h2>
      <p className="mt-3 text-sm brand-muted">{t('publicJobs.suspended.message')}</p>
    </div>
  );
}

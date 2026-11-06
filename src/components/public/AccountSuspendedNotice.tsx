import { useTranslation } from 'react-i18next';

function errorText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

export function isAccountSuspended(error: { message?: string; status?: number; code?: string; details?: unknown } | null | undefined) {
  if (!error) return false;
  const details = error.details && typeof error.details === 'object'
    ? (error.details as { code?: unknown; Code?: unknown; message?: unknown; Message?: unknown })
    : undefined;
  const code = error.code || details?.code || details?.Code;
  if (code === 'account_suspended') return true;
  const message = `${errorText(error.message)} ${errorText(details?.message)} ${errorText(details?.Message)}`.toLowerCase();
  return message.includes('account is suspended') || message.includes('cuenta está suspendida') || message.includes('cuenta esta suspendida');
}

export default function AccountSuspendedNotice() {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#f4f7fb] px-6">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <svg className="h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v4m0 4h.01M10.29 3.86l-8.2 14.2A2 2 0 003.86 21h16.28a2 2 0 001.77-2.94l-8.2-14.2a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">{t('publicJobs.suspended.title')}</h1>
        <p className="mt-5 text-lg text-slate-600">{t('publicJobs.suspended.message')}</p>
      </div>
    </div>
  );
}

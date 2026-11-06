import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useAccess } from '../contexts/AccessContext';
import { type ApiError } from '../lib/api';
import { markAddingAccount } from '../lib/authSession';

function initial(name?: string, email?: string): string {
  return name?.trim().charAt(0).toUpperCase() || email?.trim().charAt(0).toUpperCase() || 'U';
}

interface UserAccountMenuProps {
  onClose?: () => void;
  variant?: 'dropdown' | 'inline';
}

export default function UserAccountMenu({ onClose, variant = 'dropdown' }: UserAccountMenuProps) {
  const { t } = useTranslation();
  const { user, org, otherAccounts, switchAccount, switchOrganization, logout } = useAuth();
  const { organizations, organizationsReady } = useAccess();
  const other = otherAccounts[0];
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const handleLogout = () => {
    onClose?.();
    logout();
  };

  const handleSwitch = () => {
    if (!other) return;
    onClose?.();
    switchAccount(other.email);
  };

  const handleSwitchOrganization = async (organizationId: string) => {
    if (organizationId === org?.id || switchingId) return;
    setSwitchError(null);
    setSwitchingId(organizationId);
    try {
      await switchOrganization(organizationId);
    } catch (err) {
      const apiErr = err as ApiError;
      const code = apiErr?.code || (typeof apiErr?.details?.code === 'string' ? apiErr.details.code : '');
      setSwitchError(code === 'account_suspended' ? t('login.accountSuspended') : apiErr?.message || t('login.accountSuspended'));
      setSwitchingId(null);
    }
  };

  const showOrganizations = organizations.length >= 2;

  if (!organizationsReady) return null;

  const body = (
    <>
      <div className={variant === 'dropdown' ? 'px-4 py-2 border-b border-gray-200' : 'px-2'}>
        <p className="text-sm font-medium text-dark-text break-words">
          {user?.name || user?.email || 'User'}
        </p>
        {user?.email && user?.name && (
          <p className="text-xs text-gray-500 mt-1 break-all">{user.email}</p>
        )}
      </div>

      {showOrganizations ? (
        <div className="border-b border-gray-200 py-1">
          {organizations.map((organization) => {
            const current = organization.id === org?.id;
            const suspended = organization.status.toLowerCase() === 'suspended';
            return (
              <button
                key={organization.id}
                type="button"
                disabled={current || switchingId !== null}
                onClick={() => handleSwitchOrganization(organization.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 disabled:hover:bg-transparent ${current ? 'text-primary' : 'text-gray-700'}`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">{organization.name}</span>
                  {current ? (
                    <span className="text-xs shrink-0">{t('dashboard.currentOrganization')}</span>
                  ) : suspended ? (
                    <span className="text-xs text-amber-700 shrink-0">{t('dashboard.organizationSuspended')}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
          {switchError ? <p className="px-4 pb-2 text-xs text-red-600">{switchError}</p> : null}
        </div>
      ) : null}

      {other ? (
        <button
          type="button"
          onClick={handleSwitch}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-200"
        >
          <span className="flex items-center gap-2">
            <span className="w-7 h-7 bg-primary/15 text-primary rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initial(other.name, other.email)}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-dark-text truncate">
                {other.name || other.email}
              </span>
              {other.name && (
                <span className="block text-xs text-gray-500 truncate">{other.email}</span>
              )}
            </span>
          </span>
          <span className="block text-xs text-primary mt-1">{t('dashboard.switchAccount')}</span>
        </button>
      ) : (
        <Link
          to="/login?addAccount=1"
          onClick={() => {
            markAddingAccount();
            onClose?.();
          }}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('dashboard.addAccount')}
        </Link>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {t('dashboard.signOut')}
      </button>
    </>
  );

  if (variant === 'inline') {
    return <div className="rounded-lg border border-gray-200 py-1">{body}</div>;
  }

  return (
    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
      {body}
    </div>
  );
}

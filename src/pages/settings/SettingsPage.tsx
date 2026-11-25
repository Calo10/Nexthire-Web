import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import UserAccountMenu from '../../components/UserAccountMenu';
import AiAssistantLogos from '../../components/settings/AiAssistantLogos';
import AiConnectorsModal from '../../components/settings/AiConnectorsModal';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    if (searchParams.get('mcp') !== '1') return;
    setAiModalOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('mcp');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-dark-text">{t('settings.title')}</h1>
          <p className="text-gray-600 mt-1">{t('settings.description')}</p>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 focus:outline-none"
            >
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && <UserAccountMenu onClose={() => setShowUserMenu(false)} />}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setAiModalOpen(true)}
        className="group relative mb-6 w-full overflow-hidden text-left rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-[#0077E6]/35 hover:shadow-md"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#10A37F] via-[#D97757] to-[#8E75B2]" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0077E6]">
                {t('settings.aiConnectors.cardEyebrow')}
              </p>
              <h2 className="mt-1 text-base font-semibold text-dark-text">{t('settings.aiConnectors.cardTitle')}</h2>
            </div>
            <AiAssistantLogos size="lg" />
          </div>
          <p className="mt-2 text-sm text-gray-500">{t('settings.aiConnectors.cardDescription')}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[#0077E6] group-hover:underline">
            {t('settings.aiConnectors.openButton')}
            <span aria-hidden>→</span>
          </span>
        </div>
      </button>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <NavLink
            to="/app/settings/profile"
            className={({ isActive }) =>
              `py-4 px-1 border-b-2 font-medium text-sm ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            {t('settings.profile.title')}
          </NavLink>
          <NavLink
            to="/app/settings/security"
            className={({ isActive }) =>
              `py-4 px-1 border-b-2 font-medium text-sm ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`
            }
          >
            {t('settings.security.title')}
          </NavLink>
        </nav>
      </div>

      <div>
        <Outlet />
      </div>

      <AiConnectorsModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </div>
  );
}

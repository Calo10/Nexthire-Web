import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { appNavItems } from '../config/appNavItems';
import { useWhatsAppUnreadConversationCount } from '../hooks/useWhatsAppUnreadConversationCount';
import Logo from './Logo';
import OrgSidebarMark from './OrgSidebarMark';

export default function Sidebar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const unreadWhatsAppConversations = useWhatsAppUnreadConversationCount();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <NavLink to="/app/dashboard" className="inline-flex hover:opacity-90 transition-opacity">
          <Logo />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {appNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-dark-text'
              }`
            }
          >
            {item.icon}
            <span className="flex-1">{t(`navigation.${item.translationKey}`)}</span>
            {item.translationKey === 'whatsapp' && unreadWhatsAppConversations > 0 ? (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white"
                title={t('whatsappInbox.unread', { count: unreadWhatsAppConversations })}
              >
                {unreadWhatsAppConversations > 99 ? '99+' : unreadWhatsAppConversations}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
          <OrgSidebarMark />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-text truncate">
              {user?.name || user?.email || 'User'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}


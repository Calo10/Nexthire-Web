import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { appNavItems } from '../config/appNavItems';
import { coreHrNavItems, type CoreHrNavItem } from '../config/coreHrNavItems';
import { isSalesNavKey, useAccess } from '../contexts/AccessContext';
import { useWhatsAppUnreadConversationCount } from '../hooks/useWhatsAppUnreadConversationCount';
import { useModule } from '../modules/ModuleContext';
import AiAgentsNavLink from './AiAgentsNavLink';
import CoreHrAiAgentsNavLink from './CoreHrAiAgentsNavLink';
import Logo from './Logo';
import ModuleSwitcher from './ModuleSwitcher';
import OrgSidebarMark from './OrgSidebarMark';
import { useCurrentDisplayName } from '../hooks/useCurrentDisplayName';

export default function Sidebar() {
  const { t } = useTranslation();
  const displayName = useCurrentDisplayName();
  const unreadWhatsAppConversations = useWhatsAppUnreadConversationCount();
  const { ready, readOnly } = useAccess();
  const { activeModule, homePath } = useModule();
  const isCoreHr = activeModule === 'core-hr';

  const sourceItems = isCoreHr ? coreHrNavItems : appNavItems;
  const navItems = !ready
    ? []
    : !isCoreHr && readOnly
      ? sourceItems.filter((item) => isSalesNavKey(item.translationKey))
      : sourceItems;

  const labelFor = (translationKey: string) =>
    isCoreHr ? t(`coreHrNav.${translationKey}`) : t(`navigation.${translationKey}`);

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex-col">
      <div className="px-5 py-5 border-b border-gray-200 space-y-4">
        <NavLink to={homePath} className="inline-flex max-w-full hover:opacity-90 transition-opacity">
          <Logo size="lg" className="max-w-[210px]" />
        </NavLink>
        <ModuleSwitcher />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) =>
          !isCoreHr && item.translationKey === 'aiAgents' ? (
            <AiAgentsNavLink key={item.path} />
          ) : isCoreHr && item.translationKey === 'aiAgents' ? (
            <CoreHrAiAgentsNavLink key={item.path} />
          ) : isCoreHr && (item as CoreHrNavItem).comingSoon ? (
            <button
              key={item.path}
              type="button"
              disabled
              aria-disabled="true"
              title={t('coreHrNav.soon')}
              className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-400"
            >
              {item.icon}
              <span className="flex-1">{labelFor(item.translationKey)}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {t('coreHrNav.soon')}
              </span>
            </button>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? isCoreHr
                      ? 'bg-teal-600/10 text-teal-800 font-medium'
                      : 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-dark-text'
                }`
              }
            >
              {item.icon}
              <span className="flex-1">{labelFor(item.translationKey)}</span>
              {!isCoreHr && item.translationKey === 'whatsapp' && unreadWhatsAppConversations > 0 ? (
                <span
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white"
                  title={t('whatsappInbox.unread', { count: unreadWhatsAppConversations })}
                >
                  {unreadWhatsAppConversations > 99 ? '99+' : unreadWhatsAppConversations}
                </span>
              ) : null}
            </NavLink>
          ),
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
          <OrgSidebarMark />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-dark-text truncate">{displayName}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getMobileBottomNavItems } from '../../config/appNavItems';
import { useMobileNav } from '../../contexts/MobileNavContext';

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { setOpenMenu } = useMobileNav();
  const bottomNavItems = getMobileBottomNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 lg:hidden">
      <div className="flex items-stretch justify-around">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-1 text-xs transition-colors ${
                isActive ? 'text-primary font-medium' : 'text-gray-500 hover:text-dark-text'
              }`
            }
          >
            {item.icon}
            <span className="truncate max-w-full">{t(`navigation.${item.translationKey}`)}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setOpenMenu(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 px-1 text-xs text-gray-500 hover:text-dark-text transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>{t('dashboard.mobile.more')}</span>
        </button>
      </div>
    </nav>
  );
}

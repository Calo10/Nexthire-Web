import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isSalesPath, useAccess } from '../contexts/AccessContext';
import Sidebar from '../components/Sidebar';
import Logo from '../components/Logo';
import MobileSidebarDrawer from '../components/layout/MobileSidebarDrawer';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { MobileNavProvider, useMobileNav } from '../contexts/MobileNavContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const { openMenu, setOpenMenu } = useMobileNav();
  const { ready, readOnly } = useAccess();
  const location = useLocation();

  if (ready && readOnly && !isSalesPath(location.pathname)) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileSidebarDrawer isOpen={openMenu} onClose={() => setOpenMenu(false)} />
      <MobileBottomNav />

      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 lg:hidden">
        <Logo size="sm" />
        <button
          type="button"
          onClick={() => setOpenMenu(true)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-dark-text"
          aria-label={t('dashboard.mobile.menu')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      <main className="lg:ml-64 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <MobileNavProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </MobileNavProvider>
  );
}

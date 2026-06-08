import { useDashboardPage } from '../hooks/useDashboardPage';
import DashboardLoading from '../components/dashboard/DashboardLoading';
import DashboardDesktopView from '../components/dashboard/DashboardDesktopView';
import DashboardMobileView from '../components/dashboard/DashboardMobileView';

export default function Dashboard() {
  const page = useDashboardPage();

  if (page.authLoading) {
    return <DashboardLoading />;
  }

  return (
    <>
      <div className="hidden lg:block">
        <DashboardDesktopView {...page} />
      </div>
      <div className="lg:hidden">
        <DashboardMobileView {...page} />
      </div>
    </>
  );
}

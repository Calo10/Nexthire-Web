import { useJobsPage } from '../hooks/useJobsPage';
import JobsDesktopView from '../components/jobs/JobsDesktopView';
import JobsMobileView from '../components/jobs/JobsMobileView';
import NewJobModal from '../components/NewJobModal';
import JobDetailDrawer from '../components/jobs/JobDetailDrawer';

export default function JobsPage() {
  const page = useJobsPage();

  return (
    <>
      <div className="hidden lg:block">
        <JobsDesktopView {...page} />
      </div>
      <div className="lg:hidden">
        <JobsMobileView {...page} />
      </div>

      <NewJobModal
        isOpen={page.isNewJobModalOpen}
        onClose={() => page.setIsNewJobModalOpen(false)}
        onSuccess={() => {
          page.refetchJobs();
        }}
      />

      <JobDetailDrawer
        isOpen={page.isJobDrawerOpen}
        job={page.selectedJob}
        onClose={() => page.setIsJobDrawerOpen(false)}
        onUpdated={(updated) => {
          page.setSelectedJob(updated);
          page.refetchJobs();
        }}
        onDeleted={() => {
          page.setSelectedJob(null);
          page.setIsJobDrawerOpen(false);
          page.refetchJobs();
        }}
      />
    </>
  );
}

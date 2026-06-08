import { useCandidatesPage } from '../hooks/useCandidatesPage';
import CandidatesDesktopView from '../components/candidates/CandidatesDesktopView';
import CandidatesMobileView from '../components/candidates/CandidatesMobileView';
import NewCandidateModal from '../components/candidates/NewCandidateModal';
import CandidateDetailDrawer from '../components/candidates/CandidateDetailDrawer';

export default function CandidatesPage() {
  const page = useCandidatesPage();

  return (
    <>
      <div className="hidden lg:block">
        <CandidatesDesktopView {...page} />
      </div>
      <div className="lg:hidden">
        <CandidatesMobileView {...page} />
      </div>

      <NewCandidateModal
        isOpen={page.isNewModalOpen}
        onClose={() => page.setIsNewModalOpen(false)}
        onCreated={page.handleCreated}
      />

      <CandidateDetailDrawer
        isOpen={page.isDrawerOpen}
        candidateId={page.selectedCandidateId}
        onClose={() => page.setIsDrawerOpen(false)}
        onUpdated={() => page.refetch()}
        onDeleted={() => {
          page.setSelectedCandidateId(null);
          page.refetch();
        }}
      />
    </>
  );
}

import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import TopBar from '../components/TopBar';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import SourcingDashboardCards from '../components/sourcing/SourcingDashboardCards';
import LeadsInbox from '../components/sourcing/LeadsInbox';
import CampaignsTab from '../components/sourcing/CampaignsTab';
import SourcesTab from '../components/sourcing/SourcesTab';
import AnalyticsTab from '../components/sourcing/AnalyticsTab';
import LeadModal from '../components/sourcing/LeadModal';
import LeadDetailDrawer from '../components/sourcing/LeadDetailDrawer';
import CampaignModal from '../components/sourcing/CampaignModal';
import { getSourcingCampaigns, getSourcingDashboard } from '../api/sourcingApi';
import type { SourcingDashboard } from '../types/sourcing';
import { useJobs } from '../hooks/useJobs';

type TabId = 'inbox' | 'campaigns' | 'sources' | 'analytics';
const MetaCampaignBuilderModal = lazy(() => import('../components/sourcing/MetaCampaignBuilderModal'));

export default function SourcingPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const shouldFetch = isAuthenticated && !authLoading;

  const { data: jobs, isLoading: jobsLoading } = useJobs(shouldFetch);

  const [tab, setTab] = useState<TabId>('inbox');
  const [refreshKey, setRefreshKey] = useState(0);
  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const [dashboard, setDashboard] = useState<SourcingDashboard | null>(null);
  const [campaignCountForCards, setCampaignCountForCards] = useState<number | null>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState<string | null>(null);

  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [metaCampaignModalOpen, setMetaCampaignModalOpen] = useState(false);
  const [campaignCreateMode, setCampaignCreateMode] = useState<'full' | 'whatsapp-apply'>('full');
  const [drawerLeadId, setDrawerLeadId] = useState<string | number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  useEffect(() => {
    if (!toastSuccess) return;
    const h = window.setTimeout(() => setToastSuccess(null), 2800);
    return () => window.clearTimeout(h);
  }, [toastSuccess]);

  useEffect(() => {
    if (!toastError) return;
    const h = window.setTimeout(() => setToastError(null), 4000);
    return () => window.clearTimeout(h);
  }, [toastError]);

  const loadDashboard = useCallback(async () => {
    if (!shouldFetch) {
      setDashLoading(false);
      return;
    }
    setDashLoading(true);
    setDashError(null);
    try {
      const [d, c] = await Promise.all([getSourcingDashboard(), getSourcingCampaigns({ page: 1, pageSize: 1 })]);
      setDashboard(d);
      setCampaignCountForCards(Number.isFinite(c.total) ? c.total : null);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.loadDashboard');
      setDashError(msg);
      setDashboard(null);
      setCampaignCountForCards(null);
    } finally {
      setDashLoading(false);
    }
  }, [shouldFetch, t]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'inbox', label: t('sourcing.tabs.inbox') },
    { id: 'campaigns', label: t('sourcing.tabs.campaigns') },
    { id: 'sources', label: t('sourcing.tabs.sources') },
    { id: 'analytics', label: t('sourcing.tabs.analytics') },
  ];

  const openLead = (id: string | number) => {
    setDrawerLeadId(id);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-purple-50/90 to-indigo-50">
      <TopBar />

      <div className="p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-dark-text">{t('sourcing.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('sourcing.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="md" onClick={() => setLeadModalOpen(true)}>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('sourcing.header.newLead')}
              </span>
            </Button>
            <Button variant="outline" size="md" onClick={() => { setCampaignCreateMode('whatsapp-apply'); setCampaignModalOpen(true); }}>
              <span className="flex items-center gap-2">
                <img src="https://cdn.simpleicons.org/whatsapp" alt="" className="w-5 h-5" />
                {t('sourcing.header.createWhatsAppCampaign')}
              </span>
            </Button>
            <Button variant="primary" size="md" onClick={() => setMetaCampaignModalOpen(true)}>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('sourcing.header.createCampaign')}
              </span>
            </Button>
          </div>
        </div>

        {toastSuccess ? (
          <div className="mb-4">
            <SuccessMessage message={toastSuccess} />
          </div>
        ) : null}
        {toastError ? (
          <div className="mb-4">
            <ErrorMessage message={toastError} />
          </div>
        ) : null}

        {dashError ? (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <ErrorMessage message={dashError} />
            <Button variant="outline" size="sm" onClick={() => bumpRefresh()}>
              {t('sourcing.retry')}
            </Button>
          </div>
        ) : null}

        <SourcingDashboardCards data={dashboard} isLoading={dashLoading} campaignCountOverride={campaignCountForCards} />

        <div className="flex flex-wrap gap-2 border-b border-purple-100/80 pb-1 mb-6">
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setTab(x.id)}
              className={`px-4 py-2.5 rounded-t-xl text-sm font-medium border-b-2 transition-colors ${
                tab === x.id
                  ? 'border-primary text-primary bg-white/90 shadow-sm'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white/95 shadow-sm p-6">
          {tab === 'inbox' ? (
            <LeadsInbox
              shouldFetch={shouldFetch}
              refreshKey={refreshKey}
              jobs={jobsLoading ? [] : jobs}
              onOpenLead={openLead}
              onToastSuccess={(msg) => setToastSuccess(msg)}
              onToastError={(msg) => setToastError(msg)}
              onRefreshDashboard={() => {
                bumpRefresh();
                loadDashboard();
              }}
            />
          ) : null}

          {tab === 'campaigns' ? (
            <CampaignsTab
              shouldFetch={shouldFetch}
              refreshKey={refreshKey}
              jobs={jobsLoading ? [] : jobs}
              onToastSuccess={(msg) => setToastSuccess(msg)}
              onToastError={(msg) => setToastError(msg)}
              onOpenCreateCampaign={(mode) => {
                if (mode === 'whatsapp-apply') {
                  setCampaignCreateMode('whatsapp-apply');
                  setCampaignModalOpen(true);
                } else {
                  setMetaCampaignModalOpen(true);
                }
              }}
            />
          ) : null}

          {tab === 'sources' ? <SourcesTab shouldFetch={shouldFetch} refreshKey={refreshKey} /> : null}

          {tab === 'analytics' ? (
            <AnalyticsTab
              shouldFetch={shouldFetch}
              refreshKey={refreshKey}
              dashboard={dashboard}
              dashLoading={dashLoading}
              dashError={dashError}
            />
          ) : null}
        </div>
      </div>

      <LeadModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onSuccess={() => {
          bumpRefresh();
          loadDashboard();
          setToastSuccess(t('sourcing.toast.leadCreated'));
        }}
      />

      <CampaignModal
        isOpen={campaignModalOpen}
        onClose={() => {
          setCampaignModalOpen(false);
          setCampaignCreateMode('full');
        }}
        createMode={campaignCreateMode}
        jobs={jobsLoading ? [] : jobs}
        onSuccess={() => {
          bumpRefresh();
          loadDashboard();
          setToastSuccess(t('sourcing.toast.campaignCreated'));
        }}
      />

      {metaCampaignModalOpen ? (
        <Suspense fallback={null}>
          <MetaCampaignBuilderModal
            isOpen={metaCampaignModalOpen}
            onClose={() => setMetaCampaignModalOpen(false)}
            jobs={jobsLoading ? [] : jobs}
            jobsLoading={jobsLoading}
            onSuccess={() => {
              bumpRefresh();
              loadDashboard();
              setToastSuccess(t('sourcing.toast.campaignCreated'));
              setTab('campaigns');
            }}
          />
        </Suspense>
      ) : null}

      <LeadDetailDrawer
        isOpen={drawerOpen}
        leadId={drawerLeadId}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerLeadId(null);
        }}
        onUpdated={() => {
          bumpRefresh();
          loadDashboard();
        }}
      />
    </div>
  );
}

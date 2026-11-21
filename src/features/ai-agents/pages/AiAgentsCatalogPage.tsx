import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '../../../components/TopBar';
import PageHeader from '../../../components/ui/PageHeader';
import ErrorMessage from '../../../components/ErrorMessage';
import { aiAgentsApi, type CatalogHire } from '../api/aiAgentsApi';
import {
  AGENT_CATALOG,
  AGENT_IDS,
  DEFAULT_AGENT_ID,
  agentDetailPath,
  getAgentById,
  type AgentId,
} from '../models/agentCatalog';
import AgentCatalogCard from '../components/AgentCatalogCard';
import AgentDetailPanel, { type TabId } from '../components/AgentDetailPanel';
import AgentPreviewModal from '../components/AgentPreviewModal';

const TABS: TabId[] = ['overview', 'context', 'knowledge', 'tools', 'settings'];

function isAgentId(value: string | null): value is AgentId {
  return !!value && (AGENT_IDS as readonly string[]).includes(value);
}

function isTabId(value: string | null): value is TabId {
  return !!value && (TABS as readonly string[]).includes(value);
}

export default function AiAgentsCatalogPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<AgentId>(DEFAULT_AGENT_ID);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [previewId, setPreviewId] = useState<AgentId | null>(null);
  const [catalog, setCatalog] = useState<CatalogHire[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiringId, setHiringId] = useState<AgentId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await aiAgentsApi.getCatalog();
        if (!cancelled) setCatalog(items);
      } catch (e) {
        if (cancelled) return;
        const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
        setError(message || t('aiAgents.catalog.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    const agentParam = searchParams.get('agent');
    const tabParam = searchParams.get('tab');
    if (isAgentId(agentParam)) setSelectedId(agentParam);
    if (isTabId(tabParam)) setActiveTab(tabParam);
  }, [searchParams]);

  const selected = useMemo(() => getAgentById(selectedId), [selectedId]);
  const previewAgent = previewId ? getAgentById(previewId) : null;

  const isHired = (agentId: AgentId) => !!catalog.find((item) => item.agentId === agentId)?.hired;

  const selectAgent = (id: AgentId, tab: TabId = 'overview') => {
    setSelectedId(id);
    setActiveTab(tab);
  };

  const handlePrimary = async (id: AgentId) => {
    const agent = getAgentById(id);
    if (agent.availability === 'future' || isHired(id)) return;
    setHiringId(id);
    setError(null);
    try {
      await aiAgentsApi.hire(id);
      setCatalog((current) =>
        current.map((item) => (item.agentId === id ? { ...item, hired: true, hireable: false } : item)),
      );
      navigate(agentDetailPath(id));
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
      setError(message || t('aiAgents.catalog.hireError'));
    } finally {
      setHiringId(null);
    }
  };

  return (
    <>
      <TopBar />
      <div className="p-6 lg:px-8 lg:pb-8">
        <PageHeader title={t('aiAgents.catalog.title')} subtitle={t('aiAgents.catalog.subtitle')}>
          <Link to="/app/ai-agents" className="text-sm font-medium text-[#0077E6] hover:text-[#0066CC] whitespace-nowrap">
            {t('aiAgents.catalog.backHome')}
          </Link>
        </PageHeader>

        {error ? (
          <div className="mb-4">
            <ErrorMessage message={error} />
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-4 text-gray-600">{t('common.loading')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(440px,480px)] gap-5 items-start">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-dark-text">{t('aiAgents.catalog.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('aiAgents.catalog.subtitle')}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {AGENT_CATALOG.map((agent) => (
                  <AgentCatalogCard
                    key={agent.id}
                    agent={agent}
                    selected={agent.id === selectedId}
                    hired={isHired(agent.id)}
                    hiring={hiringId === agent.id}
                    onSelect={() => selectAgent(agent.id)}
                    onPreview={() => {
                      selectAgent(agent.id);
                      setPreviewId(agent.id);
                    }}
                    onPrimary={() => void handlePrimary(agent.id)}
                  />
                ))}
              </div>
            </section>

            <div className="xl:sticky xl:top-24">
              <AgentDetailPanel
                agent={selected}
                hired={isHired(selected.id)}
                hiring={hiringId === selected.id}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onHire={() => void handlePrimary(selected.id)}
              />
            </div>
          </div>
        )}
      </div>

      <AgentPreviewModal
        agent={previewAgent}
        isOpen={previewId !== null}
        hired={previewId ? isHired(previewId) : false}
        hiring={previewId !== null && hiringId === previewId}
        onClose={() => setPreviewId(null)}
        onPrimary={() => {
          if (!previewId) return;
          void handlePrimary(previewId);
        }}
      />
    </>
  );
}

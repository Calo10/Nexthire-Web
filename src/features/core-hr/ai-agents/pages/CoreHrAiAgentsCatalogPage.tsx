import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '../../../../components/TopBar';
import PageHeader from '../../../../components/ui/PageHeader';
import {
  DEFAULT_HR_AGENT_ID,
  HR_AGENT_CATALOG,
  getHrAgentById,
  hrAgentHomePath,
  isHrAgentId,
  type HrAgentId,
} from '../models/hrAgentCatalog';
import { hireHrAgent, isHrAgentHired } from '../lib/hrAgentHireStore';
import HrAgentCatalogCard from '../components/HrAgentCatalogCard';
import HrAgentDetailPanel from '../components/HrAgentDetailPanel';
import HrAgentPreviewModal from '../components/HrAgentPreviewModal';

export default function CoreHrAiAgentsCatalogPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<HrAgentId>(DEFAULT_HR_AGENT_ID);
  const [previewId, setPreviewId] = useState<HrAgentId | null>(null);
  const [hiringId, setHiringId] = useState<HrAgentId | null>(null);
  const [hiredTick, setHiredTick] = useState(0);

  useEffect(() => {
    const agentParam = searchParams.get('agent');
    if (isHrAgentId(agentParam)) setSelectedId(agentParam);
  }, [searchParams]);

  const selected = useMemo(() => getHrAgentById(selectedId), [selectedId]);
  const previewAgent = previewId ? getHrAgentById(previewId) : null;

  const isHired = (agentId: HrAgentId) => {
    void hiredTick;
    return isHrAgentHired(agentId);
  };

  const handlePrimary = (id: HrAgentId) => {
    const agent = getHrAgentById(id);
    if (agent.availability === 'future' || isHired(id)) return;
    setHiringId(id);
    hireHrAgent(id);
    setHiredTick((n) => n + 1);
    setHiringId(null);
  };

  return (
    <>
      <TopBar />
      <div className="p-6 lg:px-8 lg:pb-8">
        <PageHeader title={t('coreHrAiAgents.catalog.title')} subtitle={t('coreHrAiAgents.catalog.subtitle')}>
          <Link
            to={hrAgentHomePath()}
            className="text-sm font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap"
          >
            {t('coreHrAiAgents.catalog.backHome')}
          </Link>
        </PageHeader>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,400px)] gap-5 items-start">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-dark-text">{t('coreHrAiAgents.catalog.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('coreHrAiAgents.catalog.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
              {HR_AGENT_CATALOG.map((agent) => (
                <HrAgentCatalogCard
                  key={agent.id}
                  agent={agent}
                  selected={agent.id === selectedId}
                  hired={isHired(agent.id)}
                  hiring={hiringId === agent.id}
                  onSelect={() => setSelectedId(agent.id)}
                  onPreview={() => {
                    setSelectedId(agent.id);
                    setPreviewId(agent.id);
                  }}
                  onPrimary={() => handlePrimary(agent.id)}
                />
              ))}
            </div>
          </section>

          <div className="xl:sticky xl:top-24">
            <HrAgentDetailPanel
              agent={selected}
              hired={isHired(selected.id)}
              hiring={hiringId === selected.id}
              onHire={() => handlePrimary(selected.id)}
            />
          </div>
        </div>
      </div>

      <HrAgentPreviewModal
        agent={previewAgent}
        isOpen={previewId !== null}
        hired={previewId ? isHired(previewId) : false}
        hiring={previewId !== null && hiringId === previewId}
        onClose={() => setPreviewId(null)}
        onPrimary={() => {
          if (!previewId) return;
          handlePrimary(previewId);
        }}
      />
    </>
  );
}

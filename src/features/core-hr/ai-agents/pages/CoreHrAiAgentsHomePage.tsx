import { useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '../../../../components/TopBar';
import PageHeader from '../../../../components/ui/PageHeader';
import Button from '../../../../components/Button';
import Modal from '../../../../components/Modal';
import HrHiredAgentCard, { type HrHiredAgentView } from '../components/HrHiredAgentCard';
import {
  HR_AGENT_CATALOG,
  getHrAgentById,
  hrAgentCatalogPath,
  type HrAgentId,
} from '../models/hrAgentCatalog';
import { listHrHiredAgents, removeHrAgent } from '../lib/hrAgentHireStore';

function KpiIcon({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0 ${className}`}>
      {children}
    </span>
  );
}

function formatTokenCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

function loadHiredViews(): HrHiredAgentView[] {
  return listHrHiredAgents().map((row) => {
    const agent = getHrAgentById(row.agentId);
    return {
      ...agent,
      status: row.status,
      runs: row.runs,
      tokens: row.tokens,
    };
  });
}

export default function CoreHrAiAgentsHomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [hired, setHired] = useState<HrHiredAgentView[]>(() => loadHiredViews());
  const [removeId, setRemoveId] = useState<HrAgentId | null>(null);
  const [removing, setRemoving] = useState(false);

  const removeAgent = hired.find((item) => item.id === removeId);

  const analytics = useMemo(() => {
    const active = hired.filter((a) => a.status === 'active' || a.status === 'busy').length;
    const runs = hired.reduce((sum, a) => sum + a.runs, 0);
    const tokens = hired.reduce((sum, a) => sum + a.tokens, 0);
    return { total: hired.length, active, runs, tokens };
  }, [hired]);

  const browseAvatars = useMemo(() => {
    const hiredIds = new Set(hired.map((a) => a.id));
    const available = HR_AGENT_CATALOG.filter((a) => !hiredIds.has(a.id));
    const pool = available.length > 0 ? available : HR_AGENT_CATALOG;
    return pool.slice(0, 3).map((a) => a.avatar);
  }, [hired]);

  const kpis = [
    {
      id: 'total',
      label: t('coreHrAiAgents.home.kpis.total'),
      value: analytics.total,
      iconBg: 'bg-teal-50 text-teal-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'active',
      label: t('coreHrAiAgents.home.kpis.active'),
      value: analytics.active,
      iconBg: 'bg-emerald-50 text-emerald-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'runs',
      label: t('coreHrAiAgents.home.kpis.runs'),
      value: analytics.runs.toLocaleString(i18n.language),
      iconBg: 'bg-violet-50 text-violet-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" />
        </svg>
      ),
    },
    {
      id: 'tokens',
      label: t('coreHrAiAgents.home.kpis.tokens'),
      value: formatTokenCount(analytics.tokens),
      iconBg: 'bg-sky-50 text-sky-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <TopBar />
      <div className="p-6 lg:px-8 lg:pb-8">
        <PageHeader title={t('coreHrAiAgents.title')} subtitle={t('coreHrAiAgents.home.subtitle')}>
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate(hrAgentCatalogPath())}
            className="whitespace-nowrap !text-sm inline-flex items-center gap-1.5 !bg-gradient-to-r !from-teal-600 !to-emerald-500 hover:!from-teal-700 hover:!to-emerald-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('coreHrAiAgents.hireAgent')}
          </Button>
        </PageHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3.5">
              <div className="flex items-center gap-2.5">
                <KpiIcon className={kpi.iconBg}>{kpi.icon}</KpiIcon>
                <p className="text-[11px] text-gray-500 leading-tight">{kpi.label}</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-dark-text leading-none">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 inline-flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-dark-text">{t('coreHrAiAgents.home.myAgents')}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{t('coreHrAiAgents.home.myAgentsSubtitle')}</p>
                </div>
              </div>
              <Link
                to={hrAgentCatalogPath()}
                className="text-sm font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap"
              >
                {t('coreHrAiAgents.home.manageAgents')}
              </Link>
            </div>

            {hired.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex -space-x-2 mb-3" aria-hidden>
                  {['bg-[#E6F7EC]', 'bg-[#E8F3FF]', 'bg-[#F3ECFF]'].map((bg) => (
                    <span
                      key={bg}
                      className={`w-12 h-12 rounded-2xl border-2 border-dashed border-gray-200 ${bg} inline-flex items-center justify-center`}
                    >
                      <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium text-gray-400">{t('coreHrAiAgents.home.emptyHired')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {hired.map((agent) => (
                  <HrHiredAgentCard
                    key={agent.id}
                    agent={agent}
                    onOpen={() => navigate(hrAgentCatalogPath(agent.id))}
                    onRemove={() => setRemoveId(agent.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="flex -space-x-3 shrink-0">
                {browseAvatars.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="w-11 h-11 rounded-full border-2 border-white object-cover object-top bg-white"
                  />
                ))}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-dark-text">{t('coreHrAiAgents.home.hireMore')}</h3>
                <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">{t('coreHrAiAgents.home.hireMoreHint')}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate(hrAgentCatalogPath())}
              className="whitespace-nowrap !text-sm shrink-0 !bg-gradient-to-r !from-teal-600 !to-emerald-500 hover:!from-teal-700 hover:!to-emerald-600"
            >
              {t('coreHrAiAgents.home.browseCatalog')}
            </Button>
          </section>
        </div>
      </div>

      <Modal
        isOpen={removeId !== null}
        onClose={() => {
          if (!removing) setRemoveId(null);
        }}
        title={t('coreHrAiAgents.remove.title', { name: removeAgent?.firstName ?? '' })}
        width="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm" disabled={removing} onClick={() => setRemoveId(null)}>
              {t('coreHrAiAgents.actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={removing || !removeId}
              onClick={() => {
                if (!removeId) return;
                setRemoving(true);
                removeHrAgent(removeId);
                setHired((current) => current.filter((item) => item.id !== removeId));
                setRemoving(false);
                setRemoveId(null);
              }}
            >
              {t('coreHrAiAgents.actions.remove')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          {t('coreHrAiAgents.remove.description', {
            role: removeAgent ? t(`coreHrAiAgents.agents.${removeAgent.id}.name`) : '',
          })}
        </p>
      </Modal>
    </>
  );
}

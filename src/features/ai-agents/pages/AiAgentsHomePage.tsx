import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '../../../components/TopBar';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import { aiAgentsApi } from '../api/aiAgentsApi';
import HiredAgentCard from '../components/HiredAgentCard';
import AgentCorrelationModal from '../components/AgentCorrelationModal';
import { AgentStatusCard, RecentActivityCard, TokenUsageCard } from '../components/AgentHomeCharts';
import {
  catalogBrowseAvatars,
  deriveAnalytics,
  deriveHomeActivity,
  formatDelta,
  formatTokenCount,
  toHiredView,
  type HiredAgentView,
  type TokenEvent,
} from '../models/agentHome';
import { agentCatalogPath, agentDetailPath, type AgentId } from '../models/agentCatalog';

function KpiIcon({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span className={`w-10 h-10 rounded-xl inline-flex items-center justify-center shrink-0 ${className}`}>
      {children}
    </span>
  );
}

export default function AiAgentsHomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [hired, setHired] = useState<HiredAgentView[]>([]);
  const [tokenEvents, setTokenEvents] = useState<TokenEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<AgentId | null>(null);
  const [removing, setRemoving] = useState(false);
  const [correlationOpen, setCorrelationOpen] = useState(false);

  const analytics = useMemo(() => deriveAnalytics(hired, tokenEvents), [hired, tokenEvents]);
  const activity = useMemo(() => deriveHomeActivity(hired), [hired]);
  const removeAgent = hired.find((item) => item.id === removeId);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, usage] = await Promise.all([
        aiAgentsApi.listHired(),
        aiAgentsApi.getUsage(90).catch(() => ({ total: 0, events: [] as TokenEvent[] })),
      ]);
      setHired(rows.map(toHiredView));
      setTokenEvents(
        usage.events.map((event) => ({
          at: event.at,
          tokens: event.tokens,
        })),
      );
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
      setError(message || t('aiAgents.home.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const kpis = [
    {
      id: 'total',
      label: t('aiAgents.home.kpis.total'),
      value: analytics.totalAgents,
      delta: analytics.totalAgentsDelta,
      iconBg: 'bg-teal-50 text-teal-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'active',
      label: t('aiAgents.home.kpis.active'),
      value: analytics.activeAgents,
      delta: analytics.activeAgentsDelta,
      iconBg: 'bg-emerald-50 text-emerald-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'runs',
      label: t('aiAgents.home.kpis.runs'),
      value: analytics.runs.toLocaleString(i18n.language),
      delta: analytics.runsDelta,
      iconBg: 'bg-violet-50 text-violet-600',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86A1 1 0 008 5.14z" />
        </svg>
      ),
    },
    {
      id: 'tokens',
      label: t('aiAgents.home.kpis.tokens'),
      value: formatTokenCount(analytics.tokens),
      delta: analytics.tokensDelta,
      iconBg: 'bg-sky-50 text-sky-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
    },
    {
      id: 'workflows',
      label: t('aiAgents.home.kpis.workflows'),
      value: analytics.workflows.toLocaleString(i18n.language),
      delta: analytics.workflowsDelta,
      iconBg: 'bg-indigo-50 text-indigo-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 3.5a2 2 0 012 2V7h3.5A1.5 1.5 0 0115 8.5 1.5 1.5 0 0116.5 10H18a2 2 0 012 2v1.5a2 2 0 01-2 2h-1.5A1.5 1.5 0 0115 17a1.5 1.5 0 01-1.5 1.5H12v1a2 2 0 01-4 0v-1H6a2 2 0 01-2-2v-3.5a2 2 0 012-2h.5A1.5 1.5 0 018 9.5 1.5 1.5 0 016.5 8H6a2 2 0 01-2-2V5.5A2 2 0 016 3.5h2z" />
        </svg>
      ),
    },
    {
      id: 'meetings',
      label: t('aiAgents.home.kpis.meetings'),
      value: analytics.meetings.toLocaleString(i18n.language),
      delta: analytics.meetingsDelta,
      iconBg: 'bg-cyan-50 text-cyan-600',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  if (loading && hired.length === 0 && !error) {
    return (
      <>
        <TopBar />
        <div className="p-8 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="mt-4 text-gray-600">{t('aiAgents.home.loading')}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <div className="p-6 lg:px-8 lg:pb-8">
        <PageHeader title={t('aiAgents.title')} subtitle={t('aiAgents.home.subtitle')}>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCorrelationOpen(true)}
              className="whitespace-nowrap !text-sm inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              {t('aiAgents.correlation.button')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate(agentCatalogPath())}
              className="whitespace-nowrap !text-sm inline-flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('aiAgents.hireAgent')}
            </Button>
          </div>
        </PageHeader>

        {error ? (
          <div className="mb-5">
            <ErrorMessage message={error} />
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
          {kpis.map((kpi) => (
            <div key={kpi.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3.5">
              <div className="flex items-center gap-2.5">
                <KpiIcon className={kpi.iconBg}>{kpi.icon}</KpiIcon>
                <p className="text-[11px] text-gray-500 leading-tight">{kpi.label}</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-dark-text leading-none">{kpi.value}</p>
              {kpi.delta ? (
                <p className="mt-1.5 text-[11px] font-medium text-emerald-600">
                  {formatDelta(kpi.delta)} <span className="text-gray-400 font-normal">{t('aiAgents.home.vsPrior')}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-[11px] text-gray-400">&nbsp;</p>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(300px,340px)] gap-5 items-start">
          <div className="space-y-4 min-w-0">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 inline-flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-dark-text">{t('aiAgents.home.myAgents')}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{t('aiAgents.home.myAgentsSubtitle')}</p>
                  </div>
                </div>
                <Link
                  to={agentCatalogPath()}
                  className="text-sm font-medium text-[#0077E6] hover:text-[#0066CC] whitespace-nowrap"
                >
                  {t('aiAgents.home.manageAgents')}
                </Link>
              </div>

              {hired.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex -space-x-2 mb-3" aria-hidden>
                    {['bg-[#F3ECFF]', 'bg-[#E8F3FF]', 'bg-[#E6F7EC]'].map((bg) => (
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
                  <p className="text-sm font-medium text-gray-400">{t('aiAgents.home.emptyHired')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {hired.map((agent) => (
                    <HiredAgentCard
                      key={agent.agentId}
                      agent={agent}
                      onOpen={() => navigate(agentDetailPath(agent.id))}
                      onConfigure={() => navigate(agentDetailPath(agent.id))}
                      onViewActivity={() => navigate(agentDetailPath(agent.id))}
                      onRemove={() => setRemoveId(agent.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#E0E7FF] bg-gradient-to-r from-[#EEF4FF] to-[#F4F0FF] px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="flex -space-x-3 shrink-0">
                  {catalogBrowseAvatars(hired).map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      className="w-11 h-11 rounded-full border-2 border-white object-cover object-top bg-white"
                    />
                  ))}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-dark-text">{t('aiAgents.home.hireMore')}</h3>
                  <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">{t('aiAgents.home.hireMoreHint')}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={() => navigate(agentCatalogPath())}
                className="whitespace-nowrap !text-sm shrink-0"
              >
                {t('aiAgents.home.browseCatalog')}
              </Button>
            </section>
          </div>

          <div className="space-y-4 xl:sticky xl:top-24">
            <TokenUsageCard analytics={analytics} />
            <AgentStatusCard analytics={analytics} />
            <RecentActivityCard activity={activity} />
          </div>
        </div>
      </div>

      <Modal
        isOpen={removeId !== null}
        onClose={() => {
          if (!removing) setRemoveId(null);
        }}
        title={t('aiAgents.remove.title', { name: removeAgent?.firstName ?? '' })}
        width="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm" disabled={removing} onClick={() => setRemoveId(null)}>
              {t('aiAgents.actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={removing || !removeId}
              onClick={() => {
                if (!removeId) return;
                setRemoving(true);
                void aiAgentsApi
                  .unhire(removeId)
                  .then(() => setHired((current) => current.filter((item) => item.id !== removeId)))
                  .catch((e) => {
                    const message =
                      e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
                    setError(message || t('aiAgents.home.removeError'));
                  })
                  .finally(() => {
                    setRemoving(false);
                    setRemoveId(null);
                  });
              }}
            >
              {t('aiAgents.actions.remove')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          {t('aiAgents.remove.description', {
            role: removeAgent ? t(`aiAgents.agents.${removeAgent.id}.name`) : '',
          })}
        </p>
      </Modal>

      <AgentCorrelationModal
        isOpen={correlationOpen}
        onClose={() => setCorrelationOpen(false)}
        hired={hired}
      />
    </>
  );
}

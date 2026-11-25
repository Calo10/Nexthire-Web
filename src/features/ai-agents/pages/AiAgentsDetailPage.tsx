import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '../../../components/TopBar';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import { dashboardApi } from '../../../lib/api';
import { pipelineStagesApi } from '../../../api/pipelineStagesApi';
import { templatesApi } from '../../../api/templatesApi';
import type { Job } from '../../../types/dashboard';
import type { PipelineStageSettings } from '../../../types/pipelineStages';
import type { Template } from '../../../types/templates';
import { aiAgentsApi, type AgentContext, type HiredAgent } from '../api/aiAgentsApi';
import { getAgentById, isAgentId, agentCatalogPath } from '../models/agentCatalog';
import {
  AGENT_DETAIL_TABS,
  agentHomePath,
  deriveAgentDetail,
  isAgentDetailTab,
  type AgentDetailTab,
} from '../models/agentDetail';
import AgentChatPanel from '../components/AgentChatPanel';
import AgentContextForm from '../components/AgentContextForm';
import AgentDetailOverview from '../components/AgentDetailOverview';
import { AgentStatIcon, PauseIcon, PlayIcon } from '../components/AgentIcons';

const TAB_ICONS: Record<AgentDetailTab, ReactNode> = {
  overview: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5h7v7H4V5zm9 0h7v4h-7V5zM4 14h7v5H4v-5zm9 6h7v-7h-7v7z" />
    </svg>
  ),
  chat: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 10h8M8 14h5M21 12a9 9 0 01-9 9 8.7 8.7 0 01-3.7-.8L3 21l.9-4.2A9 9 0 1112 3a9 9 0 019 9z" />
    </svg>
  ),
  activity: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  context: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7h8M8 12h8M8 17h5M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
    </svg>
  ),
  knowledge: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 5a2 2 0 012-2h5v16H6a2 2 0 01-2-2V5zm9-2h5a2 2 0 012 2v12a2 2 0 01-2 2h-5V3z" />
    </svg>
  ),
  usage: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    </svg>
  ),
};

const STATUS_TONES = {
  active: 'bg-emerald-50 text-emerald-700',
  paused: 'bg-slate-100 text-slate-600',
  busy: 'bg-amber-50 text-amber-700',
  inactive: 'bg-gray-100 text-gray-500',
};

export default function AiAgentsDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { agentId: rawAgentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const agentId = isAgentId(rawAgentId) ? rawAgentId : null;
  const catalog = agentId ? getAgentById(agentId) : null;

  const [agent, setAgent] = useState<HiredAgent | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stages, setStages] = useState<PipelineStageSettings[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [context, setContext] = useState<AgentContext>({
    cadence: 'daily',
    channel: 'email',
    responseWaitHours: 48,
    maxProcessed: 100,
    autoConversionPercent: 10,
    maxOffersToSend: 10,
    notes: '',
  });

  const tabParam = searchParams.get('tab');
  const activeTab: AgentDetailTab = isAgentDetailTab(tabParam) ? tabParam : 'overview';

  const setTab = (tab: AgentDetailTab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'overview') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setMoreOpen(false);
  }, [agentId, activeTab]);

  useEffect(() => {
    if (!agentId) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [hired, jobList, stageList] = await Promise.all([
          aiAgentsApi.get(agentId),
          dashboardApi.getJobs().catch(() => [] as Job[]),
          agentId === 'screening' || agentId === 'interview' || agentId === 'offer'
            ? pipelineStagesApi.list().catch(() => [] as PipelineStageSettings[])
            : Promise.resolve([] as PipelineStageSettings[]),
        ]);
        if (cancelled) return;
        if (!hired) {
          navigate(agentCatalogPath(agentId), { replace: true });
          return;
        }
        setAgent(hired);
        setJobs(Array.isArray(jobList) ? jobList : []);
        setStages(Array.isArray(stageList) ? stageList : []);
        const defaultChannel = agentId === 'campaign' ? 'meta' : 'email';
        const defaultMaxProcessed =
          agentId === 'campaign'
            ? 50
            : agentId === 'offer'
              ? 10
              : agentId === 'screening' || agentId === 'interview'
                ? 25
                : 100;
        setContext({
          jobId: hired.context?.jobId || '',
          stageId: hired.context?.stageId || '',
          cadence: hired.context?.cadence || 'daily',
          channel: hired.context?.channel || defaultChannel,
          templateId: hired.context?.templateId || '',
          responseWaitHours: hired.context?.responseWaitHours ?? 48,
          maxProcessed: hired.context?.maxProcessed ?? defaultMaxProcessed,
          autoConversionPercent: hired.context?.autoConversionPercent ?? 10,
          maxOffersToSend: hired.context?.maxOffersToSend ?? 10,
          notes: hired.context?.notes || '',
          lastRunAt: hired.context?.lastRunAt || null,
          nextRunAt: hired.context?.nextRunAt || null,
          lastPlan: hired.context?.lastPlan || '',
          lastSummary: hired.context?.lastSummary || '',
          campaignDailyBudget: hired.context?.campaignDailyBudget ?? 10,
          campaignDesiredStatus: hired.context?.campaignDesiredStatus || 'paused',
          campaignDestinationUrl: hired.context?.campaignDestinationUrl || '',
          campaignCountryCode: hired.context?.campaignCountryCode || 'US',
          campaigns: hired.context?.campaigns || [],
          outreach: hired.context?.outreach || [],
          reviews: hired.context?.reviews || [],
          convertedCandidates: hired.context?.convertedCandidates || 0,
          chatTokens: hired.context?.chatTokens || 0,
        });
      } catch (e) {
        if (cancelled) return;
        const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
        setError(message || t('aiAgents.detail.loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [agentId, navigate, t]);

  useEffect(() => {
    if (agentId !== 'screening' && agentId !== 'interview' && agentId !== 'offer') {
      setTemplates([]);
      return;
    }
    const channel = (context.channel || 'email') === 'whatsapp' ? 'whatsapp' : 'email';
    let cancelled = false;
    templatesApi
      .list({ channel })
      .then((items) => {
        if (!cancelled) setTemplates(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId, context.channel]);

  const detail = useMemo(() => (agent ? deriveAgentDetail(agent) : null), [agent]);
  const paused = agent?.status === 'paused';
  const status = agent?.status ?? 'inactive';

  const jobOptions = useMemo(
    () => [
      { value: '', label: t('aiAgents.detail.jobAll') },
      ...jobs.map((job) => ({ value: String(job.id), label: job.title || String(job.id) })),
    ],
    [jobs, t],
  );

  const stageOptions = useMemo(
    () => stages.map((stage) => ({ value: String(stage.id), label: stage.name || String(stage.id) })),
    [stages],
  );

  const templateOptions = useMemo(
    () => templates.map((item) => ({ value: String(item.id), label: item.name || String(item.id) })),
    [templates],
  );

  const jobLabel = useMemo(() => {
    if (!context.jobId) return '';
    return jobs.find((job) => String(job.id) === String(context.jobId))?.title || '';
  }, [context.jobId, jobs]);

  if (!agentId || !catalog) return <Navigate to={agentHomePath()} replace />;

  if (loading && !agent) {
    return (
      <>
        <TopBar />
        <div className="p-8 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="mt-4 text-gray-600">{t('aiAgents.detail.loading')}</p>
          </div>
        </div>
      </>
    );
  }

  if (!agent || !detail) {
    return <Navigate to={agentCatalogPath(agentId)} replace />;
  }

  const saveContext = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await aiAgentsApi.updateContext(agentId, {
        ...context,
        jobId: context.jobId || null,
        stageId: context.stageId || null,
      });
      setAgent(updated);
      setContext((current) => ({
        ...current,
        ...updated.context,
        jobId: updated.context?.jobId || '',
        stageId: updated.context?.stageId || '',
      }));
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
      setError(message || t('aiAgents.detail.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const togglePause = async () => {
    setSaving(true);
    setError(null);
    try {
      const next = paused ? 'active' : 'paused';
      const updated = await aiAgentsApi.setStatus(agentId, next);
      setAgent(updated);
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
      setError(message || t('aiAgents.detail.statusError'));
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunError(null);
    try {
      const updated = await aiAgentsApi.run(agentId);
      setAgent(updated);
      setContext((current) => ({
        ...current,
        lastRunAt: updated.context?.lastRunAt || null,
        nextRunAt: updated.context?.nextRunAt || null,
        lastPlan: updated.context?.lastPlan || '',
        lastSummary: updated.context?.lastSummary || '',
        maxProcessed: updated.context?.maxProcessed ?? current.maxProcessed,
        autoConversionPercent: updated.context?.autoConversionPercent ?? current.autoConversionPercent,
        stageId: updated.context?.stageId ?? current.stageId,
        responseWaitHours: updated.context?.responseWaitHours ?? current.responseWaitHours,
        templateId: updated.context?.templateId ?? current.templateId,
        outreach: updated.context?.outreach || current.outreach,
        reviews: updated.context?.reviews || current.reviews,
        convertedCandidates: updated.context?.convertedCandidates ?? current.convertedCandidates,
      }));
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
      setRunError(message || t('aiAgents.detail.runError'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <TopBar />
      <div className="p-6 lg:px-8 lg:pb-8">
        <nav className="text-sm text-gray-400 mb-4">
          <Link to={agentHomePath()} className="hover:text-[#0077E6]">
            {t('aiAgents.home.myAgents')}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-dark-text font-medium">{catalog.firstName}</span>
        </nav>

        {error ? (
          <div className="mb-4">
            <ErrorMessage message={error} />
          </div>
        ) : null}
        {runError ? (
          <div className="mb-4">
            <ErrorMessage message={runError} />
          </div>
        ) : null}

        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-5">
          <div className="flex items-start gap-3.5 min-w-0">
            <img
              src={catalog.avatar}
              alt=""
              className={`w-16 h-16 rounded-2xl object-cover object-top shrink-0 ${catalog.avatarBg}`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-dark-text leading-tight">{catalog.firstName}</h1>
                <span
                  className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-[11px] font-medium ${STATUS_TONES[status]}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status === 'paused' ? 'bg-slate-400' : status === 'busy' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  {t(`aiAgents.home.status.${status}`)}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-[#0077E6]">{t(`aiAgents.agents.${catalog.id}.name`)}</p>
              <p className="mt-1 text-sm text-gray-500 max-w-2xl">
                {t(`aiAgents.detail.agents.${catalog.id}.tagline`, {
                  defaultValue: t(`aiAgents.agents.${catalog.id}.description`),
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch xl:items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 relative">
              <button
                type="button"
                onClick={() => void handleRun()}
                disabled={running || paused}
                className="h-10 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#0077E6] to-[#00AAFF] hover:from-[#0066CC] hover:to-[#0099EE] inline-flex items-center gap-2 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500"
              >
                <PlayIcon className="w-3.5 h-3.5" />
                {running ? t('aiAgents.detail.running') : t('aiAgents.detail.runNow')}
              </button>
              <button
                type="button"
                onClick={() => void togglePause()}
                disabled={saving}
                className="h-10 px-4 rounded-xl text-sm font-medium text-dark-text border border-gray-200 bg-white hover:bg-gray-50 inline-flex items-center gap-2"
              >
                {paused ? <PlayIcon className="w-3.5 h-3.5" /> : <PauseIcon className="w-3.5 h-3.5" />}
                {paused ? t('aiAgents.detail.resumeAgent') : t('aiAgents.detail.pauseAgent')}
              </button>
              <button
                type="button"
                onClick={() => setMoreOpen((value) => !value)}
                className="w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 inline-flex items-center justify-center"
                aria-label={t('aiAgents.actions.more')}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              {moreOpen ? (
                <div className="absolute right-0 top-12 z-10 w-48 rounded-xl border border-gray-200 bg-white shadow-lg py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      navigate(agentCatalogPath(catalog.id));
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-dark-text hover:bg-gray-50"
                  >
                    {t('aiAgents.detail.viewCatalog')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      setConfirmRemove(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    {t('aiAgents.actions.remove')}
                  </button>
                </div>
              ) : null}
            </div>
            {context.nextRunAt || context.lastRunAt ? (
              <p className="text-xs text-gray-400">
                {context.nextRunAt
                  ? t('aiAgents.detail.nextRunAtLabel', { date: new Date(context.nextRunAt).toLocaleString() })
                  : t('aiAgents.detail.lastRunAtLabel', {
                      date: context.lastRunAt ? new Date(context.lastRunAt).toLocaleString() : '',
                    })}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
          {AGENT_DETAIL_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTab(tab)}
              className={`h-11 px-3.5 inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#0077E6] text-[#0077E6]'
                  : 'border-transparent text-gray-500 hover:text-dark-text'
              }`}
            >
              {TAB_ICONS[tab]}
              {t(`aiAgents.detail.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' ? (
          <AgentDetailOverview detail={detail} onTab={setTab} jobLabel={jobLabel} />
        ) : null}

        {activeTab === 'chat' ? (
          <AgentChatPanel
            agent={detail.agent}
            paused={paused}
            onAgentUpdate={(updated) => {
              setAgent(updated);
              setContext((current) => ({
                ...current,
                ...updated.context,
                jobId: updated.context?.jobId || '',
                lastRunAt: updated.context?.lastRunAt || null,
                nextRunAt: updated.context?.nextRunAt || null,
                lastPlan: updated.context?.lastPlan || '',
                lastSummary: updated.context?.lastSummary || '',
              }));
            }}
          />
        ) : null}

        {activeTab === 'activity' ? (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-dark-text mb-4">{t('aiAgents.detail.recentActivity')}</h2>
            {detail.timeline.length === 0 ? (
              <p className="text-sm text-gray-500">{t('aiAgents.detail.emptyActivity')}</p>
            ) : (
              <ul className="space-y-4">
                {detail.timeline.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <span className="mt-0.5 w-9 h-9 rounded-lg bg-[#F5F3FF] text-[#7C3AED] inline-flex items-center justify-center shrink-0">
                      <AgentStatIcon kind={item.icon} className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-dark-text leading-snug">{item.title}</p>
                      {item.meta ? (
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {new Date(item.meta).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {activeTab === 'context' ? (
          <AgentContextForm
            agentId={agentId}
            context={context}
            jobOptions={jobOptions}
            stageOptions={stageOptions}
            templateOptions={templateOptions}
            saving={saving}
            onChange={setContext}
            onSave={() => void saveContext()}
          />
        ) : null}

        {activeTab === 'knowledge' ? (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-dark-text mb-4">{t('aiAgents.sections.knowledge')}</h2>
            <ul className="space-y-2">
              {catalog.knowledge.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-3.5 py-3 text-sm text-gray-700"
                >
                  {t(`aiAgents.agents.${catalog.id}.knowledge.${item.id}`)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {activeTab === 'usage' ? (
          <AgentDetailOverview detail={detail} onTab={setTab} mode="usage" jobLabel={jobLabel} />
        ) : null}
      </div>

      <Modal
        isOpen={confirmRemove}
        onClose={() => {
          if (!removing) setConfirmRemove(false);
        }}
        title={t('aiAgents.remove.title', { name: catalog.firstName })}
        width="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm" disabled={removing} onClick={() => setConfirmRemove(false)}>
              {t('aiAgents.actions.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={removing}
              onClick={() => {
                setRemoving(true);
                void aiAgentsApi
                  .unhire(agentId)
                  .then(() => navigate(agentHomePath()))
                  .catch((e) => {
                    const message =
                      e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
                    setError(message || t('aiAgents.home.removeError'));
                  })
                  .finally(() => {
                    setRemoving(false);
                    setConfirmRemove(false);
                  });
              }}
            >
              {t('aiAgents.actions.remove')}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          {t('aiAgents.remove.description', { role: t(`aiAgents.agents.${catalog.id}.name`) })}
        </p>
      </Modal>
    </>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import SelectField from '../components/SelectField';
import TextField from '../components/TextField';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../lib/api';
import type { Job } from '../types/dashboard';
import type { TemplateChannel } from '../types/templates';
import type { AgentCadence, AiAgentsJobConfig, MessagingAgentConfig } from '../types/aiAgents';
import { useTemplatesList } from '../hooks/useTemplatesApi';
import AiAgentPerformanceModal from '../components/aiAgents/AiAgentPerformanceModal';

const STORAGE_KEY = 'nexthire:aiAgents:v1';

function defaultJobConfig(): AiAgentsJobConfig {
  return {
    sourcing: {
      autoConversionPercent: 10,
      maxProcessed: 100,
      cadence: 'daily',
    },
    screening: {
      channel: 'email',
      templateId: '',
      responseWaitHours: 48,
      advanceCadence: 'daily',
    },
    interview: {
      channel: 'email',
      templateId: '',
      responseWaitHours: 72,
      advanceCadence: 'weekly',
    },
    offer: {
      channel: 'email',
      templateId: '',
      responseWaitHours: 120,
      advanceCadence: 'weekly',
      maxOffersToSend: 10,
    },
  };
}

function loadStoredConfigs(): Record<string, AiAgentsJobConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, AiAgentsJobConfig>) : {};
  } catch {
    return {};
  }
}

function mergeStored(jobKey: string): AiAgentsJobConfig {
  const base = defaultJobConfig();
  const stored = loadStoredConfigs()[jobKey];
  if (!stored) return base;
  return {
    sourcing: { ...base.sourcing, ...stored.sourcing },
    screening: { ...base.screening, ...stored.screening },
    interview: { ...base.interview, ...stored.interview },
    offer: { ...base.offer, ...stored.offer },
  };
}

function persistJobConfig(jobKey: string, cfg: AiAgentsJobConfig) {
  const all = loadStoredConfigs();
  all[jobKey] = cfg;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

type AgentTab = 'sourcing' | 'screening' | 'interview' | 'offer';

function MessagingStageFields({
  description,
  config,
  onChange,
  channelLabel,
  templateLabel,
  channelOptions,
  cadenceOptions,
  emailTemplates,
  waTemplates,
  templatesLoading,
  advanceLabel,
  responseWaitLabel,
  selectTemplatePlaceholder,
  templatesLoadingLabel,
  showMaxOffers,
  maxOffersLabel,
}: {
  description: string;
  config: MessagingAgentConfig;
  onChange: (next: MessagingAgentConfig) => void;
  channelLabel: string;
  templateLabel: string;
  channelOptions: { value: string; label: string }[];
  cadenceOptions: { value: string; label: string }[];
  emailTemplates: { id: string; name: string }[];
  waTemplates: { id: string; name: string }[];
  templatesLoading: boolean;
  advanceLabel: string;
  responseWaitLabel: string;
  selectTemplatePlaceholder: string;
  templatesLoadingLabel: string;
  showMaxOffers?: boolean;
  maxOffersLabel?: string;
}) {
  const list = config.channel === 'email' ? emailTemplates : waTemplates;
  const tplOpts = [
    { value: '', label: templatesLoading ? templatesLoadingLabel : selectTemplatePlaceholder },
    ...list.map((tpl) => ({ value: tpl.id, label: tpl.name })),
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">{description}</p>
      <SelectField
        label={channelLabel}
        value={config.channel}
        onChange={(e) =>
          onChange({
            ...config,
            channel: e.target.value as TemplateChannel,
            templateId: '',
          })
        }
        options={channelOptions}
      />
      <SelectField label={templateLabel} value={config.templateId} onChange={(e) => onChange({ ...config, templateId: e.target.value })} options={tplOpts} disabled={templatesLoading} />
      <TextField
        label={responseWaitLabel}
        type="number"
        min={1}
        value={String(config.responseWaitHours)}
        onChange={(e) => onChange({ ...config, responseWaitHours: Number(e.target.value) })}
      />
      <SelectField label={advanceLabel} value={config.advanceCadence} onChange={(e) => onChange({ ...config, advanceCadence: e.target.value as AgentCadence })} options={cadenceOptions} />
      {showMaxOffers && maxOffersLabel ? (
        <TextField
          label={maxOffersLabel}
          type="number"
          min={1}
          value={String(config.maxOffersToSend ?? 10)}
          onChange={(e) => onChange({ ...config, maxOffersToSend: Number(e.target.value) })}
        />
      ) : null}
    </div>
  );
}

const CHEVRON_PX = 14;

function clipForChevronStep(i: number, total: number): string {
  if (total <= 1) return 'none';
  const w = CHEVRON_PX;
  if (i === 0) return `polygon(0 0, calc(100% - ${w}px) 0, 100% 50%, calc(100% - ${w}px) 100%, 0 100%)`;
  if (i === total - 1) return `polygon(${w}px 0, 100% 0, 100% 100%, ${w}px 100%, 0 50%)`;
  return `polygon(${w}px 0, calc(100% - ${w}px) 0, 100% 50%, calc(100% - ${w}px) 100%, ${w}px 100%, 0 50%)`;
}

function SavedAgentIcon() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-primary"
      aria-hidden
    >
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"
        />
      </svg>
    </div>
  );
}

function AgentChevronStepper({
  tabs: tabItems,
  activeTab,
  onSelect,
}: {
  tabs: { id: AgentTab; label: string }[];
  activeTab: AgentTab;
  onSelect: (id: AgentTab) => void;
}) {
  const n = tabItems.length;
  return (
    <div className="flex w-full min-w-0 items-stretch" role="tablist" aria-label="Agent stages">
      {tabItems.map((tab, i) => {
        const active = activeTab === tab.id;
        const overlap = i === 0 ? 0 : -CHEVRON_PX;
        const z = active ? 30 + i : 10 + i;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(tab.id)}
            className={[
              'relative flex-1 min-w-[6.5rem] py-2.5 text-center text-sm font-semibold transition-[color,box-shadow,background-color] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              active ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-700 hover:bg-purple-50/90',
              !active ? 'shadow-[inset_0_0_0_1px_rgb(233,213,255)]' : '',
              i === 0 ? 'pl-4 pr-7' : 'pl-7 pr-7',
              i === n - 1 ? 'pr-4' : '',
            ].join(' ')}
            style={{
              marginLeft: overlap,
              zIndex: z,
              clipPath: clipForChevronStep(i, n),
            }}
          >
            <span className="block truncate px-0.5">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function AiAgentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const shouldFetch = isAuthenticated && !authLoading;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [selectedJobKey, setSelectedJobKey] = useState('');
  const [activeTab, setActiveTab] = useState<AgentTab>('sourcing');
  const [form, setForm] = useState<AiAgentsJobConfig>(() => defaultJobConfig());
  const [storedConfigs, setStoredConfigs] = useState<Record<string, AiAgentsJobConfig>>(() => loadStoredConfigs());
  const [modalOpen, setModalOpen] = useState(false);
  const [metricsModal, setMetricsModal] = useState<{ jobId: string; jobTitle: string } | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const { data: emailTemplates, isLoading: emailTplLoading } = useTemplatesList(shouldFetch && Boolean(selectedJobKey), 'email');
  const { data: waTemplates, isLoading: waTplLoading } = useTemplatesList(shouldFetch && Boolean(selectedJobKey), 'whatsapp');
  const templatesLoading = emailTplLoading || waTplLoading;

  useEffect(() => {
    if (!shouldFetch) {
      setJobsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setJobsLoading(true);
      setJobsError(null);
      try {
        const list = await dashboardApi.getJobs();
        if (!cancelled) setJobs(Array.isArray(list) ? list : []);
      } catch (e: unknown) {
        if (!cancelled) {
          const err = e as { status?: number; message?: string };
          if (err?.status === 401) {
            logout();
            navigate('/login', { replace: true });
            return;
          }
          setJobsError(err?.message || t('aiAgents.errors.loadJobs'));
          setJobs([]);
        }
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shouldFetch, logout, navigate, t]);

  const jobOptions = useMemo(() => {
    return jobs.map((j) => ({
      value: String(j.id),
      label: `${j.title} (${String(j.id)})`,
    }));
  }, [jobs]);

  const cadenceOptions = useMemo(
    () => [
      { value: 'hourly', label: t('aiAgents.cadence.hourly') },
      { value: 'daily', label: t('aiAgents.cadence.daily') },
      { value: 'weekly', label: t('aiAgents.cadence.weekly') },
    ],
    [t]
  );

  const channelOptions = useMemo(
    () => [
      { value: 'email', label: t('aiAgents.channel.email') },
      { value: 'whatsapp', label: t('aiAgents.channel.whatsapp') },
    ],
    [t]
  );

  const savedAgentsRows = useMemo(() => {
    const keys = Object.keys(storedConfigs);
    return keys.map((jobId) => {
      const job = jobs.find((j) => String(j.id) === jobId);
      const cfg = storedConfigs[jobId];
      return {
        jobId,
        jobTitle: job?.title || t('aiAgents.unknownJob'),
        sourcingCadence: cfg?.sourcing?.cadence || 'daily',
        screeningChannel: cfg?.screening?.channel || 'email',
        updatedAt: cfg?.updatedAt || '',
      };
    });
  }, [storedConfigs, jobs, t]);

  const handleSelectJob = useCallback((jobKey: string) => {
    setSelectedJobKey(jobKey);
    setToastSuccess(null);
    setToastError(null);
    setActiveTab('sourcing');
    if (!jobKey) {
      setForm(defaultJobConfig());
      return;
    }
    setForm(mergeStored(jobKey));
  }, []);

  const openNewAgentModal = () => {
    setToastError(null);
    setToastSuccess(null);
    setActiveTab('sourcing');
    setSelectedJobKey('');
    setForm(defaultJobConfig());
    setModalOpen(true);
  };

  const openEditAgentModal = (jobKey: string) => {
    handleSelectJob(jobKey);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!selectedJobKey) return;
    setForm((f) => {
      const fix = (cfg: MessagingAgentConfig, list: { id: string }[]) => {
        if (cfg.templateId && list.length > 0 && !list.some((x) => x.id === cfg.templateId)) {
          return { ...cfg, templateId: '' };
        }
        return cfg;
      };
      const emailList = emailTemplates.map((x) => ({ id: x.id }));
      const waList = waTemplates.map((x) => ({ id: x.id }));
      const screening = fix(f.screening, f.screening.channel === 'email' ? emailList : waList);
      const interview = fix(f.interview, f.interview.channel === 'email' ? emailList : waList);
      const offer = fix(f.offer, f.offer.channel === 'email' ? emailList : waList);
      if (screening === f.screening && interview === f.interview && offer === f.offer) return f;
      return { ...f, screening, interview, offer };
    });
  }, [selectedJobKey, emailTemplates, waTemplates]);

  const handleSave = () => {
    if (!selectedJobKey) return;
    try {
      persistJobConfig(selectedJobKey, { ...form, updatedAt: new Date().toISOString() });
      setStoredConfigs(loadStoredConfigs());
      setToastSuccess(t('aiAgents.saved'));
      setToastError(null);
      setModalOpen(false);
    } catch {
      setToastError(t('aiAgents.errors.save'));
    }
  };

  const tabs: { id: AgentTab; label: string }[] = [
    { id: 'sourcing', label: t('aiAgents.tabs.sourcing') },
    { id: 'screening', label: t('aiAgents.tabs.screening') },
    { id: 'interview', label: t('aiAgents.tabs.interview') },
    { id: 'offer', label: t('aiAgents.tabs.offer') },
  ];

  const messagingCommon = {
    channelOptions,
    cadenceOptions,
    emailTemplates,
    waTemplates,
    templatesLoading,
    responseWaitLabel: t('aiAgents.messaging.responseWait'),
    selectTemplatePlaceholder: t('aiAgents.selectTemplate'),
    templatesLoadingLabel: t('aiAgents.templatesLoading'),
    channelLabel: t('aiAgents.messaging.channel'),
    templateLabel: t('aiAgents.messaging.template'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <TopBar />

      <div className="p-8 max-w-7xl mx-auto w-full">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-dark-text">{t('aiAgents.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('aiAgents.subtitle')}</p>
          </div>
          <Button type="button" variant="primary" size="sm" className="shrink-0 self-start sm:self-auto" onClick={openNewAgentModal}>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('aiAgents.newAgent')}
            </span>
          </Button>
        </div>

        {toastError ? (
          <div className="mb-4">
            <ErrorMessage message={toastError} />
          </div>
        ) : null}
        {toastSuccess ? (
          <div className="mb-4">
            <SuccessMessage message={toastSuccess} />
          </div>
        ) : null}
        {jobsError ? (
          <div className="mb-4">
            <ErrorMessage message={jobsError} />
          </div>
        ) : null}

        <div className="rounded-2xl border border-purple-100 bg-white shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-dark-text">{t('aiAgents.savedTable.title')}</h2>
          </div>
          {savedAgentsRows.length === 0 ? (
            <div className="px-6 py-5 text-sm text-gray-600">{t('aiAgents.savedTable.empty')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="w-14 px-3 py-3 font-semibold text-left bg-purple-50/80 text-gray-600 border-b border-purple-100"
                    >
                      <span className="sr-only">{t('aiAgents.savedTable.agentColumn')}</span>
                    </th>
                    <th className="px-4 py-3 font-semibold text-left bg-purple-50/80 text-gray-600 border-b border-purple-100">{t('aiAgents.savedTable.job')}</th>
                    <th className="px-4 py-3 font-semibold text-left bg-purple-50/80 text-gray-600 border-b border-purple-100">{t('aiAgents.savedTable.sourcingCadence')}</th>
                    <th className="px-4 py-3 font-semibold text-left bg-purple-50/80 text-gray-600 border-b border-purple-100">{t('aiAgents.savedTable.screeningChannel')}</th>
                    <th className="px-4 py-3 font-semibold text-left bg-purple-50/80 text-gray-600 border-b border-purple-100">{t('aiAgents.savedTable.updatedAt')}</th>
                    <th className="px-4 py-3 font-semibold text-right bg-purple-50/80 text-gray-600 border-b border-purple-100">{t('aiAgents.savedTable.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {savedAgentsRows.map((row) => (
                    <tr key={row.jobId} className="border-b border-gray-100 hover:bg-purple-50/40">
                      <td className="px-3 py-3 align-middle">
                        <SavedAgentIcon />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-dark-text">{row.jobTitle}</div>
                        <div className="text-xs text-gray-500">{row.jobId}</div>
                      </td>
                      <td className="px-4 py-3">{t(`aiAgents.cadence.${row.sourcingCadence}`)}</td>
                      <td className="px-4 py-3">{t(`aiAgents.channel.${row.screeningChannel}`)}</td>
                      <td className="px-4 py-3 text-gray-600">{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex flex-nowrap items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="!py-1 !px-2 shrink-0"
                            onClick={() => setMetricsModal({ jobId: row.jobId, jobTitle: row.jobTitle })}
                          >
                            {t('aiAgents.savedTable.metrics')}
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="!py-1 !px-2 shrink-0" onClick={() => openEditAgentModal(row.jobId)}>
                            {t('aiAgents.savedTable.open')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AiAgentPerformanceModal
        isOpen={Boolean(metricsModal)}
        onClose={() => setMetricsModal(null)}
        jobId={metricsModal?.jobId ?? ''}
        jobTitle={metricsModal?.jobTitle ?? ''}
        config={metricsModal ? storedConfigs[metricsModal.jobId] ?? null : null}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={t('aiAgents.modalTitle')} width="xl">
        <div className="space-y-4">
          <SelectField
            label={t('aiAgents.selectJob')}
            value={selectedJobKey}
            onChange={(e) => handleSelectJob(e.target.value)}
            disabled={jobsLoading}
            options={[{ value: '', label: jobsLoading ? t('aiAgents.loadingJobs') : t('aiAgents.jobPlaceholder') }, ...jobOptions]}
          />
          {!selectedJobKey ? <p className="text-sm text-gray-600">{t('aiAgents.hintSelectJob')}</p> : null}

          {selectedJobKey ? (
            <>
              <div className="rounded-lg border border-purple-100 bg-purple-50/40 p-1.5 overflow-x-auto">
                <AgentChevronStepper tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
              </div>

              <Card className="p-4 md:p-6 border border-gray-100 shadow-none">
                {activeTab === 'sourcing' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{t('aiAgents.sourcing.description')}</p>
                    <TextField
                      label={t('aiAgents.sourcing.autoConversionPercent')}
                      type="number"
                      min={0}
                      max={100}
                      value={String(form.sourcing.autoConversionPercent)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sourcing: { ...f.sourcing, autoConversionPercent: Number(e.target.value) },
                        }))
                      }
                    />
                    <TextField
                      label={t('aiAgents.sourcing.maxProcessed')}
                      type="number"
                      min={1}
                      value={String(form.sourcing.maxProcessed)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sourcing: { ...f.sourcing, maxProcessed: Number(e.target.value) },
                        }))
                      }
                    />
                    <SelectField
                      label={t('aiAgents.sourcing.executionCadence')}
                      value={form.sourcing.cadence}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sourcing: { ...f.sourcing, cadence: e.target.value as AgentCadence },
                        }))
                      }
                      options={cadenceOptions}
                    />
                  </div>
                ) : null}

                {activeTab === 'screening' ? (
                  <MessagingStageFields
                    description={t('aiAgents.screening.description')}
                    config={form.screening}
                    onChange={(next) => setForm((f) => ({ ...f, screening: next }))}
                    advanceLabel={t('aiAgents.messaging.advanceToInterview')}
                    {...messagingCommon}
                  />
                ) : null}

                {activeTab === 'interview' ? (
                  <MessagingStageFields
                    description={t('aiAgents.interview.description')}
                    config={form.interview}
                    onChange={(next) => setForm((f) => ({ ...f, interview: next }))}
                    advanceLabel={t('aiAgents.messaging.advanceToOffer')}
                    {...messagingCommon}
                  />
                ) : null}

                {activeTab === 'offer' ? (
                  <MessagingStageFields
                    description={t('aiAgents.offer.description')}
                    config={form.offer}
                    onChange={(next) => setForm((f) => ({ ...f, offer: next }))}
                    advanceLabel={t('aiAgents.messaging.advanceAfterOffer')}
                    showMaxOffers
                    maxOffersLabel={t('aiAgents.offer.maxOffersToSend')}
                    {...messagingCommon}
                  />
                ) : null}
              </Card>
            </>
          ) : null}

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="button" variant="primary" onClick={handleSave} disabled={!selectedJobKey}>
              {t('aiAgents.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

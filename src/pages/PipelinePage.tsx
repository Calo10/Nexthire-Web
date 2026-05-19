import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
import TextareaField from '../components/TextareaField';
import TextField from '../components/TextField';
import type { Job } from '../types/dashboard';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../hooks/useJobs';
import { useKanban } from '../hooks/useKanban';
import CreateApplicationModal from '../components/pipeline/CreateApplicationModal';
import { applicationsApi, isUnauthorized } from '../api/applicationsApi';
import { emailApi } from '../api/emailApi';
import { whatsappApi } from '../api/whatsappApi';
import { candidatesApi } from '../api/candidatesApi';
import PipelineSummaryTiles from '../components/pipeline/PipelineSummaryTiles';
import PipelineBoard from '../components/pipeline/PipelineBoard';
import ApplicationInspectorPanel from '../components/pipeline/ApplicationInspectorPanel';
import type { KanbanApplicationCard } from '../types/applications';
import type { TemplateChannel } from '../types/templates';
import { useTemplate, useTemplatesList } from '../hooks/useTemplatesApi';
import { resolveTenantId } from '../lib/resolveTenantId';

function injectTemplateVariables(
  text: string | null | undefined,
  vars: {
    candidate_name: string;
    job_title: string;
    company_name: string;
    current_user_name: string;
  }
) {
  const raw = String(text || '');
  if (!raw) return '';
  return raw.replace(/\{\{\s*(candidate_name|job_title|company_name|current_user_name)\s*\}\}/g, (_m, key) => {
    const k = String(key || '').trim() as keyof typeof vars;
    return vars[k] ?? '';
  });
}

function toHtmlFromPlainText(input: string) {
  const escaped = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return escaped.replace(/\n/g, '<br/>');
}

function normalizePhoneForSend(raw: string) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export default function PipelinePage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobIdParam = searchParams.get('jobId');
  const applicationIdParam = searchParams.get('applicationId');

  const { isAuthenticated, isLoading: authLoading, logout, user, org } = useAuth();
  const pipelineTenantId = useMemo(() => resolveTenantId(org), [org]);
  const shouldFetch = isAuthenticated && !authLoading;
  const handleUnauthorized = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useJobs(shouldFetch);
  const [selectedJobId, setSelectedJobId] = useState<string>(() => {
    return jobIdParam || localStorage.getItem('nhPipelineJobId') || '';
  });

  // If URL jobId changes (back/forward navigation), sync state.
  useEffect(() => {
    if (jobIdParam !== null && jobIdParam !== selectedJobId) {
      setSelectedJobId(jobIdParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobIdParam]);

  // Persist selection across navigation (e.g., switching sections/tabs).
  useEffect(() => {
    if (selectedJobId) localStorage.setItem('nhPipelineJobId', selectedJobId);
  }, [selectedJobId]);

  const selectedJob: Job | null = useMemo(() => {
    if (!selectedJobId) return null;
    return (jobs || []).find((j) => String(j.id) === String(selectedJobId)) || null;
  }, [jobs, selectedJobId]);

  useEffect(() => {
    // Keep URL in sync
    const next = new URLSearchParams(searchParams.toString());
    if (selectedJobId) next.set('jobId', selectedJobId);
    else next.delete('jobId');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId]);

  const { data, columns, isLoading, error: kanbanError, moveOptimistic, updateStatusOptimistic, insertIntoFirstStage, refetch } = useKanban(
    shouldFetch,
    selectedJobId || null
  );

  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(applicationIdParam || null);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState(false);
  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(true);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [addNoteForId, setAddNoteForId] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [isSendMessageOpen, setIsSendMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageChannel, setMessageChannel] = useState<TemplateChannel>('email');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [sendMessageForId, setSendMessageForId] = useState<string | null>(null);
  const [messageBodyTouched, setMessageBodyTouched] = useState(false);
  const [messageSubjectTouched, setMessageSubjectTouched] = useState(false);
  const [messageSubmitting, setMessageSubmitting] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('');
  const [recipientEmailLoading, setRecipientEmailLoading] = useState(false);

  const { data: templates, isLoading: templatesLoading } = useTemplatesList(isSendMessageOpen, messageChannel);
  const {
    data: selectedTemplate,
    isLoading: selectedTemplateLoading,
    error: selectedTemplateError,
  } = useTemplate(isSendMessageOpen, selectedTemplateId || null);

  const sendMessageCard: KanbanApplicationCard | null = useMemo(() => {
    if (!sendMessageForId) return null;
    for (const c of columns) {
      const found = c.items.find((i) => i.id === sendMessageForId);
      if (found) return found;
    }
    return null;
  }, [columns, sendMessageForId]);

  const messageVars = useMemo(() => {
    const candidate_name = String(sendMessageCard?.candidateName || '').trim();
    const job_title = String(sendMessageCard?.jobTitle || '').trim();
    const company_name = String(org?.name || '').trim();
    const current_user_name = String(user?.name || user?.email || '').trim();
    return { candidate_name, job_title, company_name, current_user_name };
  }, [org?.name, sendMessageCard?.candidateName, sendMessageCard?.jobTitle, user?.email, user?.name]);

  useEffect(() => {
    if (!kanbanError) return;
    if (kanbanError.status === 401) {
      handleUnauthorized();
      return;
    }
    setToastError(kanbanError.message || t('pipeline.errors.load'));
  }, [kanbanError, handleUnauthorized, t]);

  // Sync applicationId param -> selection when URL changes
  useEffect(() => {
    setSelectedApplicationId(applicationIdParam || null);
    // If inspector is opened via URL (not via click), ensure it starts expanded.
    if (applicationIdParam) setIsInspectorCollapsed(false);
  }, [applicationIdParam]);

  // If inspector is closed (no selection), reset collapsed state for next open.
  useEffect(() => {
    if (!selectedApplicationId) setIsInspectorCollapsed(false);
  }, [selectedApplicationId]);

  // Auto open inspector if applicationId present after data loads
  useEffect(() => {
    if (!applicationIdParam) return;
    if (!columns.length) return;
    const exists = columns.some((c) => c.items.some((i) => i.id === applicationIdParam));
    if (exists) setSelectedApplicationId(applicationIdParam);
  }, [applicationIdParam, columns]);

  const jobOptions = useMemo(() => {
    const opts = [{ value: '', label: t('pipeline.selectJob') }];
    for (const j of jobs || []) opts.push({ value: String(j.id), label: j.title });
    return opts;
  }, [jobs, t]);

  const handleMove = async (applicationId: string, toStageId: string) => {
    try {
      await moveOptimistic(applicationId, toStageId);
      if (selectedApplicationId && selectedApplicationId === applicationId) {
        setHistoryRefreshKey((k) => k + 1);
      }
    } catch (e) {
      if (isUnauthorized(e)) {
        handleUnauthorized();
        return;
      }
      setToastError(t('pipeline.errors.move'));
    }
  };

  const openAddNote = (applicationId: string) => {
    setAddNoteForId(applicationId);
    setNoteBody('');
    setNoteError(null);
    setIsAddNoteOpen(true);
  };

  const openSendMessageFor = (applicationId: string) => {
    setSendMessageForId(applicationId);
    setMessageBody('');
    setMessageSubject('');
    setMessageChannel('email');
    setSelectedTemplateId('');
    setMessageBodyTouched(false);
    setMessageSubjectTouched(false);
    setMessageError(null);
    setRecipientEmail('');
    setRecipientPhone('');
    setRecipientEmailLoading(false);
    setIsSendMessageOpen(true);
  };

  useEffect(() => {
    if (!isSendMessageOpen) return;
    const direct = String(sendMessageCard?.candidateEmail || '').trim();
    const directPhone = String(sendMessageCard?.candidatePhone || '').trim();
    if (direct) {
      setRecipientEmail(direct);
      setRecipientPhone(directPhone);
      setRecipientEmailLoading(false);
      return;
    }
    const candidateId = String(sendMessageCard?.candidateId || '').trim();
    if (!candidateId) {
      setRecipientEmail('');
      setRecipientEmailLoading(false);
      return;
    }
    let cancelled = false;
    setRecipientEmailLoading(true);
    candidatesApi
      .getById(candidateId)
      .then((candidate) => {
        if (cancelled) return;
        setRecipientEmail(String(candidate?.email || '').trim());
        setRecipientPhone(String(candidate?.phone || '').trim());
      })
      .catch(() => {
        if (cancelled) return;
        setRecipientEmail('');
        setRecipientPhone('');
      })
      .finally(() => {
        if (!cancelled) setRecipientEmailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isSendMessageOpen, sendMessageCard?.candidateEmail, sendMessageCard?.candidateId, sendMessageCard?.candidatePhone]);

  const handleSendMessage = async () => {
    setMessageError(null);
    if (messageChannel === 'whatsapp') {
      const candidateId = String(sendMessageCard?.candidateId || '').trim();
      const tenantId = pipelineTenantId.trim();
      const toPhone = normalizePhoneForSend(String(recipientPhone || sendMessageCard?.candidatePhone || ''));
      if (!toPhone) {
        setMessageError(t('pipeline.message.missingRecipientPhone'));
        return;
      }
      if (!candidateId || !tenantId) {
        setMessageError(t('pipeline.message.whatsappSendFailed'));
        return;
      }
      const plainText = String(messageBody || '').trim();
      if (!plainText) {
        setMessageError(t('pipeline.message.bodyRequired'));
        return;
      }
      setMessageSubmitting(true);
      try {
        await whatsappApi.sendDirect({
          tenantId,
          candidateId,
          to: toPhone,
          body: plainText,
        });
        setToastError(null);
        setToastSuccess(t('pipeline.message.whatsappSent'));
        setIsSendMessageOpen(false);
        setSendMessageForId(null);
        setMessageBody('');
        setHistoryRefreshKey((k) => k + 1);
      } catch (e) {
        if (isUnauthorized(e)) {
          handleUnauthorized();
          return;
        }
        setToastError(t('pipeline.message.whatsappSendFailed'));
      } finally {
        setMessageSubmitting(false);
      }
      return;
    }
    const toEmail = String(recipientEmail || sendMessageCard?.candidateEmail || '').trim();
    if (!toEmail) {
      setMessageError(t('pipeline.message.missingRecipientEmail'));
      return;
    }
    const subject = String(messageSubject || '').trim();
    if (!subject) {
      setMessageError(t('pipeline.message.subjectRequired'));
      return;
    }
    const plainText = String(messageBody || '').trim();
    if (!plainText) {
      setMessageError(t('pipeline.message.bodyRequired'));
      return;
    }
    setMessageSubmitting(true);
    try {
      await emailApi.send({
        toEmail,
        subject,
        plainText,
        html: toHtmlFromPlainText(plainText),
      });
      setToastError(null);
      setToastSuccess(t('pipeline.message.emailSent'));
      setIsSendMessageOpen(false);
      setSendMessageForId(null);
      setMessageBody('');
    } catch (e) {
      if (isUnauthorized(e)) {
        handleUnauthorized();
        return;
      }
      setMessageError((e as any)?.message || t('pipeline.message.sendFailed'));
    } finally {
      setMessageSubmitting(false);
    }
  };

  // When channel changes, reset selection and draft fields
  useEffect(() => {
    if (!isSendMessageOpen) return;
    setSelectedTemplateId('');
    setMessageSubject('');
    setMessageBody('');
    setMessageBodyTouched(false);
    setMessageSubjectTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageChannel, isSendMessageOpen]);

  useEffect(() => {
    if (!isSendMessageOpen) return;
    // Switching templates should re-apply defaults (allow overwriting)
    setMessageBodyTouched(false);
    setMessageSubjectTouched(false);
  }, [isSendMessageOpen, selectedTemplateId]);

  useEffect(() => {
    if (!isSendMessageOpen) return;
    // When templates load for a channel, pick first by default (if none selected)
    if (templatesLoading) return;
    if (selectedTemplateId && templates.some((t) => t.id === selectedTemplateId)) return;
    if (templates.length) setSelectedTemplateId(templates[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSendMessageOpen, templatesLoading, templates.length, messageChannel]);

  useEffect(() => {
    if (!isSendMessageOpen) return;
    if (!selectedTemplateId) {
      setMessageSubject('');
      setMessageBody('');
      return;
    }
    if (!selectedTemplate) return;
    if (!messageBodyTouched) {
      setMessageBody(injectTemplateVariables(selectedTemplate.body || '', messageVars));
    }
    // Subject only for email templates (part of template)
    if (messageChannel === 'email') {
      if (!messageSubjectTouched) {
        setMessageSubject(injectTemplateVariables(selectedTemplate.subject || '', messageVars));
      }
    } else {
      setMessageSubject('');
    }
  }, [
    isSendMessageOpen,
    selectedTemplateId,
    selectedTemplate,
    messageChannel,
    messageVars,
    messageBodyTouched,
    messageSubjectTouched,
  ]);

  const handleCreateNote = async () => {
    if (!addNoteForId) return;
    setNoteError(null);
    const body = String(noteBody || '').trim();
    if (!body) {
      setNoteError(t('pipeline.inspector.addNote.validation'));
      return;
    }
    setNoteSubmitting(true);
    try {
      await applicationsApi.createNote(addNoteForId, body);
      setIsAddNoteOpen(false);
      setNoteBody('');
      setHistoryRefreshKey((k) => k + 1);
    } catch (e) {
      if (isUnauthorized(e)) {
        handleUnauthorized();
        return;
      }
      setNoteError((e as any)?.message || t('pipeline.errors.load'));
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    const terminal = status === 'rejected' || status === 'archived';
    try {
      await updateStatusOptimistic(applicationId, status, terminal);
      if (terminal) closeInspector();
      setTimeout(() => refetch(), 300);
    } catch (e) {
      if (isUnauthorized(e)) {
        handleUnauthorized();
        return;
      }
      setToastError(t('pipeline.errors.updateStatus'));
    }
  };

  // Auto-clear toast error after a moment (soft-toast behavior)
  useEffect(() => {
    if (!toastError) return;
    const h = window.setTimeout(() => setToastError(null), 3000);
    return () => window.clearTimeout(h);
  }, [toastError]);

  useEffect(() => {
    if (!toastSuccess) return;
    const h = window.setTimeout(() => setToastSuccess(null), 3000);
    return () => window.clearTimeout(h);
  }, [toastSuccess]);

  const whatsappPhoneForSend = useMemo(
    () => normalizePhoneForSend(String(recipientPhone || sendMessageCard?.candidatePhone || '')),
    [recipientPhone, sendMessageCard?.candidatePhone]
  );
  const canSendEmail = messageChannel === 'email' && !messageSubmitting;
  const canSendWhatsApp = messageChannel === 'whatsapp' && !messageSubmitting && !!whatsappPhoneForSend && !!String(messageBody || '').trim();
  const canSendMessage = canSendEmail || canSendWhatsApp;

  const isEmpty = !isLoading && selectedJobId && columns.every((c) => c.items.length === 0);

  const inspectorOpen = !!selectedApplicationId;
  const layoutCollapsed = inspectorOpen && isInspectorCollapsed;

  const selectedCard: KanbanApplicationCard | null = useMemo(() => {
    if (!selectedApplicationId) return null;
    for (const c of columns) {
      const found = c.items.find((i) => i.id === selectedApplicationId);
      if (found) return found;
    }
    return null;
  }, [columns, selectedApplicationId]);

  const openInspectorFor = (applicationId: string) => {
    setInspectorLoading(true);
    setIsInspectorCollapsed(false);
    setSelectedApplicationId(applicationId);
    // Set explicitly to avoid stale params re-appearing
    const next: Record<string, string> = {};
    if (selectedJobId) next.jobId = String(selectedJobId);
    next.applicationId = String(applicationId);
    setSearchParams(next, { replace: true });
    window.setTimeout(() => setInspectorLoading(false), 250);
  };

  const closeInspector = () => {
    setSelectedApplicationId(null);
    setIsInspectorCollapsed(false);
    // Force-remove applicationId from URL (avoid "sticky" collapsed rail)
    const next: Record<string, string> = {};
    if (selectedJobId) next.jobId = String(selectedJobId);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <TopBar />

      <div className="p-8">
        {/* Header v2 */}
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-dark-text">{t('pipeline.title')}</h1>
            <div className="mt-3 w-full max-w-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('pipeline.selectJob')}</label>
              <select
                className="w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                disabled={jobsLoading}
              >
                {jobOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {jobsError ? (
                <div className="mt-2">
                  <ErrorMessage message={jobsError.message || 'Failed to load jobs'} />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" onClick={() => setIsCreateOpen(true)} disabled={!selectedJob}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{t('pipeline.addApplication')}</span>
              </div>
            </Button>
          </div>
        </div>

        {toastError ? (
          <div className="mb-6">
            <ErrorMessage message={toastError} />
          </div>
        ) : null}
        {toastSuccess ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{toastSuccess}</div>
        ) : null}

        {/* Overview panel (collapsible) */}
        {selectedJobId && data?.stages?.length ? (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary/70" />
                <p className="text-sm font-semibold text-dark-text">{t('pipeline.overview')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOverviewCollapsed((v) => !v)}
                className="p-2 rounded-lg hover:bg-white/70 text-gray-600 transition-colors"
                aria-label={isOverviewCollapsed ? 'Expand overview' : 'Collapse overview'}
              >
                <svg
                  className={`w-5 h-5 transition-transform ${isOverviewCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="px-5 pb-5">
              {!isOverviewCollapsed ? <PipelineSummaryTiles stages={data.stages} columns={columns} /> : null}
            </div>
          </div>
        ) : null}

        {/* Main area: board + inspector */}
        <div
          className={`grid grid-cols-1 gap-6 lg:items-stretch ${
            inspectorOpen ? (layoutCollapsed ? 'lg:grid-cols-[1fr_96px]' : 'lg:grid-cols-[1fr_420px]') : 'lg:grid-cols-1'
          }`}
        >
          <Card className="p-0 overflow-hidden lg:h-[calc(100vh-140px)]">
            {!selectedJobId ? (
              <div className="p-10 text-center text-sm text-gray-600">{t('pipeline.selectJob')}</div>
            ) : isLoading ? (
              <div className="p-6">
                <div className="flex gap-6 overflow-x-auto">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-[320px] shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 min-h-[560px]">
                      <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse mb-4" />
                      <div className="space-y-3">
                        {[1, 2, 3].map((j) => (
                          <div key={j} className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isEmpty ? (
              <div className="p-12 text-center">
                <h3 className="text-xl font-semibold text-dark-text mb-2">{t('pipeline.empty.title')}</h3>
                <p className="text-sm text-gray-600 mb-6">{t('pipeline.empty.subtitle')}</p>
                <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
                  {t('pipeline.addApplication')}
                </Button>
              </div>
            ) : (
              <PipelineBoard
                columns={columns}
                locale={locale}
                selectedApplicationId={selectedApplicationId}
                onSelectCard={openInspectorFor}
                onMove={handleMove}
                onCardAddNote={(id) => openAddNote(id)}
                onCardSendMessage={(id) => openSendMessageFor(id)}
              />
            )}
          </Card>

          {/* Inspector (only mount when open to avoid reserving width) */}
          {inspectorOpen ? (
            <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-140px)] overflow-hidden">
              <ApplicationInspectorPanel
                isOpen={inspectorOpen}
                isLoading={inspectorLoading}
                collapsed={layoutCollapsed}
                application={selectedCard}
                tenantId={pipelineTenantId}
                stages={data?.stages || []}
                locale={locale}
                historyRefreshKey={historyRefreshKey}
                onClose={closeInspector}
                onToggleCollapsed={() => setIsInspectorCollapsed((v) => !v)}
                onReject={() => {
                  if (!selectedCard?.id) return Promise.resolve();
                  const raw = String(selectedCard.status || '').toLowerCase();
                  const isRejected = raw.includes('reject');
                  return handleUpdateApplicationStatus(selectedCard.id, isRejected ? 'active' : 'rejected');
                }}
                onArchive={() => {
                  if (!selectedCard?.id) return Promise.resolve();
                  return handleUpdateApplicationStatus(selectedCard.id, 'archived');
                }}
                onUnauthorized={handleUnauthorized}
              />
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        isOpen={isAddNoteOpen}
        onClose={() => {
          setIsAddNoteOpen(false);
          setNoteError(null);
        }}
        title={t('pipeline.inspector.addNote.title')}
        subtitle={t('pipeline.inspector.addNote.subtitle')}
        width="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddNoteOpen(false)} disabled={noteSubmitting}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="primary" onClick={handleCreateNote} disabled={noteSubmitting}>
              {noteSubmitting ? t('common.actions.saving') : t('pipeline.inspector.addNote.save')}
            </Button>
          </>
        }
      >
        {noteError ? <ErrorMessage message={noteError} /> : null}
        <TextareaField
          label={t('pipeline.inspector.addNote.body')}
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          placeholder={t('pipeline.inspector.addNote.placeholder')}
        />
      </Modal>

      <Modal
        isOpen={isSendMessageOpen}
        onClose={() => {
          setIsSendMessageOpen(false);
          setSendMessageForId(null);
          setMessageError(null);
        }}
        title={t('pipeline.message.title')}
        subtitle={t('pipeline.message.subtitle')}
        width="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsSendMessageOpen(false);
                setMessageError(null);
              }}
              disabled={messageSubmitting}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!canSendMessage}
            >
              {messageSubmitting ? t('pipeline.message.sending') : t('pipeline.message.send')}
            </Button>
          </>
        }
      >
        {messageError ? <ErrorMessage message={messageError} /> : null}
        {sendMessageForId ? (
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-4">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{t('pipeline.message.context')}</p>
            <div className="mt-2 text-sm text-gray-800">
              <span className="font-semibold">{sendMessageCard?.candidateName || '—'}</span>
              {sendMessageCard?.jobTitle ? <span className="text-gray-500"> • {sendMessageCard.jobTitle}</span> : null}
              {recipientEmailLoading ? <div className="text-xs text-gray-500 mt-0.5">{t('common.loading')}</div> : null}
              {!recipientEmailLoading && messageChannel === 'email' && recipientEmail ? (
                <div className="text-xs text-gray-500 mt-0.5">{recipientEmail}</div>
              ) : null}
              {!recipientEmailLoading && messageChannel === 'whatsapp' && recipientPhone ? (
                <div className="text-xs text-gray-500 mt-0.5">{recipientPhone}</div>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('pipeline.message.template')}</label>
            <select
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={templatesLoading}
            >
              {!templatesLoading && templates.length === 0 ? (
                <option value="">{t('pipeline.message.noTemplates')}</option>
              ) : (
                templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))
              )}
            </select>
            {selectedTemplateLoading ? (
              <div className="mt-2 text-xs text-gray-500">{t('common.loading')}</div>
            ) : selectedTemplateError ? (
              <div className="mt-2 text-xs text-red-600">{t('pipeline.message.templateLoadFailed')}</div>
            ) : null}
          </div>

          <div className="shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('pipeline.message.channel')}</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setMessageChannel('email')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  messageChannel === 'email' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setMessageChannel('whatsapp')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  messageChannel === 'whatsapp' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {messageChannel === 'email' ? (
          <div className="mb-5">
            <TextField
              label={t('pipeline.message.subject')}
              value={messageSubject}
              onFocus={() => setMessageSubjectTouched(true)}
              onChange={(e) => {
                setMessageSubjectTouched(true);
                setMessageSubject(e.target.value);
              }}
            />
          </div>
        ) : null}

        <TextareaField
          label={t('pipeline.message.body')}
          value={messageBody}
          onFocus={() => setMessageBodyTouched(true)}
          onChange={(e) => {
            setMessageBodyTouched(true);
            setMessageBody(e.target.value);
          }}
          placeholder={t('pipeline.message.placeholder')}
        />
      </Modal>

      <CreateApplicationModal
        isOpen={isCreateOpen}
        jobs={jobs || []}
        job={selectedJob}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(card) => {
          const createdJobId = String(card.jobId || '');
          if (createdJobId && createdJobId !== String(selectedJobId)) {
            // User created application for a different job → jump to that pipeline.
            setSelectedJobId(createdJobId);
            setTimeout(() => refetch(), 300);
            return;
          }

          // Insert into the first column without refetching.
          insertIntoFirstStage({
            ...card,
            jobTitle: card.jobTitle || selectedJob?.title || '',
            stageId: card.stageId || columns[0]?.stageId || '',
            createdAt: card.createdAt || new Date().toISOString(),
          });
          setTimeout(() => refetch(), 300);
        }}
      />
    </div>
  );
}


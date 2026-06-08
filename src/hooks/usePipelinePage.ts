import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Job } from '../types/dashboard';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../hooks/useJobs';
import { useKanban } from '../hooks/useKanban';
import { applicationsApi, isUnauthorized } from '../api/applicationsApi';
import { emailApi } from '../api/emailApi';
import { whatsappApi } from '../api/whatsappApi';
import { candidatesApi } from '../api/candidatesApi';
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

export function usePipelinePage() {
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

  // Default to first job when none selected or previous selection is invalid.
  useEffect(() => {
    if (jobsLoading || !jobs?.length) return;

    const validIds = new Set(jobs.map((j) => String(j.id)));

    if (jobIdParam && validIds.has(jobIdParam)) {
      if (selectedJobId !== jobIdParam) setSelectedJobId(jobIdParam);
      return;
    }

    if (selectedJobId && validIds.has(selectedJobId)) return;

    setSelectedJobId(String(jobs[0].id));
  }, [jobs, jobsLoading, jobIdParam, selectedJobId]);

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
    const list = jobs || [];
    if (!list.length) return [{ value: '', label: t('pipeline.selectJob') }];
    return list.map((j) => ({ value: String(j.id), label: j.title }));
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

  return {
    t,
    locale,
    jobs,
    jobsLoading,
    jobsError,
    selectedJobId,
    setSelectedJobId,
    selectedJob,
    jobOptions,
    data,
    columns,
    isLoading,
    kanbanError,
    refetch,
    insertIntoFirstStage,
    toastError,
    toastSuccess,
    isCreateOpen,
    setIsCreateOpen,
    selectedApplicationId,
    inspectorLoading,
    isInspectorCollapsed,
    setIsInspectorCollapsed,
    isOverviewCollapsed,
    setIsOverviewCollapsed,
    historyRefreshKey,
    isAddNoteOpen,
    setIsAddNoteOpen,
    noteBody,
    setNoteBody,
    noteSubmitting,
    noteError,
    setNoteError,
    handleCreateNote,
    isSendMessageOpen,
    setIsSendMessageOpen,
    messageBody,
    setMessageBody,
    messageSubject,
    setMessageSubject,
    messageChannel,
    setMessageChannel,
    selectedTemplateId,
    setSelectedTemplateId,
    sendMessageForId,
    setSendMessageForId,
    setMessageBodyTouched,
    setMessageSubjectTouched,
    messageSubmitting,
    messageError,
    setMessageError,
    recipientEmail,
    recipientPhone,
    recipientEmailLoading,
    templates,
    templatesLoading,
    selectedTemplateLoading,
    selectedTemplateError,
    sendMessageCard,
    handleSendMessage,
    canSendMessage,
    isEmpty,
    inspectorOpen,
    layoutCollapsed,
    selectedCard,
    openInspectorFor,
    closeInspector,
    handleMove,
    handleUpdateApplicationStatus,
    openAddNote,
    openSendMessageFor,
    pipelineTenantId,
    handleUnauthorized,
  };
}

export type PipelinePageState = ReturnType<typeof usePipelinePage>;


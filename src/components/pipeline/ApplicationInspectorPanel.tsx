import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import type { ApplicationNote, ApplicationStageHistoryItem, KanbanApplicationCard, KanbanStage } from '../../types/applications';
import userPlaceholder from '../../assets/user_placeholder.svg';
import { applicationsApi, isUnauthorized } from '../../api/applicationsApi';
import TaskStatusPill from '../tasks/TaskStatusPill';
import type { Task } from '../../types/task';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import Modal from '../Modal';
import { candidatesApi } from '../../api/candidatesApi';
import { whatsappApi, type WhatsappConversationDto, type WhatsappMessageDto } from '../../api/whatsappApi';
import { useBackdropDismiss } from '../../hooks/useBackdropDismiss';

type TabKey = 'history' | 'notes' | 'tasks';
type PanelTabKey = 'activity' | 'whatsapp';

function formatDateTime(dateString: string | null | undefined, locale: string) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleString(locale || 'en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateString);
  }
}

function formatMessageTime(iso: string | null | undefined, locale: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString(locale || 'en', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function normalizePhoneForWa(raw: string) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

function Chip({
  label,
  tone,
  className = '',
}: {
  label: string;
  tone: 'neutral' | 'good' | 'warn' | 'bad';
  className?: string;
}) {
  const base =
    tone === 'good'
      ? 'bg-green-100 text-green-700'
      : tone === 'warn'
      ? 'bg-amber-100 text-amber-700'
      : tone === 'bad'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${base} ${className}`}>
      {label}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 animate-pulse" />
        </div>
      </div>
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
      <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
    </div>
  );
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export interface ApplicationInspectorPanelProps {
  isOpen: boolean;
  application: KanbanApplicationCard | null;
  /** Tenant id for WhatsApp APIs (resolved in Pipeline from org / storage / JWT). */
  tenantId?: string;
  stages: KanbanStage[];
  locale: string;
  historyRefreshKey?: number;
  isLoading?: boolean;
  collapsed?: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
  onReject?: () => Promise<void> | void;
  onArchive?: () => Promise<void> | void;
  onUnauthorized?: () => void;
}

export default function ApplicationInspectorPanel(props: ApplicationInspectorPanelProps) {
  const {
    isOpen,
    application,
    tenantId = '',
    stages,
    locale,
    historyRefreshKey = 0,
    isLoading = false,
    collapsed = false,
    onClose,
    onToggleCollapsed,
    onReject,
    onArchive,
    onUnauthorized,
  } = props;
  const { t } = useTranslation();
  const backdropDismiss = useBackdropDismiss(onClose);
  // Default to Notes to avoid extra calls on open
  const [tab, setTab] = useState<TabKey>('notes');
  const [panelTab, setPanelTab] = useState<PanelTabKey>('activity');
  const [waConversation, setWaConversation] = useState<WhatsappConversationDto | null>(null);
  const [waMessages, setWaMessages] = useState<WhatsappMessageDto[]>([]);
  const [waLoading, setWaLoading] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);
  const waScrollRef = useRef<HTMLDivElement>(null);
  const [waComposeBody, setWaComposeBody] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waPhoneHydrated, setWaPhoneHydrated] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<'reject' | 'archive' | null>(null);
  // Notes creation is handled by PipelinePage (keeps modal above all overlays)

  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  useEffect(() => {
    if (!toastError) return;
    const h = window.setTimeout(() => setToastError(null), 3200);
    return () => window.clearTimeout(h);
  }, [toastError]);
  useEffect(() => {
    if (!toastSuccess) return;
    const h = window.setTimeout(() => setToastSuccess(null), 2400);
    return () => window.clearTimeout(h);
  }, [toastSuccess]);

  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    cached: boolean;
    analysis: {
      summary?: string | null;
      language?: string | null;
      docType?: string | null;
      keyPoints?: string[];
      warnings?: string[];
      extractedTextChars?: number | null;
      createdAtUtc?: string | null;
    } | null;
  } | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [resumeModalLoading, setResumeModalLoading] = useState(false);
  const [resumeModalError, setResumeModalError] = useState<string | null>(null);
  const [resumeModalUrl, setResumeModalUrl] = useState<string | null>(null);
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<ApplicationStageHistoryItem[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    // When switching to a different application, default to Notes
    if (!isOpen) return;
    if (!application?.id) return;
    setTab('notes');
    setPanelTab('activity');
    setAiResult(null);
    setAnalysisError(null);
    setAnalysisLoading(false);
    setWaConversation(null);
    setWaMessages([]);
    setWaError(null);
    setWaComposeBody('');
    setWaPhoneHydrated(null);
  }, [application?.id, isOpen]);

  const loadAnalysis = async (candidateId: string) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await candidatesApi.resumeAnalysis(candidateId);
      setAiResult(res);
      if (!res?.analysis) {
        setAnalysisError(t('pipeline.inspector.resume.analysis.empty'));
      }
    } catch (e) {
      if (isUnauthorized(e)) {
        onUnauthorized?.();
        return;
      }
      setAnalysisError(t('pipeline.inspector.resume.failed'));
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Prefetch resume URL to know if we can enable actions.
  useEffect(() => {
    if (!isOpen || collapsed) return;
    if (!application?.candidateId) {
      setResumeUrl(null);
      setIsLoadingResume(false);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setIsLoadingResume(true);
      setResumeUrl(null);
      try {
        const url = await candidatesApi.resumeDownloadUrl(application.candidateId);
        if (cancelled) return;
        setResumeUrl(url);
      } catch (e) {
        if (cancelled) return;
        if (isUnauthorized(e)) {
          onUnauthorized?.();
          return;
        }
        setResumeUrl(null);
      } finally {
        if (!cancelled) setIsLoadingResume(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [application?.candidateId, collapsed, isOpen, onUnauthorized]);

  const viewerUrl = useMemo(() => {
    const url = String(resumeModalUrl || '').trim();
    if (!url) return '';
    const lower = url.toLowerCase();
    const isDoc = lower.includes('.docx') || lower.includes('.doc');
    if (isDoc) {
      // Best-effort doc/docx preview
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }
    return url;
  }, [resumeModalUrl]);

  useEffect(() => {
    if (!isResumeModalOpen) return;
    if (!viewerUrl) return;
    // Show loader until iframe fires onLoad
    setResumePreviewLoading(true);
  }, [isResumeModalOpen, viewerUrl]);

  const stageName = useMemo(() => {
    if (!application) return '';
    return stages.find((s) => s.id === application.stageId)?.name || '';
  }, [application, stages]);

  const waTargetPhoneRaw = useMemo(
    () =>
      String(waConversation?.phoneNumber || application?.candidatePhone || waPhoneHydrated || '').trim(),
    [application?.candidatePhone, waConversation?.phoneNumber, waPhoneHydrated]
  );

  const appStatus = useMemo(() => {
    const raw = String(application?.status || 'active').trim().toLowerCase();
    if (!raw) return 'active';
    if (raw.includes('reject')) return 'rejected';
    if (raw.includes('archiv')) return 'archived';
    return raw;
  }, [application?.status]);

  const statusChip = useMemo(() => {
    if (appStatus === 'rejected') {
      return {
        label: t('pipeline.status.rejected'),
        tone: 'bad' as const,
        className: '',
      };
    }
    if (appStatus === 'archived') {
      return {
        label: t('pipeline.status.archived'),
        tone: 'neutral' as const,
        className: '',
      };
    }
    return {
      label: t('pipeline.status.active'),
      tone: 'good' as const,
      className: '',
    };
  }, [appStatus, t]);

  const handleViewResume = async () => {
    if (!application?.candidateId) return;
    if (resumeModalLoading) return;
    setToastError(null);
    try {
      setIsResumeModalOpen(true);
      setResumeModalLoading(true);
      setResumeModalError(null);
      const url = resumeUrl || (await candidatesApi.resumeDownloadUrl(application.candidateId));
      setResumeUrl(url);
      setResumeModalUrl(url);
      if (!url) {
        setResumeModalError(t('pipeline.inspector.resume.noResume'));
        return;
      }
      setToastSuccess(t('pipeline.inspector.resume.opened'));
    } catch (e) {
      if (isUnauthorized(e)) {
        onUnauthorized?.();
        return;
      }
      setResumeModalError(t('pipeline.inspector.resume.failed'));
      setToastError(t('pipeline.inspector.resume.failed'));
    } finally {
      setResumeModalLoading(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!application?.candidateId) return;
    if (isAnalyzingAI) return;
    if (!resumeUrl) return;
    setToastError(null);
    try {
      setIsAnalyzingAI(true);
      setIsAnalysisModalOpen(true);
      await loadAnalysis(application.candidateId);
      // If analysis exists, treat as completed.
      setToastSuccess(t('pipeline.inspector.resume.analyzed'));
    } catch (e) {
      if (isUnauthorized(e)) {
        onUnauthorized?.();
        return;
      }
      setToastError(t('pipeline.inspector.resume.failed'));
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  useEffect(() => {
    if (!isOpen || collapsed) return;
    if (tab !== 'history') return;
    if (!application?.id) {
      setHistoryItems([]);
      setHistoryLoading(false);
      setHistoryError(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        // Small delay so that a just-moved card can get its history persisted
        // before we fetch (move is optimistic in the board).
        await new Promise((r) => window.setTimeout(r, 250));
        const items = await applicationsApi.stageHistory(application.id, 50);
        if (cancelled) return;
        setHistoryItems(items);
      } catch (e) {
        if (cancelled) return;
        if (isUnauthorized(e)) {
          onUnauthorized?.();
          return;
        }
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('pipeline.errors.load');
        setHistoryError(msg);
        setHistoryItems([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [application?.id, application?.stageId, historyRefreshKey, collapsed, isOpen, onUnauthorized, t, tab]);

  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesItems, setNotesItems] = useState<ApplicationNote[]>([]);
  const [noteDeleteId, setNoteDeleteId] = useState<string | null>(null);
  const [noteDeleteError, setNoteDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || collapsed) return;
    if (tab !== 'notes') return;
    if (!application?.id) {
      setNotesItems([]);
      setNotesLoading(false);
      setNotesError(null);
      setNoteDeleteId(null);
      setNoteDeleteError(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setNotesLoading(true);
      setNotesError(null);
      setNoteDeleteError(null);
      try {
        const items = await applicationsApi.notes(application.id, 100);
        if (cancelled) return;
        // newest first
        const sorted = [...items].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        setNotesItems(sorted);
      } catch (e) {
        if (cancelled) return;
        if (isUnauthorized(e)) {
          onUnauthorized?.();
          return;
        }
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('pipeline.errors.load');
        setNotesError(msg);
        setNotesItems([]);
      } finally {
        if (!cancelled) setNotesLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [application?.id, collapsed, isOpen, historyRefreshKey, onUnauthorized, t, tab]);

  const handleDeleteNote = async (noteId: string) => {
    const ok = window.confirm(t('pipeline.inspector.notes.deleteConfirm'));
    if (!ok) return;
    setNoteDeleteError(null);
    setNoteDeleteId(noteId);
    try {
      await applicationsApi.deleteNote(noteId);
      setNotesItems((prev) => prev.filter((n) => n.id !== noteId));
    } catch (e) {
      if (isUnauthorized(e)) {
        onUnauthorized?.();
        return;
      }
      setNoteDeleteError(e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('pipeline.errors.load'));
    } finally {
      setNoteDeleteId(null);
    }
  };

  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [tasksItems, setTasksItems] = useState<Task[]>([]);

  useEffect(() => {
    if (!isOpen || collapsed) return;
    if (tab !== 'tasks') return;
    if (!application?.id) {
      setTasksItems([]);
      setTasksLoading(false);
      setTasksError(null);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setTasksLoading(true);
      setTasksError(null);
      try {
        const items = await applicationsApi.tasks(application.id);
        if (cancelled) return;
        setTasksItems(items);
      } catch (e) {
        if (cancelled) return;
        if (isUnauthorized(e)) {
          onUnauthorized?.();
          return;
        }
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('pipeline.errors.load');
        setTasksError(msg);
        setTasksItems([]);
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [application?.id, collapsed, isOpen, historyRefreshKey, onUnauthorized, t, tab]);

  const loadWhatsappConversation = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      const candidateId = String(application?.candidateId || '').trim();
      const tid = String(tenantId || '').trim();

      if (!candidateId) {
        if (!silent) {
          setWaConversation(null);
          setWaMessages([]);
          setWaLoading(false);
          setWaError(null);
        }
        return;
      }
      if (!tid) {
        if (!silent) {
          setWaConversation(null);
          setWaMessages([]);
          setWaLoading(false);
          setWaError(t('pipeline.inspector.whatsapp.missingTenant'));
        }
        return;
      }

      if (!silent) {
        setWaLoading(true);
        setWaError(null);
      }

      try {
        const data = await whatsappApi.getConversationByCandidate(tid, candidateId);
        setWaConversation(data.conversation);
        const sorted = [...(data.messages || [])].sort(
          (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime()
        );
        setWaMessages((prev) => {
          if (sorted.length === 0 && prev.length > 0) return prev;
          return sorted;
        });
      } catch (e) {
        if (isUnauthorized(e)) {
          onUnauthorized?.();
          return;
        }
        if (!silent) {
          const msg =
            e && typeof e === 'object' && 'message' in e
              ? String((e as any).message)
              : t('pipeline.inspector.whatsapp.loadError');
          setWaError(msg);
          setWaConversation(null);
          setWaMessages([]);
        }
      } finally {
        if (!silent) setWaLoading(false);
      }
    },
    [application?.candidateId, onUnauthorized, t, tenantId]
  );

  useEffect(() => {
    if (!isOpen || collapsed || panelTab !== 'whatsapp') return;

    void loadWhatsappConversation();

    const intervalId = window.setInterval(() => {
      void loadWhatsappConversation({ silent: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    application?.candidateId,
    collapsed,
    historyRefreshKey,
    isOpen,
    loadWhatsappConversation,
    panelTab,
    tenantId,
  ]);

  useEffect(() => {
    if (!isOpen || collapsed || panelTab !== 'whatsapp' || !application?.candidateId) {
      setWaPhoneHydrated(null);
      return;
    }
    const direct = String(waConversation?.phoneNumber || application.candidatePhone || '').trim();
    if (direct) {
      setWaPhoneHydrated(null);
      return;
    }
    let cancelled = false;
    candidatesApi
      .getById(application.candidateId)
      .then((c) => {
        if (cancelled) return;
        const p = String(c?.phone ?? '').trim();
        setWaPhoneHydrated(p || null);
      })
      .catch(() => {
        if (!cancelled) setWaPhoneHydrated(null);
      });
    return () => {
      cancelled = true;
    };
  }, [application?.candidateId, application?.candidatePhone, collapsed, isOpen, panelTab, waConversation?.phoneNumber]);

  useEffect(() => {
    if (panelTab !== 'whatsapp') return;
    const el = waScrollRef.current;
    if (!el) return;
    if (waLoading && waMessages.length === 0) return;
    el.scrollTop = el.scrollHeight;
  }, [panelTab, waLoading, waMessages]);

  const handleWhatsappPanelSend = async () => {
    if (!application?.candidateId || waSending) return;
    const tid = String(tenantId || '').trim();
    const cid = String(application.candidateId || '').trim();
    const to = normalizePhoneForWa(waTargetPhoneRaw);
    const body = waComposeBody.trim();
    setToastError(null);
    if (!tid) {
      setToastError(t('pipeline.inspector.whatsapp.missingTenant'));
      return;
    }
    if (!to) {
      setToastError(t('pipeline.message.missingRecipientPhone'));
      return;
    }
    if (!body) return;
    setWaSending(true);
    try {
      await whatsappApi.sendDirect({ tenantId: tid, candidateId: cid, to, body });
      setWaComposeBody('');
      const optId = `local-out-${Date.now()}`;
      const optimistic: WhatsappMessageDto = {
        id: optId,
        conversationId: String(waConversation?.id ?? ''),
        direction: 'outbound',
        providerMessageId: null,
        fromPhone: null,
        toPhone: to,
        body,
        createdAtUtc: new Date().toISOString(),
      };
      setWaMessages((prev) => [...prev, optimistic]);

      const mergeServerWithLocals = (prev: WhatsappMessageDto[], sorted: WhatsappMessageDto[]) => {
        const locals = prev.filter((m) => String(m.id).startsWith('local-out-'));
        if (sorted.length === 0 && prev.length > 0) return prev;
        const remainingLocals = locals.filter(
          (l) =>
            !sorted.some(
              (s) =>
                String(s.direction || '').toLowerCase() === 'outbound' && String(s.body || '').trim() === String(l.body || '').trim()
            )
        );
        return [...sorted, ...remainingLocals].sort(
          (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime()
        );
      };

      const pullLatest = async () => {
        const waitBeforeMs = [0, 400, 900, 1800];
        for (const w of waitBeforeMs) {
          if (w > 0) await new Promise((r) => window.setTimeout(r, w));
          try {
            const data = await whatsappApi.getConversationByCandidate(tid, cid);
            if (data.conversation) setWaConversation(data.conversation);
            const sorted = [...(data.messages || [])].sort(
              (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime()
            );
            setWaMessages((prev) => mergeServerWithLocals(prev, sorted));
            if (sorted.length > 0) return;
          } catch {
            return;
          }
        }
      };
      void pullLatest();
    } catch (e) {
      if (isUnauthorized(e)) {
        onUnauthorized?.();
        return;
      }
      setToastError(t('pipeline.message.whatsappSendFailed'));
    } finally {
      setWaSending(false);
    }
  };

  if (!isOpen) return null;

  // Collapsed desktop rail
  if (collapsed) {
    return (
      <div className="hidden lg:flex h-full flex-col bg-white/80 backdrop-blur-md border-l border-gray-200 shadow-xl">
        <div className="p-3 flex items-center justify-between border-b border-gray-200">
          <div className="w-9 h-9 rounded-full border border-gray-200 overflow-hidden">
            <img src={userPlaceholder} alt="" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={onToggleCollapsed}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Expand inspector"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-auto m-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Close inspector"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  const panel = (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-md border-l border-gray-200 shadow-xl">
      {isLoading ? (
        <Skeleton />
      ) : !application ? (
        <div className="p-6 text-sm text-gray-600">{t('tasks.details.noSelection')}</div>
      ) : (
        <>
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <img src={userPlaceholder} alt="" className="w-12 h-12 rounded-full border border-gray-200 object-cover flex-shrink-0" />
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-dark-text truncate">{application.candidateName}</h2>
                <p className="text-sm text-gray-600 truncate">{application.jobTitle || ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Note creation is triggered from the card menu (PipelinePage modal) */}
              <button
                onClick={onToggleCollapsed}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors hidden lg:inline-flex"
                aria-label="Minimize inspector"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Resume actions (above stage/status chips) */}
          <div className="px-6 pt-4">
            {toastError ? <ErrorMessage message={toastError} /> : null}
            {toastSuccess ? <SuccessMessage message={toastSuccess} /> : null}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-purple-200 text-primary hover:bg-purple-50 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!application?.candidateId || isLoadingResume || isAnalyzingAI}
                onClick={handleViewResume}
              >
                <div className="flex items-center justify-center gap-2">
                  {isLoadingResume ? (
                    <Spinner />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6M7 4h7l3 3v13a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                      />
                    </svg>
                  )}
                  <span>{t('pipeline.inspector.resume.view')}</span>
                </div>
              </Button>

              <Button
                variant="primary"
                size="sm"
                className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!resumeUrl || isAnalyzingAI || isLoadingResume}
                onClick={handleAnalyzeResume}
              >
                <div className="flex items-center justify-center gap-2">
                  {isAnalyzingAI ? (
                    <Spinner />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  )}
                  <span>{t('pipeline.inspector.resume.analyze')}</span>
                </div>
              </Button>
            </div>

            {aiResult ? (
              <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
                {t('pipeline.inspector.resume.hasResult')}
              </div>
            ) : null}
          </div>

          {/* Chips */}
          <div className="px-6 pt-3 pb-1 flex flex-wrap gap-2">
            <Chip label={stageName ? `In ${stageName}` : 'In stage'} tone="neutral" />
            <Chip label={statusChip.label} tone={statusChip.tone} className={statusChip.className} />
          </div>

          <div className="flex flex-col flex-1 min-h-0">
            {/* Main panel: activity vs WhatsApp conversation */}
            <div className="px-6 pt-4 flex-shrink-0">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setPanelTab('activity')}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    panelTab === 'activity' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                  }`}
                >
                  {t('pipeline.inspector.tabs.activity')}
                </button>
                <button
                  type="button"
                  onClick={() => setPanelTab('whatsapp')}
                  className={`flex-1 min-w-0 px-2 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${
                    panelTab === 'whatsapp' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                  }`}
                >
                  <img
                    src="https://cdn.simpleicons.org/whatsapp"
                    alt=""
                    width={16}
                    height={16}
                    className="w-4 h-4 shrink-0 object-contain"
                    loading="lazy"
                    aria-hidden="true"
                  />
                  <span className="truncate">{t('pipeline.inspector.tabs.whatsappConversation')}</span>
                </button>
              </div>
            </div>

            {panelTab === 'activity' ? (
              <>
                {/* Stage / Notes: icon + label only (distinct from segmented Activity / WhatsApp) */}
                <div className="px-6 pt-2 flex-shrink-0 flex flex-wrap items-center justify-center gap-5 sm:gap-6">
                  <button
                    type="button"
                    onClick={() => setTab('history')}
                    aria-pressed={tab === 'history'}
                    className={`inline-flex items-center gap-2 rounded-md px-1 py-2 text-sm font-medium transition-colors ${
                      tab === 'history'
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{t('pipeline.inspector.tabs.history')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('notes')}
                    aria-pressed={tab === 'notes'}
                    className={`inline-flex items-center gap-2 rounded-md px-1 py-2 text-sm font-medium transition-colors ${
                      tab === 'notes'
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>{t('pipeline.inspector.tabs.notes')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('tasks')}
                    aria-pressed={tab === 'tasks'}
                    className={`inline-flex items-center gap-2 rounded-md px-1 py-2 text-sm font-medium transition-colors ${
                      tab === 'tasks'
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-4 h-4 shrink-0 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                    <span>{t('pipeline.inspector.tabs.tasks')}</span>
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
                  {tab === 'history' ? (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Stage history</h3>
                      {historyLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
                          ))}
                        </div>
                      ) : historyError ? (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">{historyError}</div>
                      ) : historyItems.length === 0 ? (
                        <div className="text-sm text-gray-600">{t('pipeline.inspector.noHistory')}</div>
                      ) : (
                        <div className="space-y-4">
                          {historyItems.map((h) => {
                            const text =
                              h.fromStageName && h.toStageName
                                ? `Moved from ${h.fromStageName} to ${h.toStageName}`
                                : h.toStageName
                                  ? `Moved to ${h.toStageName}`
                                  : 'Stage changed';
                            return (
                              <div key={h.id} className="flex gap-3">
                                <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-dark-text">{text}</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {formatDateTime(h.at, locale)} • {h.by || 'System'}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : tab === 'notes' ? (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Notes</h3>
                      {notesLoading ? (
                        <div className="space-y-3">
                          {[1, 2].map((i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
                          ))}
                        </div>
                      ) : notesError ? (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">{notesError}</div>
                      ) : notesItems.length === 0 ? (
                        <div className="text-sm text-gray-600">{t('pipeline.inspector.noNotes')}</div>
                      ) : (
                        <div className="space-y-4">
                          {noteDeleteError ? (
                            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">{noteDeleteError}</div>
                          ) : null}
                          {notesItems.map((n) => {
                            const author = n.createdByName || n.createdByEmail || 'System';
                            return (
                              <div key={n.id} className="rounded-xl border border-gray-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-dark-text truncate">{author}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDateTime(n.createdAt, locale)}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNote(n.id)}
                                    disabled={noteDeleteId === n.id}
                                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-50"
                                    aria-label={t('pipeline.inspector.notes.deleteAria')}
                                    title={t('pipeline.inspector.notes.deleteAria')}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{n.body}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t('pipeline.inspector.tasks')}</h3>
                      {tasksLoading ? (
                        <div className="space-y-2">
                          {[1, 2].map((i) => (
                            <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
                          ))}
                        </div>
                      ) : tasksError ? (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">{tasksError}</div>
                      ) : tasksItems.length === 0 ? (
                        <div className="text-sm text-gray-600">{t('pipeline.inspector.noTasks')}</div>
                      ) : (
                        <div className="space-y-2">
                          {tasksItems.map((task) => {
                            const done = task.status === 'done' || task.status === ('completed' as any);
                            return (
                              <div key={task.id} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3">
                                <input type="checkbox" checked={done} readOnly className="mt-1" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-sm font-medium text-dark-text">{task.title}</p>
                                    <TaskStatusPill status={task.status} />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {task.dueAt ? formatDateTime(task.dueAt, locale) : t('common.none')}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
                <div ref={waScrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2 min-h-0 bg-white">
                  {waLoading && waMessages.length === 0 ? (
                    <div className="space-y-3 py-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                          <div className="h-11 w-48 max-w-[70%] rounded-2xl bg-gray-100 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : waError ? (
                    <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-4">{waError}</div>
                  ) : waMessages.length === 0 ? (
                    <p className="text-sm text-gray-600 text-center px-2 py-10">{t('pipeline.inspector.whatsapp.noMessages')}</p>
                  ) : (
                    waMessages.map((m) => {
                      const inbound = String(m.direction || '').toLowerCase() === 'inbound';
                      return (
                        <div key={m.id} className={`flex w-full ${inbound ? 'justify-start' : 'justify-end'}`}>
                          <div
                            className={`max-w-[min(85%,20rem)] rounded-2xl px-3 py-2 shadow-sm border border-black/[0.04] ${
                              inbound ? 'rounded-bl-md bg-gray-100 text-gray-900' : 'rounded-br-md bg-[#d9fdd3] text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-snug">{m.body}</p>
                            <p
                              className={`text-[10px] mt-1 tabular-nums ${inbound ? 'text-gray-500' : 'text-gray-600'}`}
                            >
                              {formatMessageTime(m.createdAtUtc, locale)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <textarea
                      value={waComposeBody}
                      onChange={(e) => setWaComposeBody(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleWhatsappPanelSend();
                        }
                      }}
                      rows={2}
                      placeholder={t('pipeline.inspector.whatsapp.composePlaceholder')}
                      disabled={waSending || !String(tenantId || '').trim()}
                      className="flex-1 min-h-[44px] max-h-28 resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-dark-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => void handleWhatsappPanelSend()}
                      disabled={
                        waSending ||
                        !String(tenantId || '').trim() ||
                        !normalizePhoneForWa(waTargetPhoneRaw) ||
                        !waComposeBody.trim()
                      }
                      className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={t('pipeline.message.send')}
                      title={t('pipeline.message.send')}
                    >
                      {waSending ? (
                        <Spinner className="w-5 h-5 text-white" />
                      ) : (
                        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {!normalizePhoneForWa(waTargetPhoneRaw) ? (
                    <p className="text-xs text-amber-700 mt-2">{t('pipeline.message.missingRecipientPhone')}</p>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!application || actionLoading !== null}
              onClick={async () => {
                if (!onReject) return;
                try {
                  setActionLoading('reject');
                  await onReject();
                } finally {
                  setActionLoading(null);
                }
              }}
            >
              {actionLoading === 'reject'
                ? t('common.actions.saving')
                : appStatus === 'rejected'
                  ? t('pipeline.actions.unreject')
                  : t('pipeline.actions.reject')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-600"
              disabled={!application || actionLoading !== null}
              onClick={async () => {
                if (!onArchive) return;
                try {
                  setActionLoading('archive');
                  await onArchive();
                } finally {
                  setActionLoading(null);
                }
              }}
            >
              {actionLoading === 'archive' ? t('common.actions.saving') : t('pipeline.actions.archive')}
            </Button>
          </div>
        </>
      )}
    </div>
  );


  // Responsive: drawer on small screens, fixed panel on lg+
  return (
    <>
      {/* Mobile overlay */}
      <div className="lg:hidden fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" {...backdropDismiss} />
        <div className="absolute right-0 top-0 h-full w-full max-w-md">{panel}</div>
      </div>

      {/* Desktop fixed panel */}
      <div className="hidden lg:block h-full">{panel}</div>

      <Modal
        isOpen={isResumeModalOpen}
        onClose={() => {
          setIsResumeModalOpen(false);
          setResumeModalError(null);
          setResumePreviewLoading(false);
        }}
        title={t('pipeline.inspector.resume.modalTitle')}
        width="xl"
        footer={
          resumeModalUrl ? (
            <>
              <Button variant="secondary" onClick={() => setIsResumeModalOpen(false)}>
                {t('common.actions.close')}
              </Button>
              <a href={resumeModalUrl} download rel="noreferrer" className="inline-flex">
                <Button variant="primary">{t('pipeline.inspector.resume.openInNewTab')}</Button>
              </a>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setIsResumeModalOpen(false)}>
              {t('common.actions.close')}
            </Button>
          )
        }
      >
        {resumeModalLoading ? (
          <div className="h-[70vh] rounded-2xl bg-gray-100 animate-pulse" />
        ) : resumeModalError ? (
          <ErrorMessage message={resumeModalError} />
        ) : viewerUrl ? (
          <div className="relative h-[70vh] rounded-2xl border border-gray-200 overflow-hidden bg-white">
            {resumePreviewLoading ? (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <Spinner className="w-5 h-5" />
                  <span>{t('common.loading')}</span>
                </div>
              </div>
            ) : null}
            <iframe
              title="resume-preview"
              src={viewerUrl}
              className="w-full h-full"
              onLoad={() => setResumePreviewLoading(false)}
            />
          </div>
        ) : (
          <div className="text-sm text-gray-600">{t('pipeline.inspector.resume.noResume')}</div>
        )}
      </Modal>

      <Modal
        isOpen={isAnalysisModalOpen}
        onClose={() => {
          setIsAnalysisModalOpen(false);
          setAnalysisError(null);
        }}
        title={t('pipeline.inspector.resume.analysisModalTitle')}
        width="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAnalysisModalOpen(false)}>
              {t('common.actions.close')}
            </Button>
            <Button
              variant="primary"
              disabled={!application?.candidateId || analysisLoading}
              onClick={() => application?.candidateId && loadAnalysis(application.candidateId)}
            >
              {analysisLoading ? t('common.actions.saving') : t('pipeline.inspector.resume.analysis.refresh')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {analysisLoading ? (
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
              <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
              <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
          ) : analysisError ? (
            <ErrorMessage message={analysisError} />
          ) : aiResult?.analysis ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {aiResult.cached ? <Chip label={t('pipeline.inspector.resume.analysis.cached')} tone="neutral" /> : null}
                  {aiResult.analysis.language ? (
                    <Chip label={`${t('pipeline.inspector.resume.analysis.language')}: ${aiResult.analysis.language}`} tone="neutral" />
                  ) : null}
                  {aiResult.analysis.docType ? (
                    <Chip label={`${t('pipeline.inspector.resume.analysis.docType')}: ${aiResult.analysis.docType}`} tone="neutral" />
                  ) : null}
                </div>
                {aiResult.analysis.createdAtUtc ? (
                  <div className="text-xs text-gray-500">
                    {t('pipeline.inspector.resume.analysis.createdAt')}: {formatDateTime(aiResult.analysis.createdAtUtc, locale)}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  {t('pipeline.inspector.resume.analysis.summary')}
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiResult.analysis.summary || '—'}</p>
                {typeof aiResult.analysis.extractedTextChars === 'number' ? (
                  <p className="text-xs text-gray-500 mt-3">
                    {t('pipeline.inspector.resume.analysis.extractedChars')}: {aiResult.analysis.extractedTextChars}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    {t('pipeline.inspector.resume.analysis.keyPoints')}
                  </h3>
                  {aiResult.analysis.keyPoints?.length ? (
                    <ul className="space-y-2">
                      {aiResult.analysis.keyPoints.map((k, idx) => (
                        <li key={`${idx}-${k}`} className="flex gap-2 text-sm text-gray-700">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span className="min-w-0">{k}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600">—</p>
                  )}
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-3">
                    {t('pipeline.inspector.resume.analysis.warnings')}
                  </h3>
                  {aiResult.analysis.warnings?.length ? (
                    <ul className="space-y-2">
                      {aiResult.analysis.warnings.map((w, idx) => (
                        <li key={`${idx}-${w}`} className="text-sm text-amber-900">
                          {w}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-amber-900/80">—</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600">{t('pipeline.inspector.resume.analysis.empty')}</div>
          )}
        </div>
      </Modal>
    </>
  );
}


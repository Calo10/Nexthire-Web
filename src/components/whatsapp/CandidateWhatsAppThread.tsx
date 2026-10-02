import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import { isUnauthorized } from '../../api/applicationsApi';
import { whatsappApi, type WhatsappConversationDto, type WhatsappMessageDto } from '../../api/whatsappApi';
import { useAuth } from '../../contexts/AuthContext';
import { useTwilioSourceConnection } from '../../hooks/sourcing/useTwilioSourceConnection';
import { resolveTenantId } from '../../lib/resolveTenantId';

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

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

interface CandidateWhatsAppThreadProps {
  candidateId: string;
  phone?: string | null;
  active: boolean;
  onNeedsHumanChange?: (needsHuman: boolean) => void;
  onUnreadCountChange?: (count: number) => void;
}

/**
 * Same WhatsApp thread the pipeline inspector loads: GET by candidate id + org tenant,
 * and recruiter replies go through send-direct for that candidate.
 */
export default function CandidateWhatsAppThread({
  candidateId,
  phone,
  active,
  onNeedsHumanChange,
  onUnreadCountChange,
}: CandidateWhatsAppThreadProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { org, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const tenantId = useMemo(() => resolveTenantId(org), [org]);
  const { isReady: twilioReady, isLoading: twilioLoading } = useTwilioSourceConnection(isAuthenticated && !authLoading);
  const locale = i18n.language || 'en';

  const [conversation, setConversation] = useState<WhatsappConversationDto | null>(null);
  const [messages, setMessages] = useState<WhatsappMessageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compose, setCompose] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const targetPhone = String(conversation?.phoneNumber || phone || '').trim();
  const needsHuman = String(conversation?.status || '').toLowerCase() === 'needs_human';

  useEffect(() => {
    onNeedsHumanChange?.(needsHuman);
  }, [needsHuman, onNeedsHumanChange]);

  useEffect(() => {
    onUnreadCountChange?.(conversation?.unreadCount ?? 0);
  }, [conversation?.unreadCount, onUnreadCountChange]);

  useEffect(() => {
    if (!active || !conversation?.id || (conversation.unreadCount ?? 0) <= 0) return;
    const tid = tenantId.trim();
    if (!tid) return;
    let cancelled = false;
    void whatsappApi.markRead(conversation.id, tid)
      .then(() => {
        if (cancelled) return;
        setConversation((current) => (current ? { ...current, unreadCount: 0 } : current));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [active, conversation?.id, conversation?.unreadCount, tenantId]);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      const tid = tenantId.trim();
      const cid = candidateId.trim();
      if (!twilioReady || !cid) {
        if (!silent) {
          setConversation(null);
          setMessages([]);
          setLoading(false);
          setError(null);
        }
        return;
      }
      if (!tid) {
        if (!silent) {
          setConversation(null);
          setMessages([]);
          setLoading(false);
          setError(t('pipeline.inspector.whatsapp.missingTenant'));
        }
        return;
      }
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await whatsappApi.getConversationByCandidate(tid, cid);
        setConversation(data.conversation);
        const sorted = [...(data.messages || [])].sort(
          (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime()
        );
        setMessages((prev) => {
          if (sorted.length === 0 && prev.length > 0) return prev;
          return sorted;
        });
      } catch (e) {
        if (isUnauthorized(e)) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        if (!silent) {
          const status = e && typeof e === 'object' && 'status' in e ? Number((e as { status?: number }).status) : 0;
          if (status === 404) {
            setError(null);
            setConversation(null);
            setMessages([]);
          } else {
            setError(t('pipeline.inspector.whatsapp.loadError'));
            setConversation(null);
            setMessages([]);
          }
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [candidateId, logout, navigate, t, tenantId, twilioReady]
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!active || !twilioReady) return;
    const intervalId = window.setInterval(() => {
      void load({ silent: true });
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [active, load, twilioReady]);

  useEffect(() => {
    if (!active) return;
    const el = scrollRef.current;
    if (!el) return;
    if (loading && messages.length === 0) return;
    el.scrollTop = el.scrollHeight;
  }, [active, loading, messages]);

  const canCompose = messages.length > 0;

  const handleSend = async () => {
    if (sending || !twilioReady || !canCompose) return;
    const tid = tenantId.trim();
    const cid = candidateId.trim();
    const to = normalizePhoneForWa(targetPhone);
    const body = compose.trim();
    setSendError(null);
    if (!tid) {
      setSendError(t('pipeline.inspector.whatsapp.missingTenant'));
      return;
    }
    if (!to) {
      setSendError(t('pipeline.message.missingRecipientPhone'));
      return;
    }
    if (!body) return;
    setSending(true);
    try {
      await whatsappApi.sendDirect({ tenantId: tid, candidateId: cid, to, body });
      setCompose('');
      const optimistic: WhatsappMessageDto = {
        id: `local-out-${Date.now()}`,
        conversationId: String(conversation?.id ?? ''),
        direction: 'outbound',
        providerMessageId: null,
        fromPhone: null,
        toPhone: to,
        body,
        createdAtUtc: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      const mergeServerWithLocals = (prev: WhatsappMessageDto[], sorted: WhatsappMessageDto[]) => {
        const locals = prev.filter((m) => String(m.id).startsWith('local-out-'));
        if (sorted.length === 0 && prev.length > 0) return prev;
        const remainingLocals = locals.filter(
          (l) =>
            !sorted.some(
              (s) =>
                String(s.direction || '').toLowerCase() === 'outbound' &&
                String(s.body || '').trim() === String(l.body || '').trim()
            )
        );
        return [...sorted, ...remainingLocals].sort(
          (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime()
        );
      };

      const waitBeforeMs = [0, 400, 900, 1800];
      for (const w of waitBeforeMs) {
        if (w > 0) await new Promise((r) => window.setTimeout(r, w));
        try {
          const data = await whatsappApi.getConversationByCandidate(tid, cid);
          if (data.conversation) setConversation(data.conversation);
          const sorted = [...(data.messages || [])].sort(
            (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime()
          );
          setMessages((prev) => mergeServerWithLocals(prev, sorted));
          if (sorted.length > 0) break;
        } catch {
          break;
        }
      }
    } catch (e) {
      if (isUnauthorized(e)) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setSendError(t('pipeline.message.whatsappSendFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleSendIntroduction = async () => {
    if (sending || !twilioReady) return;
    const tid = tenantId.trim();
    const cid = candidateId.trim();
    setSendError(null);
    if (!cid) return;
    setSending(true);
    try {
      const sent = await whatsappApi.sendIntroduction(cid);
      const optimistic: WhatsappMessageDto = {
        id: `local-out-${Date.now()}`,
        conversationId: String(conversation?.id ?? ''),
        direction: 'outbound',
        providerMessageId: null,
        fromPhone: null,
        toPhone: normalizePhoneForWa(targetPhone) || null,
        body: sent.body,
        createdAtUtc: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      if (!tid) return;

      const mergeServerWithLocals = (prev: WhatsappMessageDto[], sorted: WhatsappMessageDto[]) => {
        const locals = prev.filter((m) => String(m.id).startsWith('local-out-'));
        if (sorted.length === 0 && prev.length > 0) return prev;
        const remainingLocals = locals.filter(
          (l) =>
            !sorted.some(
              (s) =>
                String(s.direction || '').toLowerCase() === 'outbound' &&
                String(s.body || '').trim() === String(l.body || '').trim()
            )
        );
        return [...sorted, ...remainingLocals].sort(
          (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime()
        );
      };

      const waitBeforeMs = [0, 400, 900, 1800];
      for (const w of waitBeforeMs) {
        if (w > 0) await new Promise((r) => window.setTimeout(r, w));
        try {
          const data = await whatsappApi.getConversationByCandidate(tid, cid);
          if (data.conversation) setConversation(data.conversation);
          const sorted = [...(data.messages || [])].sort(
            (a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime()
          );
          setMessages((prev) => mergeServerWithLocals(prev, sorted));
          if (sorted.length > 0) break;
        } catch {
          break;
        }
      }
    } catch (e) {
      if (isUnauthorized(e)) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: string }).message || '') : '';
      setSendError(message || t('pipeline.inspector.whatsapp.introductionFailed'));
    } finally {
      setSending(false);
    }
  };

  if (twilioLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <Spinner className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  if (!twilioReady) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <ErrorMessage message={t('pipeline.inspector.whatsapp.configureRequired')} />
        <Button type="button" variant="primary" size="sm" className="mt-4" onClick={() => navigate('/app/sourcing?tab=sources')}>
          {t('sourcing.twilio.goToSources')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">
      {needsHuman ? (
        <div className="flex-shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
          {t('pipeline.inspector.whatsapp.needsHuman')}
        </div>
      ) : null}
      <div ref={scrollRef} className={`flex-1 min-h-0 bg-white ${canCompose ? 'overflow-y-auto px-3 py-4 space-y-2' : 'flex flex-col'}`}>
        {loading && messages.length === 0 ? (
          <div className="space-y-3 px-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                <div className="h-11 w-48 max-w-[70%] rounded-2xl bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="m-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-4">{error}</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-gray-600">{t('pipeline.inspector.whatsapp.noMessages')}</p>
            {sendError ? <p className="text-sm text-red-700">{sendError}</p> : null}
            <button
              type="button"
              onClick={() => void handleSendIntroduction()}
              disabled={sending || !candidateId.trim()}
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? <Spinner className="w-4 h-4 text-white" /> : t('pipeline.inspector.whatsapp.sendIntroduction')}
            </button>
          </div>
        ) : (
          messages.map((m) => {
            const inbound = String(m.direction || '').toLowerCase() === 'inbound';
            return (
              <div key={m.id} className={`flex w-full ${inbound ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[min(85%,20rem)] rounded-2xl px-3 py-2 shadow-sm border border-black/[0.04] ${
                    inbound ? 'rounded-bl-md bg-gray-100 text-gray-900' : 'rounded-br-md bg-[#d9fdd3] text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-snug">{m.body}</p>
                  <p className={`text-[10px] mt-1 tabular-nums ${inbound ? 'text-gray-500' : 'text-gray-600'}`}>
                    {formatMessageTime(m.createdAtUtc, locale)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3">
        {canCompose && sendError ? <div className="mb-2 text-sm text-red-700">{sendError}</div> : null}
        <div className="flex items-center gap-2">
          <textarea
            value={compose}
            onChange={(e) => setCompose(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            rows={2}
            placeholder={t('pipeline.inspector.whatsapp.composePlaceholder')}
            disabled={!canCompose || sending || !tenantId.trim()}
            className="flex-1 min-h-[44px] max-h-28 resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-dark-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canCompose || sending || !tenantId.trim() || !normalizePhoneForWa(targetPhone) || !compose.trim()}
            className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-colors hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t('pipeline.message.send')}
            title={t('pipeline.message.send')}
          >
            {sending ? (
              <Spinner className="w-5 h-5 text-white" />
            ) : (
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        {!normalizePhoneForWa(targetPhone) ? (
          <p className="text-xs text-amber-700 mt-2">{t('pipeline.message.missingRecipientPhone')}</p>
        ) : null}
      </div>
    </div>
  );
}

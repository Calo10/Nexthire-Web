import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isUnauthorized } from '../api/applicationsApi';
import { whatsappApi, type WhatsappConversationDto, type WhatsappMessageDto } from '../api/whatsappApi';
import { useAuth } from '../contexts/AuthContext';
import { useTwilioSourceConnection } from '../hooks/sourcing/useTwilioSourceConnection';
import { resolveTenantId } from '../lib/resolveTenantId';
import { isCustomerCareWindowOpen } from '../lib/whatsappCustomerCareWindow';
import Button from '../components/Button';
import { WhatsAppDeliveryCaption } from '../components/whatsapp/WhatsAppDeliveryCaption';

function formatListTime(iso: string | null | undefined, locale: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return date.toLocaleTimeString(locale || 'en', { hour: 'numeric', minute: '2-digit' });
  return date.toLocaleDateString(locale || 'en', { month: 'short', day: 'numeric' });
}

function formatMessageTime(iso: string | null | undefined, locale: string) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale || 'en', { hour: 'numeric', minute: '2-digit' });
}

function displayName(conversation: WhatsappConversationDto) {
  const candidateName = String(conversation.candidateName || '').trim();
  if (candidateName) return candidateName;
  const name = String(conversation.profileName || '').trim();
  if (name) return name;
  return String(conversation.phoneNumber || '').replace(/^whatsapp:/i, '');
}

function initials(conversation: WhatsappConversationDto) {
  const name = displayName(conversation);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  const digits = name.replace(/\D/g, '');
  if (digits.length >= 2) return digits.slice(-2);
  return (name[0] || '?').toUpperCase();
}

const avatarColors = ['#00a884', '#53bdeb', '#7f66ff', '#ff7a59', '#e67e22', '#128c7e'];

function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % avatarColors.length;
  return avatarColors[hash];
}

export default function WhatsAppInboxPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { org, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const tenantId = useMemo(() => resolveTenantId(org), [org]);
  const { isReady: twilioReady, isLoading: twilioLoading } = useTwilioSourceConnection(isAuthenticated && !authLoading);
  const locale = i18n.language || 'en';

  const [conversations, setConversations] = useState<WhatsappConversationDto[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsappMessageDto[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [compose, setCompose] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const sessionClosed = !messagesLoading && !messagesError && !isCustomerCareWindowOpen(messages);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = displayName(c).toLowerCase();
      const phone = String(c.phoneNumber || '').toLowerCase();
      const preview = String(c.lastMessageBody || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || preview.includes(q);
    });
  }, [conversations, query]);

  const handleAuthError = useCallback(
    (e: unknown) => {
      if (!isUnauthorized(e)) return false;
      logout();
      navigate('/login', { replace: true });
      return true;
    },
    [logout, navigate]
  );

  const loadConversations = useCallback(
    async (opts?: { silent?: boolean }) => {
      const tid = tenantId.trim();
      if (!tid) {
        if (!opts?.silent) {
          setListLoading(false);
          setListError(t('pipeline.inspector.whatsapp.missingTenant'));
          setConversations([]);
        }
        return;
      }
      if (!opts?.silent) setListLoading(true);
      try {
        const rows = await whatsappApi.listConversations(tid);
        setConversations(rows);
        setListError(null);
      } catch (e) {
        if (handleAuthError(e)) return;
        if (!opts?.silent) {
          setListError(t('whatsappInbox.loadError'));
          setConversations([]);
        }
      } finally {
        if (!opts?.silent) setListLoading(false);
      }
    },
    [handleAuthError, t, tenantId]
  );

  const loadMessages = useCallback(
    async (conversationId: string, opts?: { silent?: boolean }) => {
      const tid = tenantId.trim();
      if (!tid || !conversationId) return;
      if (!opts?.silent) {
        setMessages([]);
        setMessagesLoading(true);
        setMessagesError(null);
      }
      try {
        const rows = await whatsappApi.getMessages(conversationId, tid);
        setMessages((prev) => {
          if (rows.length === 0 && prev.length > 0 && opts?.silent) return prev;
          return rows;
        });
        setMessagesError(null);
      } catch (e) {
        if (handleAuthError(e)) return;
        if (!opts?.silent) {
          setMessagesError(t('whatsappInbox.messagesError'));
          setMessages([]);
        }
      } finally {
        if (!opts?.silent) setMessagesLoading(false);
      }
    },
    [handleAuthError, t, tenantId]
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadConversations({ silent: true });
    }, 5000);
    return () => window.clearInterval(id);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
  }, [loadMessages, selectedId]);

  useEffect(() => {
    const tid = tenantId.trim();
    if (!selectedId || !tid) return;
    const current = conversations.find((c) => c.id === selectedId);
    if (!current || (current.unreadCount ?? 0) <= 0) return;
    let cancelled = false;
    void whatsappApi.markRead(selectedId, tid).then(() => {
      if (cancelled) return;
      setConversations((prev) => prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)));
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [conversations, selectedId, tenantId]);

  useEffect(() => {
    if (!selectedId) return;
    const id = window.setInterval(() => {
      void loadMessages(selectedId, { silent: true });
    }, 5000);
    return () => window.clearInterval(id);
  }, [loadMessages, selectedId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (messagesLoading && messages.length === 0) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, messagesLoading, selectedId]);

  const handleSendTemplate = async () => {
    const candidateId = selected?.candidateId?.trim();
    if (!selectedId || !candidateId || sending || !twilioReady) return;
    setSending(true);
    setSendError(null);
    try {
      await whatsappApi.sendFollowUp(candidateId);
      await loadMessages(selectedId, { silent: true });
    } catch (e) {
      if (handleAuthError(e)) return;
      setSendError(t('pipeline.inspector.whatsapp.introductionFailed'));
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!selectedId || sending || !twilioReady || sessionClosed) return;
    const body = compose.trim();
    const tid = tenantId.trim();
    if (!body || !tid) return;
    setSending(true);
    setSendError(null);
    try {
      await whatsappApi.sendToConversation(selectedId, tid, body);
      setCompose('');
      const optimistic: WhatsappMessageDto = {
        id: `local-out-${Date.now()}`,
        conversationId: selectedId,
        direction: 'outbound',
        providerMessageId: null,
        fromPhone: null,
        toPhone: selected?.phoneNumber ?? null,
        body,
        createdAtUtc: new Date().toISOString(),
        deliveryStatus: 'queued',
      };
      setMessages((prev) => [...prev, optimistic]);
      setConversations((prev) =>
        prev
          .map((c) =>
            c.id === selectedId ? { ...c, lastMessageBody: body, lastMessageAtUtc: optimistic.createdAtUtc } : c
          )
          .sort((a, b) => new Date(b.lastMessageAtUtc || 0).getTime() - new Date(a.lastMessageAtUtc || 0).getTime())
      );
      await loadMessages(selectedId, { silent: true });
    } catch (e) {
      if (handleAuthError(e)) return;
      setSendError(t('whatsappInbox.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem-5rem)] overflow-hidden bg-white lg:h-screen">
      <aside className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] md:max-w-[40%] flex-col border-r border-gray-200 bg-white min-h-0`}>
        <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200">
          <h1 className="text-lg font-semibold text-[#111b21]">WhatsApp</h1>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('whatsappInbox.search')}
            className="mt-3 w-full rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm text-[#111b21] placeholder:text-[#667781] focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {listLoading && conversations.length === 0 ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-white border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : listError ? (
            <p className="m-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">{listError}</p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-10 text-sm text-center text-[#667781]">{t('whatsappInbox.emptyList')}</p>
          ) : (
            filtered.map((conversation) => {
              const active = conversation.id === selectedId;
              const needsHuman = String(conversation.status || '').toLowerCase() === 'needs_human';
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-gray-100 ${
                    active ? 'bg-primary/5' : 'bg-white hover:bg-primary/5'
                  }`}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: avatarColor(conversation.id) }}
                  >
                    {initials(conversation)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm text-[#111b21] ${(conversation.unreadCount ?? 0) > 0 ? 'font-semibold' : 'font-medium'}`}>
                        {displayName(conversation)}
                      </span>
                      <span className="shrink-0 text-[11px] text-[#667781]">
                        {formatListTime(conversation.lastMessageAtUtc, locale)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-sm text-[#667781]">
                        {conversation.lastMessageBody || conversation.phoneNumber.replace(/^whatsapp:/i, '')}
                      </span>
                      {needsHuman ? (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
                          title={t('pipeline.inspector.whatsapp.needsHuman')}
                        />
                      ) : null}
                      {(conversation.unreadCount ?? 0) > 0 ? (
                        <span
                          className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#00a884] px-1.5 text-[11px] font-semibold text-white"
                          title={t('whatsappInbox.unread', { count: conversation.unreadCount })}
                        >
                          {(conversation.unreadCount ?? 0) > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <section className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 min-w-0 flex-col min-h-0 bg-[#efeae2]`}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center px-6 text-center text-[#667781]">
            <p className="text-sm">{t('whatsappInbox.selectChat')}</p>
          </div>
        ) : (
          <>
            <header className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200">
              <button
                type="button"
                className="md:hidden p-1 text-[#54656f]"
                onClick={() => setSelectedId(null)}
                aria-label={t('common.actions.close')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: avatarColor(selected.id) }}
              >
                {initials(selected)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#111b21]">{displayName(selected)}</p>
                <p className="truncate text-xs text-[#667781]">{selected.phoneNumber.replace(/^whatsapp:/i, '')}</p>
              </div>
            </header>
            {String(selected.status || '').toLowerCase() === 'needs_human' ? (
              <div className="flex-shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
                {t('pipeline.inspector.whatsapp.needsHuman')}
              </div>
            ) : null}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 min-h-0">
              {messagesLoading && messages.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
                      <div className="h-11 w-48 rounded-lg bg-white/70 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : messagesError ? (
                <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-4">{messagesError}</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-center text-[#667781] py-10">{t('whatsappInbox.noMessages')}</p>
              ) : (
                messages.map((message) => {
                  const inbound = String(message.direction || '').toLowerCase() === 'inbound';
                  return (
                    <div key={message.id} className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[min(80%,28rem)] rounded-lg px-3 py-1.5 shadow-sm ${
                          inbound ? 'bg-white text-[#111b21]' : 'bg-[#d9fdd3] text-[#111b21]'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                        <p className="text-[10px] text-[#667781] text-right mt-0.5">
                          {formatMessageTime(message.createdAtUtc, locale)}
                          {inbound ? null : (
                            <>
                              {' · '}
                              <WhatsAppDeliveryCaption status={message.deliveryStatus} errorCode={message.deliveryErrorCode} />
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 pt-3 pb-6">
              {!twilioLoading && !twilioReady ? (
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-xs text-amber-800">{t('pipeline.inspector.whatsapp.configureRequired')}</p>
                  <Button type="button" variant="primary" size="sm" onClick={() => navigate('/app/sourcing?tab=sources')}>
                    {t('sourcing.twilio.goToSources')}
                  </Button>
                </div>
              ) : null}
              {sendError ? <p className="mb-2 text-xs text-red-700">{sendError}</p> : null}
              {sessionClosed ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-amber-800">
                    {selected?.candidateId?.trim()
                      ? t('whatsappInbox.windowClosed')
                      : t('whatsappInbox.windowClosedNoCandidate')}
                  </p>
                  {selected?.candidateId?.trim() ? (
                    <button
                      type="button"
                      onClick={() => void handleSendTemplate()}
                      disabled={sending || !twilioReady}
                      className="inline-flex w-fit items-center justify-center rounded-full bg-[#00a884] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                    >
                      {t('whatsappInbox.sendTemplate')}
                    </button>
                  ) : null}
                </div>
              ) : (
              <div className="flex items-end gap-2">
                <textarea
                  value={compose}
                  onChange={(e) => setCompose(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  rows={1}
                  placeholder={t('whatsappInbox.composePlaceholder')}
                  disabled={sending || !twilioReady}
                  className="flex-1 max-h-28 resize-none rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-[#111b21] placeholder:text-[#667781] focus:outline-none focus:ring-2 focus:ring-[#00a884]/30 disabled:bg-gray-100"
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || !twilioReady || !compose.trim()}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white disabled:opacity-40"
                  aria-label={t('pipeline.message.send')}
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

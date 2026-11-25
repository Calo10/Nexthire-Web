import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { aiAgentsApi, type AgentChatMessage, type AgentHireStatus } from '../../features/ai-agents/api/aiAgentsApi';
import { DAILY_CHAT_AGENTS } from '../../features/ai-agents/lib/agentDailyStatus';
import { agentCatalogPath, agentDetailPath, type AgentId } from '../../features/ai-agents/models/agentCatalog';
import { agentHomePath } from '../../features/ai-agents/models/agentDetail';
import { formatTokenCount, toHiredView, type HiredAgentView } from '../../features/ai-agents/models/agentHome';

type Message = AgentChatMessage;
type ViewMode = 'roster' | 'chat';

const STATUS_DOT: Record<AgentHireStatus, string> = {
  active: 'bg-emerald-500',
  paused: 'bg-slate-400',
  busy: 'bg-amber-500',
  inactive: 'bg-gray-400',
};

const STATUS_TONE: Record<AgentHireStatus, string> = {
  active: 'text-emerald-700 bg-emerald-50',
  paused: 'text-slate-600 bg-slate-100',
  busy: 'text-amber-700 bg-amber-50',
  inactive: 'text-gray-500 bg-gray-100',
};

const SUGGESTIONS: Record<AgentId, readonly string[]> = {
  sourcing: ['whoConverted', 'raiseConversion', 'runNow'],
  campaign: ['whatLaunched', 'raiseBudget', 'runNow'],
  screening: ['whoContacted', 'raiseWait', 'runNow'],
  interview: ['whoInvited', 'raiseWait', 'runNow'],
  offer: ['whoOffered', 'raiseCap', 'runNow'],
};

function chatNamespace(agentId: AgentId): string {
  return `aiAgents.detail.chat.${agentId}`;
}

export default function DashboardAiAgentsCard() {
  const { t, i18n } = useTranslation();
  const [hired, setHired] = useState<HiredAgentView[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const [mode, setMode] = useState<ViewMode>('roster');
  const [selectedId, setSelectedId] = useState<AgentId | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const activeCount = hired.filter((a) => a.status === 'active' || a.status === 'busy').length;
  const preview = hired.slice(0, 5);
  const chatters = useMemo(
    () => hired.filter((agent) => DAILY_CHAT_AGENTS.includes(agent.id)),
    [hired],
  );
  const selected = chatters.find((agent) => agent.id === selectedId) ?? chatters[0] ?? null;
  const paused = selected?.status === 'paused';
  const ns = selected ? chatNamespace(selected.id) : 'aiAgents.detail.chat';
  const chatKey = (key: string) => `${ns}.${key}`;
  const showChat = mode === 'chat' && chatters.length > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await aiAgentsApi.listHired();
        if (cancelled) return;
        const views = rows.map(toHiredView);
        setHired(views);
        const first = views.find((agent) => DAILY_CHAT_AGENTS.includes(agent.id));
        setSelectedId(first?.id ?? null);
      } catch {
        if (!cancelled) {
          setHired([]);
          setSelectedId(null);
        }
      } finally {
        if (!cancelled) setLoadingHome(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showChat || !selected) {
      setMessages([]);
      setLoadingChat(false);
      setDraft('');
      setError(null);
      setPickerOpen(false);
      return;
    }
    let cancelled = false;
    setLoadingChat(true);
    setDraft('');
    setError(null);
    setSending(false);
    aiAgentsApi
      .listChat(selected.id)
      .then((items) => {
        if (!cancelled) setMessages(items);
      })
      .catch((err) => {
        if (!cancelled) {
          const message =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message?: unknown }).message || '')
              : '';
          setError(message || t(chatKey('error')));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingChat(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on agent / mode change
  }, [showChat, selected?.id, t]);

  useEffect(() => {
    if (!showChat) return;
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, loadingChat, showChat]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPickerOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [pickerOpen]);

  const openChat = () => {
    if (chatters.length === 0) return;
    if (!selectedId || !chatters.some((agent) => agent.id === selectedId)) {
      setSelectedId(chatters[0].id);
    }
    setMode('chat');
  };

  const backToRoster = () => {
    setMode('roster');
    setPickerOpen(false);
    setError(null);
  };

  const send = async (text: string) => {
    if (!selected) return;
    const content = text.trim();
    if (!content || sending || paused) return;
    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setDraft('');
    setSending(true);
    setError(null);
    try {
      const reply = await aiAgentsApi.chat(selected.id, { messages: next, locale: i18n.language });
      setMessages(
        reply.messages.length > 0 ? reply.messages : [...next, { role: 'assistant', content: reply.reply }],
      );
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message || '')
          : '';
      setError(message || t(chatKey('error')));
    } finally {
      setSending(false);
      input.current?.focus();
    }
  };

  const empty = !loadingChat && messages.length === 0 && !sending;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 h-full flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-dark-text">{t('dashboard.aiAgents.title')}</h2>
          {!loadingHome && hired.length > 0 && !showChat ? (
            <p className="text-xs text-gray-500 mt-0.5">
              {t('dashboard.aiAgents.summary', { hired: hired.length, active: activeCount })}
            </p>
          ) : null}
          {!loadingHome && showChat ? (
            <p className="text-xs text-gray-500 mt-0.5">
              {t('dashboard.aiAgents.chatSubtitle', { count: chatters.length })}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showChat ? (
            <button
              type="button"
              onClick={backToRoster}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('dashboard.aiAgents.backToAgents')}
            </button>
          ) : chatters.length > 0 ? (
            <button
              type="button"
              onClick={openChat}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-white bg-[#7C3AED] hover:bg-[#6D28D9]"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {t('dashboard.aiAgents.openChat')}
            </button>
          ) : null}
          <Link to={agentHomePath()} className="text-sm font-medium text-[#0077E6] hover:underline">
            {t('dashboard.aiAgents.viewAll')}
          </Link>
        </div>
      </div>

      {loadingHome ? (
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#0077E6] border-t-transparent" />
        </div>
      ) : hired.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 inline-flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-dark-text">{t('dashboard.aiAgents.emptyTitle')}</p>
          <p className="text-xs text-gray-500 mt-1 max-w-[16rem]">{t('dashboard.aiAgents.emptyHint')}</p>
          <Link
            to={agentCatalogPath()}
            className="mt-4 inline-flex h-9 items-center rounded-lg px-3 text-xs font-medium text-white bg-gradient-to-r from-[#0077E6] to-[#7C3AED] hover:brightness-105"
          >
            {t('dashboard.aiAgents.hire')}
          </Link>
        </div>
      ) : showChat && selected ? (
        <>
          <div className="relative mb-3" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              className="w-full h-11 rounded-xl border border-gray-200 bg-[#F8FAFC] hover:bg-white hover:border-[#0077E6]/35 px-2.5 flex items-center gap-2.5 text-left transition-colors"
              aria-haspopup="listbox"
              aria-expanded={pickerOpen}
              aria-label={t('dashboard.aiAgents.pickAgent')}
            >
              <img
                src={selected.avatar}
                alt=""
                className={`w-8 h-8 rounded-lg object-cover object-top shrink-0 ${selected.avatarBg}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-dark-text truncate leading-tight">{selected.firstName}</p>
                <p className="text-[11px] text-[#0077E6] font-medium truncate">
                  {t(`aiAgents.agents.${selected.id}.name`)}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {pickerOpen ? (
              <ul
                role="listbox"
                className="absolute z-20 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg py-1"
              >
                {chatters.map((agent) => {
                  const active = agent.id === selected.id;
                  return (
                    <li key={agent.id} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(agent.id);
                          setPickerOpen(false);
                          window.setTimeout(() => input.current?.focus(), 40);
                        }}
                        className={`w-full px-2.5 py-2 flex items-center gap-2.5 text-left hover:bg-sky-50 ${
                          active ? 'bg-sky-50/70' : ''
                        }`}
                      >
                        <img
                          src={agent.avatar}
                          alt=""
                          className={`w-8 h-8 rounded-lg object-cover object-top shrink-0 ${agent.avatarBg}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-dark-text truncate">{agent.firstName}</p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {t(`aiAgents.agents.${agent.id}.name`)}
                            {agent.status === 'paused' ? ` · ${t('aiAgents.home.status.paused')}` : ''}
                          </p>
                        </div>
                        {active ? <span className="w-1.5 h-1.5 rounded-full bg-[#0077E6] shrink-0" /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <div
            ref={scroller}
            className="h-[180px] shrink-0 overflow-y-auto overscroll-contain rounded-xl border border-gray-100 bg-[#F8FAFC] px-3 py-3 space-y-2.5"
          >
            {loadingChat ? (
              <div className="h-full flex items-center justify-center py-6">
                <p className="text-sm text-gray-500">{t('aiAgents.detail.chat.ui.loading')}</p>
              </div>
            ) : paused && empty ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-3 py-6">
                <p className="text-sm text-gray-500">{t(chatKey('paused'))}</p>
                <Link
                  to={agentDetailPath(selected.id)}
                  className="mt-2 text-xs font-medium text-[#0077E6] hover:underline"
                >
                  {t('dashboard.aiAgents.openAgent')}
                </Link>
              </div>
            ) : empty ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-2 py-4">
                <img
                  src={selected.avatar}
                  alt=""
                  className={`w-12 h-12 rounded-xl object-cover object-top mb-2 ${selected.avatarBg}`}
                />
                <p className="text-sm font-semibold text-dark-text">
                  {t('aiAgents.detail.chat.ui.emptyTitle', { name: selected.firstName })}
                </p>
                <p className="mt-1 text-xs text-gray-500 max-w-[15rem]">{t(chatKey('hint'))}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {(SUGGESTIONS[selected.id] ?? []).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => void send(t(`${chatKey('suggestions')}.${key}`))}
                      className="text-[11px] font-medium rounded-full border border-gray-200 bg-white px-2.5 py-1 hover:bg-violet-50 hover:border-violet-200 hover:text-[#5B4BDB]"
                    >
                      {t(`${chatKey('suggestions')}.${key}`)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {paused ? (
                  <p className="text-center text-[11px] text-gray-500 bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
                    {t(chatKey('paused'))}
                  </p>
                ) : null}
                {messages.map((message, index) =>
                  message.role === 'user' ? (
                    <div key={`user-${index}`} className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#7C3AED] text-white px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    <div key={`assistant-${index}`} className="flex items-end gap-2">
                      <img
                        src={selected.avatar}
                        alt=""
                        className={`w-6 h-6 rounded-md object-cover object-top shrink-0 ${selected.avatarBg}`}
                      />
                      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white text-dark-text border border-gray-100 px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap shadow-sm">
                        {message.content}
                      </div>
                    </div>
                  ),
                )}
                {sending ? (
                  <div className="flex items-end gap-2">
                    <img
                      src={selected.avatar}
                      alt=""
                      className={`w-6 h-6 rounded-md object-cover object-top shrink-0 ${selected.avatarBg}`}
                    />
                    <div className="rounded-2xl rounded-bl-md bg-white border border-gray-100 px-3 py-2.5 shadow-sm">
                      <span className="inline-flex gap-1 items-center h-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.1s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                      </span>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {error ? (
            <p className="mt-2 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
              {error}
            </p>
          ) : null}

          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <textarea
              ref={input}
              value={draft}
              rows={1}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              placeholder={t(chatKey('placeholder'))}
              disabled={paused || sending}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm max-h-24 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={paused || sending || !draft.trim()}
              className="h-10 w-10 shrink-0 rounded-xl text-white bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-300 inline-flex items-center justify-center"
              aria-label={t('aiAgents.detail.chat.send')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </>
      ) : (
        <ul className="flex-1 space-y-2.5 min-h-0 overflow-y-auto">
          {preview.map((agent) => (
            <li key={agent.id}>
              <Link
                to={agentDetailPath(agent.id)}
                className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 hover:border-[#0077E6]/25 hover:bg-sky-50/40 transition-colors"
              >
                <img
                  src={agent.avatar}
                  alt=""
                  className={`w-10 h-10 rounded-xl object-cover object-top shrink-0 ${agent.avatarBg}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-semibold text-dark-text truncate">{agent.firstName}</p>
                    <span
                      className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[10px] font-medium shrink-0 ${STATUS_TONE[agent.status]}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[agent.status]}`} />
                      {t(`aiAgents.home.status.${agent.status}`)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#0077E6] font-medium truncate">
                    {t(`aiAgents.agents.${agent.id}.name`)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">{t('aiAgents.home.runs')}</p>
                  <p className="text-sm font-semibold text-dark-text leading-tight">
                    {agent.runs.toLocaleString(i18n.language)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatTokenCount(agent.tokens)} {t('aiAgents.home.tokensUnit')}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {hired.length > preview.length ? (
            <li className="pt-1 text-center">
              <Link to={agentHomePath()} className="text-xs font-medium text-[#0077E6] hover:underline">
                {t('dashboard.aiAgents.more', { count: hired.length - preview.length })}
              </Link>
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

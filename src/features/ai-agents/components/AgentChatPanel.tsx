import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApiError } from '../../../lib/api';
import { aiAgentsApi, type AgentChatMessage, type HiredAgent } from '../api/aiAgentsApi';
import type { AgentId } from '../models/agentCatalog';
import type { HiredAgentView } from '../models/agentHome';

type Message = AgentChatMessage;

type Props = {
  agent: HiredAgentView;
  paused?: boolean;
  onAgentUpdate?: (agent: HiredAgent) => void;
};

const CHAT_AGENTS: AgentId[] = ['sourcing', 'campaign', 'screening', 'interview', 'offer'];
const ARIA_SUGGESTIONS = ['whoConverted', 'raiseConversion', 'runNow'] as const;
const VERA_SUGGESTIONS = ['whatLaunched', 'raiseBudget', 'runNow'] as const;
const KAI_SUGGESTIONS = ['whoContacted', 'raiseWait', 'runNow'] as const;
const LENA_SUGGESTIONS = ['whoInvited', 'raiseWait', 'runNow'] as const;
const MIRA_SUGGESTIONS = ['whoOffered', 'raiseCap', 'runNow'] as const;

export default function AgentChatPanel({ agent, paused = false, onAgentUpdate }: Props) {
  const { t, i18n } = useTranslation();
  const agentId = agent.id;
  const canChat = CHAT_AGENTS.includes(agentId);
  const chatKey = (key: string) =>
    agentId === 'campaign'
      ? `aiAgents.detail.chat.campaign.${key}`
      : agentId === 'screening'
        ? `aiAgents.detail.chat.screening.${key}`
        : agentId === 'interview'
          ? `aiAgents.detail.chat.interview.${key}`
          : agentId === 'offer'
            ? `aiAgents.detail.chat.offer.${key}`
            : agentId === 'sourcing'
              ? `aiAgents.detail.chat.sourcing.${key}`
              : `aiAgents.detail.chat.${key}`;
  const suggestions =
    agentId === 'campaign'
      ? VERA_SUGGESTIONS
      : agentId === 'screening'
        ? KAI_SUGGESTIONS
        : agentId === 'interview'
          ? LENA_SUGGESTIONS
          : agentId === 'offer'
            ? MIRA_SUGGESTIONS
            : ARIA_SUGGESTIONS;

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(canChat);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft('');
    setError(null);
    setSending(false);
    if (!canChat) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    aiAgentsApi
      .listChat(agentId)
      .then((items) => {
        if (!cancelled) setMessages(items);
      })
      .catch((err) => {
        if (!cancelled) setError((err as ApiError).message || t(chatKey('error')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId, canChat, t]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (!paused && canChat) input.current?.focus();
  }, [agentId, paused, canChat]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending || paused || !canChat) return;
    const next: Message[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setDraft('');
    setSending(true);
    setError(null);
    try {
      const reply = await aiAgentsApi.chat(agentId, { messages: next, locale: i18n.language });
      setMessages(
        reply.messages.length > 0 ? reply.messages : [...next, { role: 'assistant', content: reply.reply }],
      );
      if (reply.agent) onAgentUpdate?.(reply.agent);
    } catch (err) {
      setError((err as ApiError).message || t(chatKey('error')));
    } finally {
      setSending(false);
      input.current?.focus();
    }
  };

  const role = t(`aiAgents.agents.${agentId}.name`);
  const empty = !loading && messages.length === 0 && !sending;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-18rem)] min-h-[520px] max-h-[760px]">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <img
          src={agent.avatar}
          alt=""
          className={`w-10 h-10 rounded-xl object-cover object-top shrink-0 ${agent.avatarBg}`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-dark-text leading-tight">{agent.firstName}</p>
          <p className="text-xs text-gray-500 truncate">{role}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-[11px] font-medium ${
            paused ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-slate-400' : 'bg-emerald-500'}`} />
          {paused ? t('aiAgents.detail.chat.ui.away') : t('aiAgents.detail.chat.ui.online')}
        </span>
      </header>

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F8FAFC]">
        {!canChat ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-500 text-center max-w-sm">{t('aiAgents.detail.chatSoon')}</p>
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-500">{t('aiAgents.detail.chat.ui.loading')}</p>
          </div>
        ) : paused && empty ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-gray-500 text-center max-w-sm">{t(chatKey('paused'))}</p>
          </div>
        ) : empty ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <img
              src={agent.avatar}
              alt=""
              className={`w-16 h-16 rounded-2xl object-cover object-top mb-3 ${agent.avatarBg}`}
            />
            <p className="text-base font-semibold text-dark-text">
              {t('aiAgents.detail.chat.ui.emptyTitle', { name: agent.firstName })}
            </p>
            <p className="mt-1.5 text-sm text-gray-500 max-w-md">{t(chatKey('hint'))}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => void send(t(`${chatKey('suggestions')}.${key}`))}
                  className="text-xs font-medium rounded-full border border-gray-200 bg-white px-3 py-1.5 hover:bg-blue-50 hover:border-blue-200 hover:text-[#0077E6]"
                >
                  {t(`${chatKey('suggestions')}.${key}`)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {paused ? (
              <p className="text-center text-xs text-gray-500 bg-white border border-gray-100 rounded-xl px-3 py-2">
                {t(chatKey('paused'))}
              </p>
            ) : null}
            {messages.map((message, index) =>
              message.role === 'user' ? (
                <div key={`user-${index}`} className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-br-md bg-[#0077E6] text-white px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={`assistant-${index}`} className="flex items-end gap-2">
                  <img
                    src={agent.avatar}
                    alt=""
                    className={`w-7 h-7 rounded-lg object-cover object-top shrink-0 ${agent.avatarBg}`}
                  />
                  <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-white text-dark-text border border-gray-100 px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                    {message.content}
                  </div>
                </div>
              ),
            )}
            {sending ? (
              <div className="flex items-end gap-2">
                <img
                  src={agent.avatar}
                  alt=""
                  className={`w-7 h-7 rounded-lg object-cover object-top shrink-0 ${agent.avatarBg}`}
                />
                <div className="rounded-2xl rounded-bl-md bg-white border border-gray-100 px-3.5 py-3 shadow-sm">
                  <p className="sr-only">{t(chatKey('thinking'))}</p>
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

      {error ? <p className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">{error}</p> : null}

      <form
        className="p-3 border-t border-gray-100 bg-white flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void send(draft);
        }}
      >
        <textarea
          ref={input}
          value={draft}
          rows={Math.min(4, Math.max(1, draft.split('\n').length))}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void send(draft);
            }
          }}
          placeholder={canChat ? t(chatKey('placeholder')) : t('aiAgents.detail.chatSoon')}
          disabled={paused || sending || !canChat}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm max-h-32 focus:outline-none focus:ring-2 focus:ring-[#0077E6]/30 disabled:bg-gray-50"
        />
        <button
          type="submit"
          disabled={paused || sending || !canChat || !draft.trim()}
          className="h-10 w-10 shrink-0 rounded-xl text-white bg-[#0077E6] hover:bg-[#0066CC] disabled:bg-gray-300 inline-flex items-center justify-center"
          aria-label={t('aiAgents.detail.chat.send')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </section>
  );
}

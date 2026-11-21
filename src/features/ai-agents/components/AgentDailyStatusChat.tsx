import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { aiAgentsApi } from '../api/aiAgentsApi';
import { getAgentById } from '../models/agentCatalog';
import { toHiredView, type HiredAgentView } from '../models/agentHome';
import {
  buildDailyStatusSeed,
  canDailyChat,
  dailyMeetingPrompt,
  detectDailyReplyLanguage,
  isDailyNoReply,
  type DailyMeetingMessage,
} from '../lib/agentDailyStatus';

type Props = {
  hired: HiredAgentView[];
  active: boolean;
};

export default function AgentDailyStatusChat({ hired, active }: Props) {
  const { t, i18n } = useTranslation();
  const [snapshot, setSnapshot] = useState<HiredAgentView[]>(hired);
  const [messages, setMessages] = useState<DailyMeetingMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const seedKey = useRef(0);

  useEffect(() => {
    if (!active) {
      setMessages([]);
      setDraft('');
      setError(null);
      setSending(false);
      setLoading(false);
      setSnapshot(hired);
      return;
    }

    let cancelled = false;
    const key = ++seedKey.current;
    setLoading(true);
    setDraft('');
    setError(null);
    setSending(false);
    setMessages([]);

    void aiAgentsApi
      .listHired()
      .then((rows) => {
        if (cancelled || key !== seedKey.current) return;
        const mapped = rows.map(toHiredView);
        const fresh = mapped.length > 0 ? mapped : hired;
        setSnapshot(fresh);
        setMessages(buildDailyStatusSeed(fresh, t, i18n.language));
      })
      .catch(() => {
        if (cancelled || key !== seedKey.current) return;
        setSnapshot(hired);
        setMessages(buildDailyStatusSeed(hired, t, i18n.language));
      })
      .finally(() => {
        if (cancelled || key !== seedKey.current) return;
        setLoading(false);
        window.setTimeout(() => input.current?.focus(), 80);
      });

    return () => {
      cancelled = true;
    };
    // Fresh seed every time Daily Status opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [active]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, loading]);

  const participants = snapshot.filter(canDailyChat);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending || !active || participants.length === 0) return;

    const now = Date.now();
    const userMsg: DailyMeetingMessage = {
      id: `user-${now}`,
      kind: 'user',
      content,
      at: new Date(now).toISOString(),
    };
    const pending: DailyMeetingMessage[] = participants.map((agent, index) => ({
      id: `pending-${agent.id}-${now}`,
      kind: 'agent',
      agentId: agent.id,
      content: t('aiAgents.correlation.daily.thinking', { name: getAgentById(agent.id).firstName }),
      at: new Date(now + index).toISOString(),
      pending: true,
    }));

    setMessages((prev) => [...prev, userMsg, ...pending]);
    setDraft('');
    setSending(true);
    setError(null);

    const replyLocale = detectDailyReplyLanguage(content, i18n.language);
    const results = await Promise.allSettled(
      participants.map((agent) =>
        aiAgentsApi.chat(agent.id, {
          messages: [{ role: 'user', content: dailyMeetingPrompt(content, agent.id, replyLocale) }],
          locale: replyLocale,
        }),
      ),
    );

    setMessages((prev) => {
      const cleaned = prev.filter((msg) => !(msg.pending && msg.id.includes(`-${now}`)));
      const replies: DailyMeetingMessage[] = [];
      let hardFailures = 0;

      participants.forEach((agent, index) => {
        const result = results[index];
        if (result.status === 'fulfilled') {
          const reply = result.value.reply.trim();
          if (!reply || isDailyNoReply(reply)) return;
          replies.push({
            id: `reply-${agent.id}-${now}`,
            kind: 'agent',
            agentId: agent.id,
            content: reply,
            at: new Date(now + index + 1).toISOString(),
          });
          return;
        }
        hardFailures += 1;
      });

      if (replies.length === 0) {
        return [
          ...cleaned,
          {
            id: `sys-empty-${now}`,
            kind: 'system',
            content:
              hardFailures === participants.length
                ? t('aiAgents.correlation.daily.allFailed')
                : t('aiAgents.correlation.daily.noneRelevant'),
            at: new Date(now + 1).toISOString(),
          },
        ];
      }

      return [...cleaned, ...replies];
    });

    setSending(false);
  };

  if (!active) return null;

  return (
    <div className="flex flex-col h-full min-h-[420px] rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
        <p className="text-sm font-semibold text-dark-text">{t('aiAgents.correlation.daily.title')}</p>
        <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
          {t('aiAgents.correlation.daily.subtitle', { count: participants.length })}
        </p>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500">
            {t('aiAgents.correlation.daily.loading')}
          </div>
        ) : null}

        {!loading
          ? messages.map((msg) => {
              if (msg.kind === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <p className="max-w-[90%] text-center text-[11px] text-slate-500 bg-slate-100 rounded-full px-3 py-1">
                      {msg.content}
                    </p>
                  </div>
                );
              }

              if (msg.kind === 'user') {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#0077E6] text-white px-3.5 py-2.5 shadow-sm">
                      <p className="text-[11px] font-medium text-sky-100 mb-0.5">
                        {t('aiAgents.correlation.daily.you')}
                      </p>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              const agent = msg.agentId ? getAgentById(msg.agentId) : null;
              return (
                <div key={msg.id} className="flex items-start gap-2.5">
                  {agent ? (
                    <img
                      src={agent.avatar}
                      alt=""
                      className={`w-8 h-8 rounded-full object-cover object-top shrink-0 ${agent.avatarBg}`}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl rounded-bl-md border px-3.5 py-2.5 shadow-sm ${
                      msg.pending
                        ? 'border-dashed border-slate-200 bg-slate-50'
                        : 'border-slate-200 bg-[#F8FAFC]'
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-dark-text mb-0.5">
                      {agent?.firstName ?? 'Agent'}
                      {msg.pending ? (
                        <span className="ml-1.5 font-normal text-slate-400">
                          {t('aiAgents.correlation.daily.typing')}
                        </span>
                      ) : null}
                    </p>
                    <p
                      className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.pending ? 'text-slate-400 italic' : 'text-slate-700'
                      }`}
                    >
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })
          : null}
      </div>

      {error ? <p className="px-4 text-xs text-red-600">{error}</p> : null}

      <div className="border-t border-slate-100 p-3 bg-white">
        {participants.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-1">
            {t('aiAgents.correlation.daily.noChatters')}
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              ref={input}
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              placeholder={t('aiAgents.correlation.daily.placeholder')}
              disabled={sending || loading}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm text-dark-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00AAFF]/40 focus:border-[#0077E6] disabled:bg-slate-50"
            />
            <button
              type="button"
              disabled={sending || loading || !draft.trim()}
              onClick={() => void send(draft)}
              className="shrink-0 rounded-xl bg-gradient-to-r from-[#0077E6] to-[#00AAFF] text-white text-sm font-medium px-4 py-2.5 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500"
            >
              {sending ? t('aiAgents.correlation.daily.sending') : t('aiAgents.correlation.daily.send')}
            </button>
          </div>
        )}
        <p className="mt-1.5 text-[10px] text-slate-400">{t('aiAgents.correlation.daily.hint')}</p>
      </div>
    </div>
  );
}

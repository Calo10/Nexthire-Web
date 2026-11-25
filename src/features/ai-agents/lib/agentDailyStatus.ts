import type { TFunction } from 'i18next';
import { getAgentById, type AgentId } from '../models/agentCatalog';
import type { AriaReview } from '../api/aiAgentsApi';
import type { HiredAgentView } from '../models/agentHome';
import { correlationSeatsFor } from './agentCorrelation';

export const DAILY_CHAT_AGENTS: AgentId[] = [
  'sourcing',
  'campaign',
  'screening',
  'interview',
  'offer',
];

export type DailyMeetingMessage = {
  id: string;
  kind: 'system' | 'user' | 'agent';
  agentId?: AgentId;
  content: string;
  at: string;
  pending?: boolean;
};

/** Local calendar day — Daily Status is a standup for "today", not a rolling 24h window. */
export function isTodayLocal(iso: string | null | undefined, now = Date.now()): boolean {
  if (!iso) return false;
  const ts = new Date(iso);
  if (!Number.isFinite(ts.getTime())) return false;
  const current = new Date(now);
  return (
    ts.getFullYear() === current.getFullYear() &&
    ts.getMonth() === current.getMonth() &&
    ts.getDate() === current.getDate()
  );
}

export function canDailyChat(agent: HiredAgentView): boolean {
  return DAILY_CHAT_AGENTS.includes(agent.id) && agent.status !== 'paused';
}

function formatClock(iso: string | null | undefined, locale: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function reviewsToday(reviews: AriaReview[] | undefined, now: number): AriaReview[] {
  return (reviews ?? []).filter((review) => isTodayLocal(review.at, now));
}

function reviewTitle(review: AriaReview): string {
  if (review.summary?.trim()) return review.summary.trim();
  const parts = [
    review.scanned ? `${review.scanned} scanned` : null,
    review.scored ? `${review.scored} scored` : null,
    review.converted ? `${review.converted} converted` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : review.key || 'Run';
}

export function buildAgentDailyBrief(
  agent: HiredAgentView,
  t: TFunction,
  locale: string,
  now = Date.now(),
): string {
  const name = getAgentById(agent.id).firstName;
  if (agent.status === 'paused') {
    return t('aiAgents.correlation.daily.briefPaused', { name });
  }

  const recent = reviewsToday(agent.context?.reviews, now);
  if (recent.length > 0) {
    const lines = recent.slice(0, 3).map((review) => {
      const title = reviewTitle(review);
      const when = formatClock(review.at, locale);
      return when ? `• ${title} (${when})` : `• ${title}`;
    });
    return t('aiAgents.correlation.daily.briefWithActivity', {
      name,
      lines: lines.join('\n'),
    });
  }

  if (isTodayLocal(agent.context?.lastRunAt, now)) {
    return t('aiAgents.correlation.daily.briefLastRun', {
      name,
      when: formatClock(agent.context?.lastRunAt, locale),
      plan:
        (agent.context?.lastPlan || agent.context?.lastSummary || '').trim() ||
        t('aiAgents.correlation.daily.noPlan'),
    });
  }

  if (!DAILY_CHAT_AGENTS.includes(agent.id)) {
    return t('aiAgents.correlation.daily.briefNoChat', { name });
  }

  return t('aiAgents.correlation.daily.briefQuiet', { name });
}

export function buildDailyStatusSeed(
  hired: HiredAgentView[],
  t: TFunction,
  locale: string,
  now = Date.now(),
): DailyMeetingMessage[] {
  const at = new Date(now).toISOString();
  const seats = correlationSeatsFor(hired.map((item) => item.id));
  const byId = new Map(hired.map((item) => [item.id, item]));
  const messages: DailyMeetingMessage[] = [
    {
      id: `sys-${now}`,
      kind: 'system',
      content: t('aiAgents.correlation.daily.started', { count: seats.length }),
      at,
    },
  ];

  for (const id of seats) {
    const agent = byId.get(id);
    if (!agent) continue;
    messages.push({
      id: `brief-${id}-${now}`,
      kind: 'agent',
      agentId: id,
      content: buildAgentDailyBrief(agent, t, locale, now),
      at,
    });
  }

  return messages;
}

/** Exact reply token when the question is outside this agent's lane — filtered client-side. */
export const DAILY_NO_REPLY = 'NO_REPLY';

const AGENT_LANE: Record<AgentId, { en: string; es: string }> = {
  sourcing: {
    en: 'sourcing leads, scoring fit, converting leads into candidates/applications',
    es: 'sourcing de leads, scoring de fit, convertir leads en candidatos/aplicaciones',
  },
  campaign: {
    en: 'Meta ad campaigns, daily budget, pause/activate stamped campaigns',
    es: 'campañas Meta, presupuesto diario, pausar/activar campañas selladas',
  },
  screening: {
    en: 'screening outreach by email/WhatsApp, follow-ups, response waits',
    es: 'outreach de screening por email/WhatsApp, follow-ups, esperas de respuesta',
  },
  interview: {
    en: 'interview scheduling, Calendly links, interview stage moves',
    es: 'agendar entrevistas, links de Calendly, mover a etapa de entrevista',
  },
  offer: {
    en: 'offer preparation, sending offers, offer follow-ups',
    es: 'preparar ofertas, enviar ofertas, seguimiento de ofertas',
  },
};

export function detectDailyReplyLanguage(question: string, locale: string): 'es' | 'en' {
  const q = question.trim();
  if (
    /[áéíóúñ¿¡]/i.test(q) ||
    /\b(qué|quien|quién|como|cómo|dónde|donde|cuándo|cuando|tienen|necesito|ayúdame|estatus|estado|puedes|puedo|hay|sobre|quiénes)\b/i.test(
      q,
    )
  ) {
    return 'es';
  }
  return locale.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function isDailyNoReply(text: string): boolean {
  const value = text.trim();
  if (!value) return true;
  if (/^NO_REPLY\b/i.test(value)) return true;
  if (/^no[_ -]?reply\b/i.test(value)) return true;
  if (/^(no (me )?aplica|no tengo (nada|algo) (que|relevante)|fuera de mi (rol|alcance))\b/i.test(value)) {
    return true;
  }
  return false;
}

/**
 * Meeting Q&A framing: answer the question if it touches this agent's lane;
 * otherwise reply exactly NO_REPLY (hidden in the UI).
 */
export function dailyMeetingPrompt(question: string, agentId: AgentId, locale: string): string {
  const lang = detectDailyReplyLanguage(question, locale);
  const name = getAgentById(agentId).firstName;
  const lane = AGENT_LANE[agentId][lang];
  const q = question.trim();

  if (lang === 'es') {
    return [
      `Estás en un Daily Status meeting. Eres ${name}. Tu carril es: ${lane}.`,
      'El lead del equipo hizo UNA pregunta. Debes RESPONDER ESA PREGUNTA (no repitas un status genérico de 24h).',
      'Reglas:',
      `1) Si la pregunta NO tiene que ver con tu carril, responde EXACTAMENTE: ${DAILY_NO_REPLY}`,
      '2) Si SÍ tiene que ver, responde en primera persona, breve (2–5 frases), útil y concreta.',
      '3) Usa español.',
      '4) action debe ser "none". No cambies contexto ni lances un run salvo pedido explícito.',
      `Pregunta: ${q}`,
    ].join('\n');
  }

  return [
    `You are in a Daily Status meeting. You are ${name}. Your lane is: ${lane}.`,
    'The team lead asked ONE question. Answer THAT QUESTION (do not repeat a generic 24h status).',
    'Rules:',
    `1) If the question is NOT about your lane, reply with EXACTLY: ${DAILY_NO_REPLY}`,
    '2) If it is about your lane, answer in first person, briefly (2–5 sentences), concrete and useful.',
    '3) Use English.',
    '4) action must be "none". Do not change context or start a run unless explicitly asked.',
    `Question: ${q}`,
  ].join('\n');
}

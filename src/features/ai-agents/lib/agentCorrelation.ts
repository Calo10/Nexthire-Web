import type { AgentId } from '../models/agentCatalog';

export type AgentCorrelationEdge = {
  id: string;
  from: AgentId;
  to: AgentId;
  /** i18n key under aiAgents.correlation.edges.* */
  labelKey: string;
};

/** Clockwise seat order around the round table. */
export const AGENT_CORRELATION_SEAT_ORDER: AgentId[] = [
  'sourcing',
  'campaign',
  'screening',
  'interview',
  'offer',
];

/** Real product handoffs — only shown when both ends are hired. */
export const AGENT_CORRELATION_EDGES: AgentCorrelationEdge[] = [
  { id: 'aria-vera', from: 'sourcing', to: 'campaign', labelKey: 'sourcingToAds' },
  { id: 'aria-kai', from: 'sourcing', to: 'screening', labelKey: 'sourcedToScreen' },
  { id: 'vera-kai', from: 'campaign', to: 'screening', labelKey: 'adsToScreen' },
  { id: 'kai-lena', from: 'screening', to: 'interview', labelKey: 'screenToInterview' },
  { id: 'lena-mira', from: 'interview', to: 'offer', labelKey: 'interviewToOffer' },
  { id: 'aria-lena', from: 'sourcing', to: 'interview', labelKey: 'sourcedToInterview' },
];

export function correlationEdgesFor(hiredIds: Iterable<AgentId>): AgentCorrelationEdge[] {
  const hired = new Set(hiredIds);
  return AGENT_CORRELATION_EDGES.filter((edge) => hired.has(edge.from) && hired.has(edge.to));
}

/** Hired agents seated in fixed clock order, evenly spaced. */
export function correlationSeatsFor(hiredIds: Iterable<AgentId>): AgentId[] {
  const hired = new Set(hiredIds);
  return AGENT_CORRELATION_SEAT_ORDER.filter((id) => hired.has(id));
}

export function laterIso(a?: string | null, b?: string | null): string | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

import { AGENT_CATALOG, getAgentById, type AgentCatalogItem, type AgentId } from './agentCatalog';
import type { AgentContext, AgentHireStatus, HiredAgent } from '../api/aiAgentsApi';

export type TokenPeriod = '7d' | '30d' | '90d';

export type HiredAgentRecord = {
  agentId: AgentId;
  status: AgentHireStatus;
  runs: number;
  tokens: number;
  workflows: number;
  meetings: number;
  hiredAt: string;
  context: AgentContext | null;
};

export type HiredAgentView = AgentCatalogItem & HiredAgentRecord;

export type TokenEvent = {
  at: string;
  tokens: number;
};

export type AgentHomeAnalytics = {
  totalAgents: number;
  totalAgentsDelta: number;
  activeAgents: number;
  activeAgentsDelta: number;
  runs: number;
  runsDelta: number;
  tokens: number;
  tokensDelta: number;
  workflows: number;
  workflowsDelta: number;
  meetings: number;
  meetingsDelta: number;
  tokenEvents: TokenEvent[];
  status: {
    active: number;
    paused: number;
    inactive: number;
  };
};

export type AgentActivityItem = {
  id: string;
  agentId: AgentId;
  copyKey: string;
  time: string;
  title?: string;
};

export function formatTokenCount(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions >= 10 ? millions.toFixed(1) : millions.toFixed(2).replace(/0$/, '')}M`;
  }
  if (value >= 1_000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

export function formatDelta(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value > 0 ? '+' : ''}${Math.round(value)}%`;
}

export function toHiredView(record: HiredAgent): HiredAgentView {
  return {
    ...getAgentById(record.agentId),
    agentId: record.agentId,
    status: record.status,
    runs: record.runs,
    tokens: record.tokens,
    workflows: 0,
    meetings: 0,
    hiredAt: record.hiredAt,
    context: record.context ?? null,
  };
}

export function deriveAnalytics(
  hired: HiredAgentView[],
  tokenEvents: TokenEvent[] = [],
): AgentHomeAnalytics {
  const totalAgents = hired.length;
  const busyOrActive = hired.filter((item) => item.status === 'active' || item.status === 'busy').length;
  const paused = hired.filter((item) => item.status === 'paused').length;
  const inactive = hired.filter((item) => item.status === 'inactive').length;
  const runs = hired.reduce((sum, item) => sum + item.runs, 0);
  const tokens = hired.reduce((sum, item) => sum + item.tokens, 0);

  return {
    totalAgents,
    totalAgentsDelta: 0,
    activeAgents: busyOrActive,
    activeAgentsDelta: 0,
    runs,
    runsDelta: 0,
    tokens,
    tokensDelta: 0,
    workflows: 0,
    workflowsDelta: 0,
    meetings: 0,
    meetingsDelta: 0,
    tokenEvents,
    status: {
      active: busyOrActive,
      paused,
      inactive,
    },
  };
}

export function deriveHomeActivity(hired: HiredAgentView[]): AgentActivityItem[] {
  const items: AgentActivityItem[] = [];
  for (const agent of hired) {
    const reviews = agent.context?.reviews ?? [];
    for (const [index, review] of reviews.slice(0, 4).entries()) {
      items.push({
        id: `home-${agent.id}-${review.at}-${index}`,
        agentId: agent.id,
        copyKey: 'runSummary',
        time: review.at,
        title:
          review.summary ||
          `Scanned ${review.scanned}, scored ${review.scored}, converted ${review.converted}`,
      });
    }
  }
  return items
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);
}

export function catalogBrowseAvatars(hired: HiredAgentView[]): string[] {
  const fromHired = hired.slice(0, 4).map((agent) => agent.avatar);
  if (fromHired.length >= 4) return fromHired;
  const extra = AGENT_CATALOG.map((agent) => agent.avatar).filter((src) => !fromHired.includes(src));
  return [...fromHired, ...extra].slice(0, 4);
}

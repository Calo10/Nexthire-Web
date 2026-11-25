import { getAgentById, type AgentId, type AgentStatKind, type AgentToolKind } from './agentCatalog';
import type { AgentHireStatus, AgentContext, AriaReview, HiredAgent } from '../api/aiAgentsApi';
import type { HiredAgentView } from './agentHome';
import { toHiredView } from './agentHome';
import { isSameDay, last7Days, weekLabel } from '../lib/dateLabels';

export const AGENT_DETAIL_TABS = ['overview', 'chat', 'activity', 'context', 'knowledge', 'usage'] as const;

export type AgentDetailTab = (typeof AGENT_DETAIL_TABS)[number];

export function isAgentDetailTab(value: string | null | undefined): value is AgentDetailTab {
  return !!value && (AGENT_DETAIL_TABS as readonly string[]).includes(value);
}

export function agentHomePath() {
  return '/app/ai-agents';
}

export type AgentDetailFeedItem = {
  id: string;
  copyKey: string;
  icon: AgentStatKind;
  title?: string;
  meta?: string;
  href?: string;
};

export type AgentUsageSlice = {
  id: string;
  labelKey: string;
  tokens: number;
  color: string;
};

export type AgentDetailDto = {
  agent: HiredAgentView;
  kpis: {
    runs: number;
    runsDelta: number;
    results: number;
    resultsDelta: number;
    tokens: number;
    tokensDelta: number;
    workflows: number;
    workflowsDelta: number;
    resultsHint?: string;
  };
  trend: {
    labels: string[];
    runs: number[];
    results: number[];
  };
  tools: { id: string; kind: AgentToolKind; connected: boolean }[];
  destinations: { id: string; href: string; pending?: boolean }[];
  timeline: AgentDetailFeedItem[];
  usage: AgentUsageSlice[];
};

function destinationsFor(agentId: AgentId, context: AgentContext | null | undefined) {
  if (agentId === 'sourcing') {
    return [
      { id: 'sourcing', href: '/app/sourcing' },
      { id: 'candidates', href: '/app/candidates' },
      { id: 'pipeline', href: '/app/pipeline' },
      {
        id: 'job',
        href: context?.jobId ? `/app/jobs` : '/app/jobs',
        pending: !context?.jobId,
      },
    ];
  }
  if (agentId === 'campaign') {
    return [
      { id: 'campaigns', href: '/app/sourcing?tab=campaigns' },
      { id: 'sourcing', href: '/app/sourcing' },
      { id: 'jobs', href: '/app/jobs' },
    ];
  }
  if (agentId === 'screening' || agentId === 'interview' || agentId === 'offer') {
    return [
      { id: 'pipeline', href: '/app/pipeline' },
      { id: 'candidates', href: '/app/candidates' },
      { id: 'templates', href: '/app/templates' },
      { id: 'whatsapp', href: '/app/whatsapp' },
    ];
  }
  return [
    { id: 'pipeline', href: '/app/pipeline' },
    { id: 'candidates', href: '/app/candidates' },
  ];
}

function usageSlices(tokens: number, chatTokens = 0, agentId?: AgentId): AgentUsageSlice[] {
  const chat = Math.max(0, chatTokens);
  const work = Math.max(0, tokens - chat);
  if (agentId === 'campaign') {
    const create = Math.round(work * 0.85);
    const sync = Math.max(0, work - create);
    return [
      { id: 'create', labelKey: 'create', tokens: create, color: '#7C3AED' },
      { id: 'sync', labelKey: 'sync', tokens: sync, color: '#38BDF8' },
      { id: 'chat', labelKey: 'chat', tokens: chat, color: '#0EA5E9' },
    ].filter((slice) => slice.tokens > 0 || slice.id !== 'chat');
  }
  if (agentId === 'screening') {
    const outreach = Math.round(work * 0.7);
    const followups = Math.max(0, work - outreach);
    return [
      { id: 'outreach', labelKey: 'outreach', tokens: outreach, color: '#7C3AED' },
      { id: 'followups', labelKey: 'followups', tokens: followups, color: '#38BDF8' },
      { id: 'chat', labelKey: 'chat', tokens: chat, color: '#0EA5E9' },
    ].filter((slice) => slice.tokens > 0 || slice.id !== 'chat');
  }
  if (agentId === 'interview') {
    const invites = Math.round(work * 0.7);
    const reminders = Math.max(0, work - invites);
    return [
      { id: 'invites', labelKey: 'invites', tokens: invites, color: '#7C3AED' },
      { id: 'reminders', labelKey: 'reminders', tokens: reminders, color: '#38BDF8' },
      { id: 'chat', labelKey: 'chat', tokens: chat, color: '#0EA5E9' },
    ].filter((slice) => slice.tokens > 0 || slice.id !== 'chat');
  }
  if (agentId === 'offer') {
    const offers = Math.round(work * 0.7);
    const followups = Math.max(0, work - offers);
    return [
      { id: 'offers', labelKey: 'offers', tokens: offers, color: '#7C3AED' },
      { id: 'followups', labelKey: 'followups', tokens: followups, color: '#38BDF8' },
      { id: 'chat', labelKey: 'chat', tokens: chat, color: '#0EA5E9' },
    ].filter((slice) => slice.tokens > 0 || slice.id !== 'chat');
  }
  const scoring = Math.round(work * 0.7);
  const convert = Math.max(0, work - scoring);
  return [
    { id: 'scoring', labelKey: 'scoring', tokens: scoring, color: '#7C3AED' },
    { id: 'convert', labelKey: 'convert', tokens: convert, color: '#38BDF8' },
    { id: 'chat', labelKey: 'chat', tokens: chat, color: '#0EA5E9' },
  ].filter((slice) => slice.tokens > 0 || slice.id !== 'chat');
}

function reviewsOf(context: AgentContext | null | undefined): AriaReview[] {
  return Array.isArray(context?.reviews) ? context!.reviews! : [];
}

function timelineFromReviews(reviews: AriaReview[], agentId?: AgentId): AgentDetailFeedItem[] {
  const href =
    agentId === 'screening' || agentId === 'interview' || agentId === 'offer'
      ? '/app/pipeline'
      : agentId === 'campaign'
        ? '/app/sourcing?tab=campaigns'
        : '/app/sourcing';
  return reviews.slice(0, 10).map((review, index) => ({
    id: `review-${review.at}-${index}`,
    copyKey: 'lastRun',
    icon: review.converted > 0 ? 'users' : review.errors > 0 ? 'refresh' : 'bolt',
    title:
      review.summary ||
      `Scanned ${review.scanned}, scored ${review.scored}, converted ${review.converted}`,
    meta: review.at,
    href,
  }));
}

export function buildHiredView(hired: HiredAgent): HiredAgentView {
  return toHiredView(hired);
}

export function deriveAgentDetail(hired: HiredAgent): AgentDetailDto {
  const agent = buildHiredView(hired);
  const catalog = getAgentById(agent.id);
  const reviews = reviewsOf(hired.context);
  const days = last7Days();
  const reviewsLast7 = reviews.filter((review) => days.some((day) => isSameDay(review.at, day)));
  const results =
    hired.context?.convertedCandidates ??
    reviews.reduce((sum, review) => sum + (review.converted || 0), 0);
  const resultsLast7 = reviewsLast7.reduce((sum, review) => sum + (review.converted || 0), 0);
  const runsLast7 = reviewsLast7.length;
  const priorWindow = last7Days(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const runsPrior = reviews.filter((review) => priorWindow.some((day) => isSameDay(review.at, day))).length;
  const resultsPrior = reviews
    .filter((review) => priorWindow.some((day) => isSameDay(review.at, day)))
    .reduce((sum, review) => sum + (review.converted || 0), 0);

  const reviewTimeline = timelineFromReviews(reviews, agent.id);
  const timeline =
    reviewTimeline.length > 0
      ? reviewTimeline
      : hired.context?.lastSummary
        ? [
            {
              id: 'last-run',
              copyKey: 'lastRun',
              icon: 'bolt' as AgentStatKind,
              title: hired.context.lastSummary,
              meta: hired.context.lastRunAt || undefined,
              href:
                agent.id === 'screening'
                  ? '/app/pipeline'
                  : agent.id === 'campaign'
                    ? '/app/sourcing?tab=campaigns'
                    : '/app/sourcing',
            },
          ]
        : [];

  return {
    agent: {
      ...agent,
      ...catalog,
      status: hired.status as AgentHireStatus,
      runs: hired.runs,
      tokens: hired.tokens,
      context: hired.context ?? null,
    },
    kpis: {
      runs: hired.runs,
      runsDelta: runsPrior > 0 ? ((runsLast7 - runsPrior) / runsPrior) * 100 : runsLast7 > 0 ? 100 : 0,
      results,
      resultsDelta:
        resultsPrior > 0 ? ((resultsLast7 - resultsPrior) / resultsPrior) * 100 : resultsLast7 > 0 ? 100 : 0,
      tokens: hired.tokens,
      tokensDelta: 0,
      workflows: 0,
      workflowsDelta: 0,
      resultsHint: resultsLast7 === 0 && results === 0 ? undefined : `+${resultsLast7} last 7d`,
    },
    trend: {
      labels: days.map((day) => weekLabel(day)),
      runs: days.map((day) => reviews.filter((review) => isSameDay(review.at, day)).length),
      results: days.map((day) =>
        reviews
          .filter((review) => isSameDay(review.at, day))
          .reduce((sum, review) => sum + (review.converted || 0), 0),
      ),
    },
    tools: catalog.tools.map((tool) => ({ ...tool, connected: true })),
    destinations: destinationsFor(agent.id, hired.context),
    timeline,
    usage: usageSlices(hired.tokens, hired.context?.chatTokens ?? 0, agent.id),
  };
}

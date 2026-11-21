import { apiClient } from '../../../lib/api';
import { isAgentId, type AgentId } from '../models/agentCatalog';

export type AgentHireStatus = 'active' | 'paused' | 'busy' | 'inactive';

export type AriaReview = {
  key: string;
  scanned: number;
  scored: number;
  converted: number;
  quota: number;
  skipped: number;
  errors: number;
  tokens: number;
  next?: string;
  summary?: string;
  at: string;
};

export type AgentContext = {
  jobId?: string | null;
  stageId?: string | null;
  cadence?: string;
  channel?: string;
  templateId?: string;
  responseWaitHours?: number;
  maxProcessed?: number;
  autoConversionPercent?: number;
  maxOffersToSend?: number;
  notes?: string;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  lastPlan?: string;
  lastSummary?: string;
  chatTokens?: number;
  reviews?: AriaReview[];
  convertedCandidates?: number;
  campaignDailyBudget?: number;
  campaignDesiredStatus?: string;
  campaignDestinationUrl?: string;
  campaignCountryCode?: string;
  campaigns?: {
    campaignId: string;
    jobId?: string | null;
    platform: string;
    name: string;
    status: string;
    action: string;
    at: string;
  }[];
  outreach?: {
    candidateId: string;
    applicationId?: string | null;
    channel: string;
    action: string;
    at: string;
  }[];
};

export type TokenUsageEvent = {
  at: string;
  tokens: number;
  agentId?: string | null;
  source?: string;
};

export type AgentTokenUsage = {
  total: number;
  events: TokenUsageEvent[];
};

export type HiredAgent = {
  id: string;
  agentId: AgentId;
  status: AgentHireStatus;
  runs: number;
  tokens: number;
  hiredAt: string;
  context?: AgentContext | null;
};

export type CatalogHire = {
  agentId: AgentId;
  availability: string;
  hireable: boolean;
  hired: boolean;
  hiredAt?: string | null;
};

export type AgentChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  at?: string;
};

type AgentChatReply = {
  reply: string;
  action: string;
  messages: AgentChatMessage[];
  agent: HiredAgent | null;
};

function toChatMessages(items: AgentChatMessage[] | null | undefined): AgentChatMessage[] {
  if (!Array.isArray(items)) return [];
  return items.filter(
    (item): item is AgentChatMessage =>
      !!item &&
      (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string' &&
      item.content.trim().length > 0,
  );
}

function mapChatMessage(raw: unknown): AgentChatMessage | null {
  const item = asRecord(raw);
  const roleRaw = text(item.role ?? item.Role).toLowerCase();
  const role = roleRaw === 'assistant' ? 'assistant' : roleRaw === 'user' ? 'user' : null;
  const content = text(item.content ?? item.Content).trim();
  if (!role || !content) return null;
  return {
    role,
    content,
    at: text(item.at ?? item.At) || undefined,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function text(value: unknown) {
  return value == null ? '' : String(value);
}

function mapReview(raw: unknown): AriaReview | null {
  const item = asRecord(raw);
  const at = text(item.at ?? item.At);
  if (!at) return null;
  return {
    key: text(item.key ?? item.Key) || 'score+convert',
    scanned: Number(item.scanned ?? item.Scanned ?? 0) || 0,
    scored: Number(item.scored ?? item.Scored ?? 0) || 0,
    converted: Number(item.converted ?? item.Converted ?? 0) || 0,
    quota: Number(item.quota ?? item.Quota ?? 0) || 0,
    skipped: Number(item.skipped ?? item.Skipped ?? 0) || 0,
    errors: Number(item.errors ?? item.Errors ?? 0) || 0,
    tokens: Number(item.tokens ?? item.Tokens ?? 0) || 0,
    next: text(item.next ?? item.Next) || undefined,
    summary: text(item.summary ?? item.Summary) || undefined,
    at,
  };
}

function mapContext(raw: unknown): AgentContext | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = asRecord(raw);
  const jobId = text(item.jobId ?? item.JobId).trim();
  const reviewsRaw = Array.isArray(item.reviews)
    ? item.reviews
    : Array.isArray(item.Reviews)
      ? item.Reviews
      : [];
  const stageId = text(item.stageId ?? item.StageId).trim();
  return {
    jobId: jobId || null,
    stageId: stageId || null,
    cadence: text(item.cadence ?? item.Cadence) || 'daily',
    channel: text(item.channel ?? item.Channel) || 'email',
    templateId: text(item.templateId ?? item.TemplateId),
    responseWaitHours: Number(item.responseWaitHours ?? item.ResponseWaitHours ?? 48) || 48,
    maxProcessed: Number(item.maxProcessed ?? item.MaxProcessed ?? 100) || 100,
    autoConversionPercent: Number(item.autoConversionPercent ?? item.AutoConversionPercent ?? 10) || 10,
    maxOffersToSend: Number(item.maxOffersToSend ?? item.MaxOffersToSend ?? 10) || 10,
    notes: text(item.notes ?? item.Notes),
    lastRunAt: text(item.lastRunAt ?? item.LastRunAt) || null,
    nextRunAt: text(item.nextRunAt ?? item.NextRunAt) || null,
    lastPlan: text(item.lastPlan ?? item.LastPlan),
    lastSummary: text(item.lastSummary ?? item.LastSummary),
    chatTokens: Number(item.chatTokens ?? item.ChatTokens ?? 0) || 0,
    reviews: reviewsRaw.map(mapReview).filter((review): review is AriaReview => review != null),
    convertedCandidates: Number(item.convertedCandidates ?? item.ConvertedCandidates ?? 0) || 0,
    campaignDailyBudget: Number(item.campaignDailyBudget ?? item.CampaignDailyBudget ?? 10) || 10,
    campaignDesiredStatus: text(item.campaignDesiredStatus ?? item.CampaignDesiredStatus) || 'paused',
    campaignDestinationUrl: text(item.campaignDestinationUrl ?? item.CampaignDestinationUrl),
    campaignCountryCode: text(item.campaignCountryCode ?? item.CampaignCountryCode) || 'US',
    campaigns: (Array.isArray(item.campaigns) ? item.campaigns : Array.isArray(item.Campaigns) ? item.Campaigns : [])
      .map((row) => {
        const campaign = asRecord(row);
        const campaignId = text(campaign.campaignId ?? campaign.CampaignId);
        const at = text(campaign.at ?? campaign.At);
        if (!campaignId || !at) return null;
        return {
          campaignId,
          jobId: text(campaign.jobId ?? campaign.JobId) || null,
          platform: text(campaign.platform ?? campaign.Platform) || 'meta',
          name: text(campaign.name ?? campaign.Name),
          status: text(campaign.status ?? campaign.Status) || 'paused',
          action: text(campaign.action ?? campaign.Action) || 'created',
          at,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null),
    outreach: (Array.isArray(item.outreach) ? item.outreach : Array.isArray(item.Outreach) ? item.Outreach : [])
      .map((row) => {
        const outreach = asRecord(row);
        const candidateId = text(outreach.candidateId ?? outreach.CandidateId);
        const at = text(outreach.at ?? outreach.At);
        if (!candidateId || !at) return null;
        return {
          candidateId,
          applicationId: text(outreach.applicationId ?? outreach.ApplicationId) || null,
          channel: text(outreach.channel ?? outreach.Channel) || 'email',
          action: text(outreach.action ?? outreach.Action) || 'intro',
          at,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null),
  };
}

function mapHired(raw: unknown): HiredAgent | null {
  const item = asRecord(raw);
  const agentId = text(item.agentId ?? item.AgentId).trim();
  if (!isAgentId(agentId)) return null;
  const statusRaw = text(item.status ?? item.Status).toLowerCase() || 'active';
  const status = (['active', 'paused', 'busy', 'inactive'].includes(statusRaw)
    ? statusRaw
    : 'active') as AgentHireStatus;
  return {
    id: text(item.id ?? item.Id),
    agentId,
    status,
    runs: Number(item.runs ?? item.Runs ?? 0) || 0,
    tokens: Number(item.tokens ?? item.Tokens ?? 0) || 0,
    hiredAt: text(item.hiredAt ?? item.HiredAt),
    context: mapContext(item.context ?? item.Context),
  };
}

function mapCatalog(raw: unknown): CatalogHire | null {
  const item = asRecord(raw);
  const agentId = text(item.agentId ?? item.AgentId).trim();
  if (!isAgentId(agentId)) return null;
  return {
    agentId,
    availability: text(item.availability ?? item.Availability) || 'v1',
    hireable: Boolean(item.hireable ?? item.Hireable),
    hired: Boolean(item.hired ?? item.Hired),
    hiredAt: text(item.hiredAt ?? item.HiredAt) || null,
  };
}

export const aiAgentsApi = {
  listHired: async (): Promise<HiredAgent[]> => {
    const raw = await apiClient.get<unknown>('/ai-agents', true);
    if (!Array.isArray(raw)) return [];
    return raw.map(mapHired).filter((item): item is HiredAgent => item != null);
  },

  getCatalog: async (): Promise<CatalogHire[]> => {
    const raw = await apiClient.get<unknown>('/ai-agents/catalog', true);
    if (!Array.isArray(raw)) return [];
    return raw.map(mapCatalog).filter((item): item is CatalogHire => item != null);
  },

  get: async (agentId: AgentId): Promise<HiredAgent | null> => {
    try {
      return mapHired(await apiClient.get<unknown>(`/ai-agents/${encodeURIComponent(agentId)}`, true));
    } catch (e) {
      const err = e as { status?: number };
      if (err?.status === 404) return null;
      throw e;
    }
  },

  hire: async (agentId: AgentId): Promise<HiredAgent> => {
    const hired = mapHired(await apiClient.post<unknown>(`/ai-agents/${encodeURIComponent(agentId)}/hire`, {}, true));
    if (!hired) throw new Error('Invalid hire response');
    return hired;
  },

  unhire: async (agentId: AgentId): Promise<void> => {
    await apiClient.delete(`/ai-agents/${encodeURIComponent(agentId)}`, true);
  },

  setStatus: async (agentId: AgentId, status: AgentHireStatus): Promise<HiredAgent> => {
    const hired = mapHired(
      await apiClient.patch<unknown>(`/ai-agents/${encodeURIComponent(agentId)}/status`, { status }, true)
    );
    if (!hired) throw new Error('Invalid status response');
    return hired;
  },

  updateContext: async (agentId: AgentId, context: AgentContext): Promise<HiredAgent> => {
    const hired = mapHired(
      await apiClient.patch<unknown>(`/ai-agents/${encodeURIComponent(agentId)}/context`, context, true)
    );
    if (!hired) throw new Error('Invalid context response');
    return hired;
  },

  run: async (agentId: AgentId): Promise<HiredAgent> => {
    const hired = mapHired(await apiClient.post<unknown>(`/ai-agents/${encodeURIComponent(agentId)}/run`, {}, true));
    if (!hired) throw new Error('Invalid run response');
    return hired;
  },

  listChat: async (agentId: AgentId): Promise<AgentChatMessage[]> => {
    const raw = await apiClient.get<unknown>(`/ai-agents/${encodeURIComponent(agentId)}/chat`, true);
    const item = asRecord(raw);
    const list = Array.isArray(item.messages)
      ? item.messages
      : Array.isArray(item.Messages)
        ? item.Messages
        : [];
    return list.map(mapChatMessage).filter((msg): msg is AgentChatMessage => msg != null);
  },

  chat: async (
    agentId: AgentId,
    body: { messages: { role: 'user' | 'assistant'; content: string }[]; locale?: string },
  ): Promise<AgentChatReply> => {
    const raw = await apiClient.post<unknown>(`/ai-agents/${encodeURIComponent(agentId)}/chat`, body, true);
    const item = asRecord(raw);
    const messagesRaw = Array.isArray(item.messages)
      ? item.messages
      : Array.isArray(item.Messages)
        ? item.Messages
        : [];
    return {
      reply: text(item.reply ?? item.Reply),
      action: text(item.action ?? item.Action) || 'none',
      messages: toChatMessages(
        messagesRaw.map(mapChatMessage).filter((msg): msg is AgentChatMessage => msg != null),
      ),
      agent: mapHired(item.agent ?? item.Agent),
    };
  },

  getUsage: async (days = 90): Promise<AgentTokenUsage> => {
    const raw = await apiClient.get<unknown>(`/ai-agents/usage?days=${encodeURIComponent(String(days))}`, true);
    const item = asRecord(raw);
    const eventsRaw = Array.isArray(item.events)
      ? item.events
      : Array.isArray(item.Events)
        ? item.Events
        : [];
    return {
      total: Number(item.total ?? item.Total ?? 0) || 0,
      events: eventsRaw.map((event) => {
        const row = asRecord(event);
        return {
          at: text(row.at ?? row.At),
          tokens: Number(row.tokens ?? row.Tokens ?? 0) || 0,
          agentId: text(row.agentId ?? row.AgentId) || null,
          source: text(row.source ?? row.Source) || undefined,
        };
      }),
    };
  },
};

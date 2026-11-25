export const AGENT_IDS = ['sourcing', 'campaign', 'screening', 'interview', 'offer'] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export type AgentAvailability = 'v1' | 'future';

export type AgentToolKind =
  | 'crm'
  | 'pipeline'
  | 'email'
  | 'whatsapp'
  | 'meta'
  | 'jobs'
  | 'templates'
  | 'calendly'
  | 'lists'
  | 'workflows';

export type AgentStatKind =
  | 'search'
  | 'users'
  | 'list'
  | 'bolt'
  | 'score'
  | 'fire'
  | 'route'
  | 'mail'
  | 'reply'
  | 'calendar'
  | 'refresh'
  | 'workflow';

export type AgentCatalogItem = {
  id: AgentId;
  firstName: string;
  roleKey: string;
  avatar: string;
  avatarBg: string;
  availability: AgentAvailability;
  stats: { id: string; icon: AgentStatKind }[];
  tools: { id: string; kind: AgentToolKind }[];
  outputs: { id: string }[];
  knowledge: { id: string }[];
};

export const AGENT_CATALOG: AgentCatalogItem[] = [
  {
    id: 'sourcing',
    firstName: 'Aria',
    roleKey: 'sourcing',
    avatar: '/agents/sourcing.jpg',
    avatarBg: 'bg-gradient-to-b from-[#E4D4FF] to-[#F3ECFF]',
    availability: 'v1',
    stats: [
      { id: 'processed', icon: 'search' },
      { id: 'scored', icon: 'score' },
      { id: 'converted', icon: 'users' },
    ],
    tools: [
      { id: 'inbox', kind: 'lists' },
      { id: 'jobs', kind: 'jobs' },
      { id: 'pipeline', kind: 'pipeline' },
      { id: 'fit', kind: 'workflows' },
    ],
    outputs: [{ id: 'candidates' }, { id: 'applications' }, { id: 'summary' }],
    knowledge: [{ id: 'job' }, { id: 'conversion' }, { id: 'fit' }],
  },
  {
    id: 'campaign',
    firstName: 'Vera',
    roleKey: 'campaign',
    avatar: '/agents/campaign.jpg',
    avatarBg: 'bg-gradient-to-b from-[#F5C2D1] to-[#FDECF1]',
    availability: 'v1',
    stats: [
      { id: 'created', icon: 'bolt' },
      { id: 'active', icon: 'fire' },
      { id: 'leads', icon: 'users' },
    ],
    tools: [
      { id: 'meta', kind: 'meta' },
      { id: 'jobs', kind: 'jobs' },
      { id: 'pipeline', kind: 'pipeline' },
    ],
    outputs: [{ id: 'campaigns' }, { id: 'sync' }, { id: 'leads' }],
    knowledge: [{ id: 'platforms' }, { id: 'budget' }, { id: 'jobs' }],
  },
  {
    id: 'screening',
    firstName: 'Kai',
    roleKey: 'screening',
    avatar: '/agents/screening.jpg',
    avatarBg: 'bg-gradient-to-b from-[#BFDFFF] to-[#E8F3FF]',
    availability: 'v1',
    stats: [
      { id: 'outreach', icon: 'mail' },
      { id: 'followups', icon: 'refresh' },
      { id: 'replies', icon: 'reply' },
    ],
    tools: [
      { id: 'email', kind: 'email' },
      { id: 'whatsapp', kind: 'whatsapp' },
      { id: 'templates', kind: 'templates' },
      { id: 'pipeline', kind: 'pipeline' },
    ],
    outputs: [{ id: 'sequences' }, { id: 'replies' }, { id: 'summary' }],
    knowledge: [{ id: 'templates' }, { id: 'cadence' }, { id: 'channel' }],
  },
  {
    id: 'interview',
    firstName: 'Lena',
    roleKey: 'interview',
    avatar: '/agents/interview.jpg',
    avatarBg: 'bg-gradient-to-b from-[#FFD4B8] to-[#FFEFE4]',
    availability: 'v1',
    stats: [
      { id: 'scheduled', icon: 'calendar' },
      { id: 'reminders', icon: 'mail' },
      { id: 'advanced', icon: 'route' },
    ],
    tools: [
      { id: 'email', kind: 'email' },
      { id: 'whatsapp', kind: 'whatsapp' },
      { id: 'calendly', kind: 'calendly' },
      { id: 'pipeline', kind: 'pipeline' },
    ],
    outputs: [{ id: 'invites' }, { id: 'reminders' }, { id: 'summary' }],
    knowledge: [{ id: 'templates' }, { id: 'calendar' }, { id: 'stages' }],
  },
  {
    id: 'offer',
    firstName: 'Mira',
    roleKey: 'offer',
    avatar: '/agents/offer.jpg',
    avatarBg: 'bg-gradient-to-b from-[#B7E8C9] to-[#E6F7EC]',
    availability: 'v1',
    stats: [
      { id: 'sent', icon: 'mail' },
      { id: 'tracked', icon: 'list' },
      { id: 'accepted', icon: 'score' },
    ],
    tools: [
      { id: 'email', kind: 'email' },
      { id: 'templates', kind: 'templates' },
      { id: 'pipeline', kind: 'pipeline' },
    ],
    outputs: [{ id: 'offers' }, { id: 'followups' }, { id: 'summary' }],
    knowledge: [{ id: 'templates' }, { id: 'volume' }, { id: 'stages' }],
  },
];

export const DEFAULT_AGENT_ID: AgentId = 'sourcing';

export function isAgentId(value: string | null | undefined): value is AgentId {
  return !!value && (AGENT_IDS as readonly string[]).includes(value);
}

export function getAgentById(id: AgentId): AgentCatalogItem {
  return AGENT_CATALOG.find((item) => item.id === id) ?? AGENT_CATALOG[0];
}

export function agentDetailPath(id: AgentId) {
  return `/app/ai-agents/${encodeURIComponent(id)}`;
}

export function agentCatalogPath(agentId?: AgentId) {
  return agentId ? `/app/ai-agents/catalog?agent=${encodeURIComponent(agentId)}` : '/app/ai-agents/catalog';
}

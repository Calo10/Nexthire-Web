export const HR_AGENT_IDS = ['onboarding', 'employees', 'compliance', 'offboarding', 'analytics'] as const;

export type HrAgentId = (typeof HR_AGENT_IDS)[number];

export type HrAgentAvailability = 'v1' | 'future';

export type HrAgentCatalogItem = {
  id: HrAgentId;
  firstName: string;
  roleKey: string;
  avatar: string;
  avatarBg: string;
  availability: HrAgentAvailability;
  /** Short capability chips shown on the detail rail. */
  capabilities: string[];
};

export const HR_AGENT_CATALOG: HrAgentCatalogItem[] = [
  {
    id: 'onboarding',
    firstName: 'Nora',
    roleKey: 'onboarding',
    avatar: '/agents-hr/onboarding.jpg',
    avatarBg: 'bg-gradient-to-b from-[#B7E8C9] to-[#E6F7EC]',
    availability: 'v1',
    capabilities: ['checklists', 'reminders', 'templates'],
  },
  {
    id: 'employees',
    firstName: 'Pax',
    roleKey: 'employees',
    avatar: '/agents-hr/employees.jpg',
    avatarBg: 'bg-gradient-to-b from-[#BFDFFF] to-[#E8F3FF]',
    availability: 'v1',
    capabilities: ['directory', 'updates', 'routing'],
  },
  {
    id: 'compliance',
    firstName: 'Cora',
    roleKey: 'compliance',
    avatar: '/agents-hr/compliance.jpg',
    avatarBg: 'bg-gradient-to-b from-[#E4D4FF] to-[#F3ECFF]',
    availability: 'v1',
    capabilities: ['documents', 'expirations', 'requests'],
  },
  {
    id: 'offboarding',
    firstName: 'Rhea',
    roleKey: 'offboarding',
    avatar: '/agents-hr/offboarding.jpg',
    avatarBg: 'bg-gradient-to-b from-[#FFD4B8] to-[#FFEFE4]',
    availability: 'v1',
    capabilities: ['clearance', 'assets', 'access'],
  },
  {
    id: 'analytics',
    firstName: 'Atlas',
    roleKey: 'analytics',
    avatar: '/agents-hr/analytics.jpg',
    avatarBg: 'bg-gradient-to-b from-[#F5C2D1] to-[#FDECF1]',
    availability: 'v1',
    capabilities: ['insights', 'reports', 'trends'],
  },
];

export const DEFAULT_HR_AGENT_ID: HrAgentId = 'onboarding';

export function isHrAgentId(value: string | null | undefined): value is HrAgentId {
  return !!value && (HR_AGENT_IDS as readonly string[]).includes(value);
}

export function getHrAgentById(id: HrAgentId): HrAgentCatalogItem {
  return HR_AGENT_CATALOG.find((item) => item.id === id) ?? HR_AGENT_CATALOG[0];
}

export function hrAgentHomePath() {
  return '/app/hr/ai-agents';
}

export function hrAgentCatalogPath(agentId?: HrAgentId) {
  return agentId
    ? `/app/hr/ai-agents/catalog?agent=${encodeURIComponent(agentId)}`
    : '/app/hr/ai-agents/catalog';
}

export function hrAgentDetailPath(id: HrAgentId) {
  return `/app/hr/ai-agents/${encodeURIComponent(id)}`;
}

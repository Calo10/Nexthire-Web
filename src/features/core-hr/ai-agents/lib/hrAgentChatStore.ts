import { HR_AGENT_IDS, type HrAgentId } from '../models/hrAgentCatalog';

export type HrChatMessage = { role: 'user' | 'assistant'; content: string };

const STORAGE_KEY = 'nexthire.coreHr.aiAgents.chat.v1';

type ChatMap = Partial<Record<HrAgentId, HrChatMessage[]>>;

function readAll(): ChatMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as ChatMap;
  } catch {
    return {};
  }
}

function writeAll(map: ChatMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function listHrAgentChat(agentId: HrAgentId): HrChatMessage[] {
  return readAll()[agentId] ?? [];
}

export function saveHrAgentChat(agentId: HrAgentId, messages: HrChatMessage[]) {
  const map = readAll();
  map[agentId] = messages;
  writeAll(map);
}

/** Lightweight local reply until Core HR agent chat API exists. */
export function replyHrAgentChat(agentId: HrAgentId, userText: string, firstName: string): string {
  const text = userText.trim().toLowerCase();
  if (!(HR_AGENT_IDS as readonly string[]).includes(agentId)) {
    return `${firstName} here — I'm standing by.`;
  }

  if (agentId === 'onboarding') {
    if (text.includes('stuck') || text.includes('atras')) {
      return `${firstName} here — I'll flag stalled onboarding tasks and nudge owners. Want me to prioritize a department?`;
    }
    if (text.includes('checklist') || text.includes('lista')) {
      return `${firstName} here — I can review open checklists and send reminders for incomplete day-one items.`;
    }
    return `${firstName} here — I keep new-hire checklists and reminders on track. Ask me about stalled tasks or welcome templates.`;
  }
  if (agentId === 'employees') {
    if (text.includes('missing') || text.includes('falt')) {
      return `${firstName} here — I can surface employees with incomplete profiles and route updates to the right owners.`;
    }
    return `${firstName} here — I watch the directory for gaps and profile updates. What should I prioritize?`;
  }
  if (agentId === 'compliance') {
    if (text.includes('expir') || text.includes('vencenc')) {
      return `${firstName} here — I'll list documents nearing expiration and open renewal requests.`;
    }
    return `${firstName} here — I track expirations and compliance gaps. Ask me about contracts, IDs, or certifications.`;
  }
  if (agentId === 'offboarding') {
    if (text.includes('access') || text.includes('acces') || text.includes('asset')) {
      return `${firstName} here — I'll check clearance, assets, and access revocation for open exits.`;
    }
    return `${firstName} here — I orchestrate exit checklists so offboarding closes cleanly. What case should I review?`;
  }
  // analytics
  if (text.includes('turnover') || text.includes('rotac') || text.includes('headcount')) {
    return `${firstName} here — I can summarize headcount movement and highlight trends for leadership.`;
  }
  return `${firstName} here — I turn people metrics into insights. Ask me about headcount, turnover, or report-ready summaries.`;
}

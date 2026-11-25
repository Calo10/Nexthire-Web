import { HR_AGENT_IDS, type HrAgentId } from '../models/hrAgentCatalog';

const STORAGE_KEY = 'nexthire.coreHr.aiAgents.hired.v1';

export type HrAgentHireStatus = 'active' | 'paused' | 'busy' | 'inactive';

export type HrHiredAgentRecord = {
  agentId: HrAgentId;
  status: HrAgentHireStatus;
  runs: number;
  tokens: number;
  hiredAt: string;
};

function readAll(): HrHiredAgentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is HrHiredAgentRecord => {
      if (!row || typeof row !== 'object') return false;
      const id = (row as HrHiredAgentRecord).agentId;
      return typeof id === 'string' && (HR_AGENT_IDS as readonly string[]).includes(id);
    });
  } catch {
    return [];
  }
}

function writeAll(rows: HrHiredAgentRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function listHrHiredAgents(): HrHiredAgentRecord[] {
  return readAll();
}

export function isHrAgentHired(agentId: HrAgentId): boolean {
  return readAll().some((row) => row.agentId === agentId);
}

export function hireHrAgent(agentId: HrAgentId): HrHiredAgentRecord {
  const rows = readAll();
  const existing = rows.find((row) => row.agentId === agentId);
  if (existing) return existing;
  const next: HrHiredAgentRecord = {
    agentId,
    status: 'active',
    runs: 0,
    tokens: 0,
    hiredAt: new Date().toISOString(),
  };
  writeAll([...rows, next]);
  return next;
}

export function removeHrAgent(agentId: HrAgentId): void {
  writeAll(readAll().filter((row) => row.agentId !== agentId));
}

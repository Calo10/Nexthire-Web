import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { whatsappApi } from '../api/whatsappApi';
import { useAuth } from '../contexts/AuthContext';
import { resolveTenantId } from '../lib/resolveTenantId';

type UnreadSnapshot = {
  conversationCount: number;
  byCandidateId: ReadonlyMap<string, number>;
  byPhoneDigits: ReadonlyMap<string, number>;
};

const emptySnapshot: UnreadSnapshot = {
  conversationCount: 0,
  byCandidateId: new Map(),
  byPhoneDigits: new Map(),
};

let snapshot: UnreadSnapshot = emptySnapshot;
let activeTenantId = '';
let pollTimer: number | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function phoneDigits(phone: string | null | undefined) {
  return String(phone || '').replace(/\D/g, '');
}

async function refresh(tenantId: string) {
  if (!tenantId) {
    snapshot = emptySnapshot;
    emit();
    return;
  }
  try {
    const rows = await whatsappApi.listConversations(tenantId);
    const byCandidateId = new Map<string, number>();
    const byPhoneDigits = new Map<string, number>();
    let conversationCount = 0;
    for (const row of rows) {
      const unread = row.unreadCount ?? 0;
      if (unread <= 0) continue;
      conversationCount += 1;
      const candidateId = String(row.candidateId || '').trim();
      if (candidateId) {
        byCandidateId.set(candidateId, (byCandidateId.get(candidateId) ?? 0) + unread);
        continue;
      }
      const digits = phoneDigits(row.phoneNumber);
      if (digits) byPhoneDigits.set(digits, (byPhoneDigits.get(digits) ?? 0) + unread);
    }
    snapshot = { conversationCount, byCandidateId, byPhoneDigits };
    emit();
  } catch {
    // Keep the last snapshot if the inbox request fails.
  }
}

function requestRefresh(tenantId: string) {
  if (inflight) return inflight;
  inflight = refresh(tenantId).finally(() => {
    inflight = null;
  });
  return inflight;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (pollTimer == null) {
    if (activeTenantId) void requestRefresh(activeTenantId);
    pollTimer = window.setInterval(() => {
      if (activeTenantId) void requestRefresh(activeTenantId);
    }, 8000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && pollTimer != null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

function getSnapshot() {
  return snapshot;
}

export function useWhatsAppUnread() {
  const { org, isAuthenticated, isLoading } = useAuth();
  const tenantId = useMemo(
    () => (isAuthenticated && !isLoading ? resolveTenantId(org).trim() : ''),
    [isAuthenticated, isLoading, org]
  );
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (tenantId === activeTenantId) return;
    activeTenantId = tenantId;
    void requestRefresh(tenantId);
  }, [tenantId]);

  return data;
}

export function useWhatsAppUnreadConversationCount() {
  return useWhatsAppUnread().conversationCount;
}

export function unreadCountForCandidate(
  unread: UnreadSnapshot,
  candidateId: string | null | undefined,
  phone: string | null | undefined
) {
  const id = String(candidateId || '').trim();
  const fromId = id ? unread.byCandidateId.get(id) ?? 0 : 0;
  if (fromId > 0) return fromId;
  const digits = phoneDigits(phone);
  return digits ? unread.byPhoneDigits.get(digits) ?? 0 : 0;
}

const WINDOW_MS = 24 * 60 * 60 * 1000;

export function isCustomerCareWindowOpen(
  messages: Array<{ direction?: string | null; createdAtUtc?: string | null }>,
  nowMs = Date.now()
): boolean {
  let latestInbound = 0;
  for (const message of messages) {
    if (String(message.direction || '').toLowerCase() !== 'inbound') continue;
    const at = new Date(message.createdAtUtc || '').getTime();
    if (!Number.isNaN(at) && at > latestInbound) latestInbound = at;
  }
  if (latestInbound <= 0) return false;
  return nowMs - latestInbound < WINDOW_MS;
}

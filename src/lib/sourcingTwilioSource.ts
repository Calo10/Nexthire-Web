import type { SourcingSourceConnection } from '../types/sourcing';

const TWILIO_SOURCE_CODES = ['twilio', 'whatsapp'] as const;

export function pickTwilioConnection(
  connections: SourcingSourceConnection[] | Map<string, SourcingSourceConnection>
): SourcingSourceConnection | undefined {
  const list =
    connections instanceof Map
      ? Array.from(connections.values())
      : connections;

  for (const code of TWILIO_SOURCE_CODES) {
    const match = list.find((c) => String(c.sourceTypeCode || '').toLowerCase() === code);
    if (match) return match;
  }
  return undefined;
}

/** Twilio must be connected and active before creating WhatsApp campaigns. */
export function isTwilioSourceReady(connection: SourcingSourceConnection | null | undefined): boolean {
  if (!connection) return false;
  return connection.isConnected === true && connection.isActive !== false;
}

import type { SourcingSourceConnection } from '../types/sourcing';

export const CALENDLY_SOURCE_CODE = 'calendly';

export function pickCalendlyConnection(
  connections: SourcingSourceConnection[] | Map<string, SourcingSourceConnection>
): SourcingSourceConnection | undefined {
  const list =
    connections instanceof Map
      ? Array.from(connections.values())
      : connections;

  return list.find((c) => String(c.sourceTypeCode || '').toLowerCase() === CALENDLY_SOURCE_CODE);
}

export function isCalendlySourceReady(connection: SourcingSourceConnection | null | undefined): boolean {
  if (!connection) return false;
  return connection.isConnected === true && connection.isActive !== false;
}

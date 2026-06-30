import type { SourcingSourceConnection } from '../types/sourcing';

const META_SOURCE_CODES = ['meta_ads', 'facebook_ads', 'instagram_ads'] as const;

export function pickMetaAdsConnection(
  connections: SourcingSourceConnection[] | Map<string, SourcingSourceConnection>
): SourcingSourceConnection | undefined {
  const list =
    connections instanceof Map
      ? Array.from(connections.values())
      : connections;

  for (const code of META_SOURCE_CODES) {
    const match = list.find((c) => String(c.sourceTypeCode || '').toLowerCase() === code);
    if (match) return match;
  }
  return undefined;
}

/** Meta Ads must be connected and active before creating Meta campaigns. */
export function isMetaAdsSourceReady(connection: SourcingSourceConnection | null | undefined): boolean {
  if (!connection) return false;
  return connection.isConnected === true && connection.isActive !== false;
}

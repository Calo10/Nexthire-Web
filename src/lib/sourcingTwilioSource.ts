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

const WHATSAPP_NUMBER_KEYS = [
  'Twilio:DefaultFromWhatsAppNumber',
  'twilio:DefaultFromWhatsAppNumber',
  'defaultFromWhatsAppNumber',
  'DefaultFromWhatsAppNumber',
  'twilio_default_from_whatsapp_number',
  'default_from_whatsapp_number',
  'whatsappFrom',
  'from',
  'From',
] as const;

/** WhatsApp number stored on the Twilio source connection (Sources → Configure Twilio). */
export function whatsAppNumberFromTwilioConfig(configJson: string | null | undefined): string {
  if (!configJson?.trim()) return '';
  try {
    const raw = JSON.parse(configJson);
    if (!raw || typeof raw !== 'object') return '';
    const rec = raw as Record<string, unknown>;
    for (const key of WHATSAPP_NUMBER_KEYS) {
      const value = rec[key];
      if (value != null && String(value).trim()) return String(value).trim();
    }
  } catch {
    return '';
  }
  return '';
}

export function whatsAppNumberFromTwilioConnection(
  connection: SourcingSourceConnection | null | undefined
): string {
  if (!connection) return '';
  const json =
    typeof connection.configJson === 'string'
      ? connection.configJson
      : typeof connection.ConfigJson === 'string'
        ? connection.ConfigJson
        : '';
  return whatsAppNumberFromTwilioConfig(json);
}

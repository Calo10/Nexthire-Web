export const CALENDLY_CONFIG_KEYS = [
  'PersonalAccessToken',
  'SchedulingUrl',
  'WebhookSigningKey',
] as const;

export type CalendlyConfigState = {
  PersonalAccessToken: string;
  SchedulingUrl: string;
  WebhookSigningKey: string;
};

const LEGACY_KEY_MAP: Record<keyof CalendlyConfigState, string[]> = {
  PersonalAccessToken: ['PersonalAccessToken', 'personalAccessToken', 'AccessToken', 'api_key', 'apiKey'],
  SchedulingUrl: ['SchedulingUrl', 'schedulingUrl', 'scheduling_url'],
  WebhookSigningKey: ['WebhookSigningKey', 'webhookSigningKey', 'webhook_signing_key'],
};

export function emptyCalendlyConfig(): CalendlyConfigState {
  return {
    PersonalAccessToken: '',
    SchedulingUrl: '',
    WebhookSigningKey: '',
  };
}

export function parseCalendlyConfig(json: string | null | undefined): CalendlyConfigState {
  const out = emptyCalendlyConfig();
  try {
    const raw = (json || '').trim() ? JSON.parse(json!) : {};
    if (!raw || typeof raw !== 'object') return out;
    const rec = raw as Record<string, unknown>;
    for (const key of Object.keys(LEGACY_KEY_MAP) as (keyof CalendlyConfigState)[]) {
      const match = LEGACY_KEY_MAP[key].map((k) => rec[k]).find((v) => v != null && String(v).trim());
      out[key] = match == null ? '' : String(match);
    }
  } catch {
    return out;
  }
  return out;
}

export function buildCalendlyConfigJson(fields: CalendlyConfigState, previousJson: string): string {
  let extra: Record<string, unknown> = {};
  const knownKeys = new Set([
    ...CALENDLY_CONFIG_KEYS,
    ...Object.values(LEGACY_KEY_MAP).flat(),
  ]);
  try {
    const prev = previousJson.trim() ? JSON.parse(previousJson) : {};
    if (prev && typeof prev === 'object') {
      for (const [k, v] of Object.entries(prev as Record<string, unknown>)) {
        if (!knownKeys.has(k)) extra[k] = v;
      }
    }
  } catch {
    extra = {};
  }
  const merged: Record<string, unknown> = { ...extra };
  for (const key of CALENDLY_CONFIG_KEYS) {
    const value = fields[key].trim();
    if (value) merged[key] = value;
    else delete merged[key];
  }
  // Always persist token key when provided (even empty wipe on disconnect is handled by caller).
  if (fields.PersonalAccessToken.trim()) {
    merged.PersonalAccessToken = fields.PersonalAccessToken.trim();
  }
  return JSON.stringify(merged);
}

export function isCalendlyConfigComplete(fields: CalendlyConfigState): boolean {
  return Boolean(fields.PersonalAccessToken.trim());
}

import { apiClient } from '../lib/api';

export interface CalendlyConnectionStatus {
  connected: boolean;
  active: boolean;
  ready: boolean;
  email?: string | null;
  name?: string | null;
  schedulingUrl?: string | null;
  timezone?: string | null;
  userUri?: string | null;
  organizationUri?: string | null;
  error?: string | null;
}

export interface CalendlyScheduledEvent {
  uri: string;
  name: string;
  status: string;
  startTime: string;
  endTime: string;
  location?: string | null;
  meetingUrl?: string | null;
  eventType?: string | null;
  inviteeEmails: string[];
  inviteeNames: string[];
}

export interface CalendlyScheduledEventsResponse {
  schedulingUrl?: string | null;
  hostEmail?: string | null;
  hostName?: string | null;
  items: CalendlyScheduledEvent[];
}

export interface CalendlyEventType {
  uri: string;
  name: string;
  active: boolean;
  durationMinutes: number;
  schedulingUrl?: string | null;
  kind?: string | null;
  color?: string | null;
}

export interface CalendlyAvailableTime {
  status: string;
  startTime: string;
  schedulingUrl?: string | null;
  inviteesRemaining?: number | null;
}

export interface CalendlyBusyTime {
  type: string;
  startTime: string;
  endTime: string;
}

export interface CalendlyCreateInviteePayload {
  eventTypeUri: string;
  startTime: string;
  inviteeName: string;
  inviteeEmail: string;
  timezone?: string;
}

export interface CalendlyCreateInviteeResult {
  inviteeUri?: string | null;
  inviteeEmail?: string | null;
  inviteeName?: string | null;
  eventUri?: string | null;
  cancelUrl?: string | null;
  rescheduleUrl?: string | null;
  status?: string | null;
}

function pick(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return '';
}

function pickBool(o: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    if (typeof o[k] === 'boolean') return o[k] as boolean;
  }
  return false;
}

function pickNum(o: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function normalizeStatus(raw: unknown): CalendlyConnectionStatus {
  const o = asRecord(raw);
  return {
    connected: pickBool(o, 'connected', 'Connected'),
    active: pickBool(o, 'active', 'Active'),
    ready: pickBool(o, 'ready', 'Ready'),
    email: pick(o, 'email', 'Email') || null,
    name: pick(o, 'name', 'Name') || null,
    schedulingUrl: pick(o, 'schedulingUrl', 'SchedulingUrl') || null,
    timezone: pick(o, 'timezone', 'Timezone') || null,
    userUri: pick(o, 'userUri', 'UserUri') || null,
    organizationUri: pick(o, 'organizationUri', 'OrganizationUri') || null,
    error: pick(o, 'error', 'Error') || null,
  };
}

function normalizeEvent(raw: unknown): CalendlyScheduledEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const uri = pick(o, 'uri', 'Uri');
  const startTime = pick(o, 'startTime', 'StartTime');
  if (!uri || !startTime) return null;
  const emailsRaw = o.inviteeEmails ?? o.InviteeEmails;
  const namesRaw = o.inviteeNames ?? o.InviteeNames;
  return {
    uri,
    name: pick(o, 'name', 'Name') || 'Meeting',
    status: pick(o, 'status', 'Status') || 'active',
    startTime,
    endTime: pick(o, 'endTime', 'EndTime') || startTime,
    location: pick(o, 'location', 'Location') || null,
    meetingUrl: pick(o, 'meetingUrl', 'MeetingUrl') || null,
    eventType: pick(o, 'eventType', 'EventType') || null,
    inviteeEmails: Array.isArray(emailsRaw) ? emailsRaw.map(String) : [],
    inviteeNames: Array.isArray(namesRaw) ? namesRaw.map(String) : [],
  };
}

function normalizeEventsResponse(raw: unknown): CalendlyScheduledEventsResponse {
  const o = asRecord(raw);
  const list = Array.isArray(o.items) ? o.items : Array.isArray(o.Items) ? o.Items : [];
  return {
    schedulingUrl: pick(o, 'schedulingUrl', 'SchedulingUrl') || null,
    hostEmail: pick(o, 'hostEmail', 'HostEmail') || null,
    hostName: pick(o, 'hostName', 'HostName') || null,
    items: list.map(normalizeEvent).filter((x): x is CalendlyScheduledEvent => x !== null),
  };
}

function normalizeEventType(raw: unknown): CalendlyEventType | null {
  const o = asRecord(raw);
  const uri = pick(o, 'uri', 'Uri');
  if (!uri) return null;
  return {
    uri,
    name: pick(o, 'name', 'Name') || 'Event',
    active: pickBool(o, 'active', 'Active') || o.active === undefined,
    durationMinutes: pickNum(o, 'durationMinutes', 'DurationMinutes') || 30,
    schedulingUrl: pick(o, 'schedulingUrl', 'SchedulingUrl') || null,
    kind: pick(o, 'kind', 'Kind') || null,
    color: pick(o, 'color', 'Color') || null,
  };
}

function normalizeAvailableTime(raw: unknown): CalendlyAvailableTime | null {
  const o = asRecord(raw);
  const startTime = pick(o, 'startTime', 'StartTime');
  if (!startTime) return null;
  const rem = o.inviteesRemaining ?? o.InviteesRemaining;
  return {
    status: pick(o, 'status', 'Status') || 'available',
    startTime,
    schedulingUrl: pick(o, 'schedulingUrl', 'SchedulingUrl') || null,
    inviteesRemaining: typeof rem === 'number' ? rem : null,
  };
}

function normalizeBusyTime(raw: unknown): CalendlyBusyTime | null {
  const o = asRecord(raw);
  const startTime = pick(o, 'startTime', 'StartTime');
  const endTime = pick(o, 'endTime', 'EndTime');
  if (!startTime || !endTime) return null;
  return {
    type: pick(o, 'type', 'Type') || 'busy',
    startTime,
    endTime,
  };
}

function normalizeInviteeResult(raw: unknown): CalendlyCreateInviteeResult {
  const o = asRecord(raw);
  return {
    inviteeUri: pick(o, 'inviteeUri', 'InviteeUri') || null,
    inviteeEmail: pick(o, 'inviteeEmail', 'InviteeEmail') || null,
    inviteeName: pick(o, 'inviteeName', 'InviteeName') || null,
    eventUri: pick(o, 'eventUri', 'EventUri') || null,
    cancelUrl: pick(o, 'cancelUrl', 'CancelUrl') || null,
    rescheduleUrl: pick(o, 'rescheduleUrl', 'RescheduleUrl') || null,
    status: pick(o, 'status', 'Status') || null,
  };
}

function listFromUnknown(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const o = asRecord(raw);
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.Items)) return o.Items;
  return [];
}

export const calendlyApi = {
  getMe: async () => normalizeStatus(await apiClient.get<unknown>('/calendly/me', true)),

  listScheduledEvents: async (params?: { minStart?: string; maxStart?: string }) => {
    const q = new URLSearchParams();
    if (params?.minStart) q.set('minStart', params.minStart);
    if (params?.maxStart) q.set('maxStart', params.maxStart);
    const qs = q.toString();
    const raw = await apiClient.get<unknown>(`/calendly/scheduled-events${qs ? `?${qs}` : ''}`, true);
    return normalizeEventsResponse(raw);
  },

  listEventTypes: async () => {
    const raw = await apiClient.get<unknown>('/calendly/event-types', true);
    return listFromUnknown(raw)
      .map(normalizeEventType)
      .filter((x): x is CalendlyEventType => x !== null);
  },

  listAvailableTimes: async (params: { eventType: string; startTime: string; endTime: string }) => {
    const q = new URLSearchParams({
      eventType: params.eventType,
      startTime: params.startTime,
      endTime: params.endTime,
    });
    const raw = await apiClient.get<unknown>(`/calendly/available-times?${q}`, true);
    return listFromUnknown(raw)
      .map(normalizeAvailableTime)
      .filter((x): x is CalendlyAvailableTime => x !== null);
  },

  listBusyTimes: async (params: { startTime: string; endTime: string }) => {
    const q = new URLSearchParams({
      startTime: params.startTime,
      endTime: params.endTime,
    });
    const raw = await apiClient.get<unknown>(`/calendly/busy-times?${q}`, true);
    return listFromUnknown(raw)
      .map(normalizeBusyTime)
      .filter((x): x is CalendlyBusyTime => x !== null);
  },

  createInvitee: async (payload: CalendlyCreateInviteePayload) => {
    const raw = await apiClient.post<unknown>('/calendly/invitees', payload, true);
    return normalizeInviteeResult(raw);
  },

};

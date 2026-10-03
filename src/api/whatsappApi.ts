import { apiClient } from '../lib/api';

export interface SendDirectWhatsAppPayload {
  tenantId: string;
  candidateId: string;
  to: string;
  body: string;
}

export interface WhatsappConversationDto {
  id: string;
  phoneNumber: string;
  profileName: string | null;
  candidateId: string;
  jobId: string | null;
  applicationId: string | null;
  assignedRecruiterId: string | null;
  status: string;
  botEnabled: boolean;
  lastMessageAtUtc: string | null;
  lastMessageBody?: string | null;
  unreadCount?: number;
}

export interface WhatsappMessageDto {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound' | string;
  providerMessageId: string | null;
  fromPhone: string | null;
  toPhone: string | null;
  body: string;
  createdAtUtc: string;
}

export interface ConversationsByCandidateResponse {
  conversation: WhatsappConversationDto | null;
  messages: WhatsappMessageDto[];
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as Record<string, unknown>;
}

function mapConversation(raw: unknown): WhatsappConversationDto | null {
  const r = asRecord(raw);
  if (!r) return null;
  const id = String(r.id ?? r.Id ?? '').trim();
  if (!id) return null;
  return {
    id,
    phoneNumber: String(r.phoneNumber ?? r.PhoneNumber ?? ''),
    profileName: (r.profileName ?? r.ProfileName) != null ? String(r.profileName ?? r.ProfileName) : null,
    candidateId: (r.candidateId ?? r.CandidateId) != null ? String(r.candidateId ?? r.CandidateId) : '',
    jobId: (r.jobId ?? r.JobId) != null ? String(r.jobId ?? r.JobId) : null,
    applicationId: (r.applicationId ?? r.ApplicationId) != null ? String(r.applicationId ?? r.ApplicationId) : null,
    assignedRecruiterId: (r.assignedRecruiterId ?? r.AssignedRecruiterId) != null ? String(r.assignedRecruiterId ?? r.AssignedRecruiterId) : null,
    status: String(r.status ?? r.Status ?? ''),
    botEnabled: Boolean(r.botEnabled ?? r.BotEnabled),
    lastMessageAtUtc: (r.lastMessageAtUtc ?? r.LastMessageAtUtc) != null ? String(r.lastMessageAtUtc ?? r.LastMessageAtUtc) : null,
    lastMessageBody: (r.lastMessageBody ?? r.LastMessageBody) != null ? String(r.lastMessageBody ?? r.LastMessageBody) : null,
    unreadCount: Number(r.unreadCount ?? r.UnreadCount ?? 0) || 0,
  };
}

function mapMessage(raw: unknown): WhatsappMessageDto | null {
  const r = asRecord(raw);
  if (!r) return null;
  const id = String(r.id ?? r.Id ?? '').trim();
  if (!id) return null;
  return {
    id,
    conversationId: String(r.conversationId ?? r.ConversationId ?? ''),
    direction: String(r.direction ?? r.Direction ?? ''),
    providerMessageId: (r.providerMessageId ?? r.ProviderMessageId) != null ? String(r.providerMessageId ?? r.ProviderMessageId) : null,
    fromPhone: (r.fromPhone ?? r.FromPhone) != null ? String(r.fromPhone ?? r.FromPhone) : null,
    toPhone: (r.toPhone ?? r.ToPhone) != null ? String(r.toPhone ?? r.ToPhone) : null,
    body: String(r.body ?? r.Body ?? ''),
    createdAtUtc: String(r.createdAtUtc ?? r.CreatedAtUtc ?? ''),
  };
}

export const whatsappApi = {
  sendDirect: async (payload: SendDirectWhatsAppPayload): Promise<void> => {
    await apiClient.post<void>(
      '/whatsapp/conversations/send-direct',
      {
        tenantId: payload.tenantId,
        candidateId: payload.candidateId,
        to: payload.to,
        body: payload.body,
      },
      true
    );
  },

  listConversations: async (tenantId: string): Promise<WhatsappConversationDto[]> => {
    const q = new URLSearchParams({ tenantId });
    const raw = await apiClient.get<unknown>(`/whatsapp/conversations?${q.toString()}`, true);
    if (!Array.isArray(raw)) return [];
    return raw.map(mapConversation).filter((c): c is WhatsappConversationDto => c != null);
  },

  getMessages: async (conversationId: string, tenantId: string): Promise<WhatsappMessageDto[]> => {
    const q = new URLSearchParams({ tenantId });
    const raw = await apiClient.get<unknown>(
      `/whatsapp/conversations/${encodeURIComponent(conversationId)}/messages?${q.toString()}`,
      true
    );
    if (!Array.isArray(raw)) return [];
    return raw
      .map(mapMessage)
      .filter((m): m is WhatsappMessageDto => m != null)
      .sort((a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime());
  },

  markRead: async (conversationId: string, tenantId: string): Promise<void> => {
    const q = new URLSearchParams({ tenantId });
    await apiClient.post(
      `/whatsapp/conversations/${encodeURIComponent(conversationId)}/read?${q.toString()}`,
      {},
      true
    );
  },

  sendIntroduction: async (candidateId: string): Promise<{ messageId: string; body: string }> => {
    const raw = await apiClient.post<unknown>(
      '/whatsapp/conversations/send-introduction',
      { candidateId },
      true
    );
    const r = asRecord(raw) ?? {};
    return {
      messageId: String(r.messageId ?? r.MessageId ?? ''),
      body: String(r.body ?? r.Body ?? ''),
    };
  },

  sendToConversation: async (conversationId: string, tenantId: string, body: string): Promise<void> => {
    await apiClient.post(
      `/whatsapp/conversations/${encodeURIComponent(conversationId)}/send`,
      { tenantId, body },
      true
    );
  },

  getConversationByCandidate: async (tenantId: string, candidateId: string): Promise<ConversationsByCandidateResponse> => {
    const q = new URLSearchParams({ tenantId, candidateId });
    return apiClient.get<ConversationsByCandidateResponse>(`/whatsapp/conversations/by-candidate?${q.toString()}`, true);
  },
};


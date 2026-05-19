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

  getConversationByCandidate: async (tenantId: string, candidateId: string): Promise<ConversationsByCandidateResponse> => {
    const q = new URLSearchParams({ tenantId, candidateId });
    return apiClient.get<ConversationsByCandidateResponse>(`/whatsapp/conversations/by-candidate?${q.toString()}`, true);
  },
};


import { apiClient } from '../lib/api';

export interface SendEmailPayload {
  toEmail: string;
  subject: string;
  plainText: string;
  html: string;
}

export const emailApi = {
  send: async (payload: SendEmailPayload): Promise<void> => {
    await apiClient.post<void>(
      '/v1/email/send',
      {
        toEmail: payload.toEmail,
        subject: payload.subject,
        plainText: payload.plainText,
        html: payload.html,
      },
      true
    );
  },
};


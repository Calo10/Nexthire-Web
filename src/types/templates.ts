export type TemplateChannel = 'email' | 'whatsapp';

export interface Template {
  id: string;
  name: string;
  channel: TemplateChannel;
  subject?: string | null;
  body: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ListTemplatesParams {
  channel: TemplateChannel;
}

export interface CreateTemplatePayload {
  name: string;
  channel: TemplateChannel;
  subject?: string | null;
  body?: string;
}

export interface UpdateTemplatePayload {
  name?: string;
  channel?: TemplateChannel;
  subject?: string | null;
  body?: string;
}


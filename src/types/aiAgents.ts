import type { TemplateChannel } from './templates';

export type AgentCadence = 'hourly' | 'daily' | 'weekly';

export interface SourcingAgentConfig {
  autoConversionPercent: number;
  maxProcessed: number;
  cadence: AgentCadence;
}

export interface MessagingAgentConfig {
  channel: TemplateChannel;
  templateId: string;
  responseWaitHours: number;
  advanceCadence: AgentCadence;
  /** Offer stage: cap on automated offers sent per cycle. */
  maxOffersToSend?: number;
}

export interface AiAgentsJobConfig {
  sourcing: SourcingAgentConfig;
  screening: MessagingAgentConfig;
  interview: MessagingAgentConfig;
  offer: MessagingAgentConfig;
  updatedAt?: string;
}

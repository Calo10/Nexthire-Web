/** Flexible shapes — backend may use camelCase, PascalCase, or extra fields */

export type SourcingLead = {
  id?: string | number;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  desiredRole?: string | null;
  currentRole?: string | null;
  sourceType?: string | null;
  sourceTypeCode?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  distanceMiles?: number | null;
  availability?: string | null;
  experienceYears?: number | null;
  englishLevel?: string | null;
  spanishLevel?: string | null;
  hasTransportation?: boolean | null;
  fitScore?: number | null;
  qualificationNotes?: string | null;
  dynamicAnswersJson?: string | null;
  status?: string | null;
  jobId?: string | number | null;
  jobTitle?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
};

export type SourcingDashboard = {
  candidatesCaptured?: number | null;
  candidatesCapturedToday?: number | null;
  activeCampaigns?: number | null;
  costPerCandidate?: number | null;
  conversionRate?: number | null;
  conversionRatePercent?: number | null;
  leadsBySource?: Record<string, number> | string | unknown;
  trends?: Record<string, unknown>;
  [key: string]: unknown;
};

export type SourcingCampaign = {
  id?: string | number;
  name?: string | null;
  jobId?: string | number | null;
  jobTitle?: string | null;
  platform?: string | null;
  dailyBudget?: number | null;
  totalBudget?: number | null;
  currency?: string | null;
  status?: string | null;
  leadsCount?: number | null;
  leads?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  landingPageUrl?: string | null;
  trackingCode?: string | null;
  externalCampaignId?: string | null;
  externalAdAccountId?: string | null;
  /** Creative image from marketing_meta_campaigns (detail only). */
  imageBase64?: string | null;
  imageContentType?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
};

export type SourcingSourceType = {
  code?: string | null;
  sourceTypeCode?: string | null;
  name?: string | null;
  displayName?: string | null;
  [key: string]: unknown;
};

export type SourcingSourceConnection = {
  id?: string | number;
  sourceTypeCode?: string | null;
  isConnected?: boolean | null;
  isActive?: boolean | null;
  configJson?: string | null;
  [key: string]: unknown;
};

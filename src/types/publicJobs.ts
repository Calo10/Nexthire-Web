import type { JobBotQuestion } from './jobBotQuestions';

export type PublicJobStatus = 'open' | 'closed' | 'draft' | 'on_hold' | string;

export interface JobPublicDTO {
  id: string | number;
  title: string;
  description?: string | null;
  location?: string | null;
  department?: string | null;
  type?: string | null;
  status: PublicJobStatus;
  language?: string | null;
  postedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  alreadyApplied?: boolean | null;
  botQuestions?: JobBotQuestion[];
}

export interface ListPublicJobsParams {
  status?: 'open';
  search?: string;
  query?: string;
  location?: string;
  department?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}

export interface ApplyJobDynamicAnswer {
  questionId: string;
  value: string;
  file?: File | null;
}

export interface ApplyJobRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  botAnswers: ApplyJobDynamicAnswer[];
}

export interface ApplyJobResponse {
  success?: boolean;
  message?: string;
  alreadyApplied?: boolean;
}



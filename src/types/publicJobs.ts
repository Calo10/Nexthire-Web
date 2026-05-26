export type PublicJobStatus = 'open' | 'closed' | 'draft' | 'on_hold' | string;

export interface JobPublicDTO {
  id: string | number;
  title: string;
  description?: string | null;
  location?: string | null;
  department?: string | null;
  type?: string | null;
  status: PublicJobStatus;
  postedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  alreadyApplied?: boolean | null;
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

export interface ApplyJobRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  resume?: File | null;
  availability?: string | null;
  experienceYears?: string | number | null;
  englishLevel?: string | null;
  spanishLevel?: string | null;
}

export interface ApplyJobResponse {
  success?: boolean;
  message?: string;
  alreadyApplied?: boolean;
}


export type CandidateSource =
  | 'Website'
  | 'LinkedIn'
  | 'Referral'
  | 'Email'
  | 'Indeed'
  | 'Agency'
  | 'Other';

export interface Candidate {
  id: string; // uuid
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: CandidateSource | string;
  resumeUrl?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CandidatesListResponse {
  items: Candidate[];
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface GetCandidatesParams {
  search?: string;
  source?: string;
  from?: string; // ISO or YYYY-MM-DD
  to?: string; // ISO or YYYY-MM-DD
  page?: number;
  pageSize?: number;
}

export interface CreateCandidatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  resumeUrl?: string;
}

/** Same multipart field names as public job apply — POST /api/candidates/from-apply-form */
export interface CreateCandidateFromApplyFormPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  resume: File;
}

export type UpdateCandidatePayload = Partial<CreateCandidatePayload>;


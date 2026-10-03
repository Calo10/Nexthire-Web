export interface CandidateTag {
  id: string;
  name: string;
}

export interface CandidateNote {
  id: string;
  body: string;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdAt: string;
}

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
  tags?: CandidateTag[];
  /** Bot / apply answers JSON from linked sourcing lead when converted. */
  dynamicAnswersJson?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface CandidatesListResponse {
  items: Candidate[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalCount?: number;
  totalPages?: number;
}

export interface GetCandidatesParams {
  search?: string;
  source?: string;
  from?: string; // ISO or YYYY-MM-DD
  to?: string; // ISO or YYYY-MM-DD
  tagIds?: string[];
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


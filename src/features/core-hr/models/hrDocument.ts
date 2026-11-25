/** Core HR documents hub models. Mirrors nexthire-api `HrDocumentsController` (camelCase JSON). */

/** Display statuses computed by the API (`displayStatus`). */
export const HR_DOCUMENT_STATUSES = ['Active', 'Expiring', 'Expired', 'Pending'] as const;
export type HrDocumentStatus = (typeof HR_DOCUMENT_STATUSES)[number];

export type HrDocumentRequestStatus = 'Open' | 'Fulfilled' | 'Cancelled' | 'Overdue';

export interface HrDocumentListItem {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeJobTitle?: string | null;
  employeeDepartment?: string | null;
  employeeAvatarUrl?: string | null;
  category: string;
  name: string;
  /** Stored file (resolved via `documentsApi.downloadUrl`). */
  documentId?: string | null;
  externalUrl?: string | null;
  fileName?: string | null;
  contentType?: string | null;
  fileSizeBytes?: number | null;
  /** Stored status (Active, Expired, Archived, Pending). */
  status: string;
  /** Computed status: Active, Expiring, Expired or Pending. */
  displayStatus?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  uploadedByName?: string | null;
  isArchived?: boolean;
}

export interface HrDocumentActivity {
  id: string;
  activityType: string;
  summary: string;
  createdAt: string;
  createdByName?: string | null;
}

export interface HrDocumentDetail extends HrDocumentListItem {
  activity: HrDocumentActivity[];
}

export interface HrDocumentSummary {
  total: number;
  valid: number;
  /** Valid share of all documents (0-100), derived client-side. */
  validPercent: number;
  expiringSoon: number;
  expired: number;
  pending: number;
  openRequests: number;
}

export interface HrDocumentCategoryCount {
  category: string;
  count: number;
}

export interface HrDocumentListQuery {
  search?: string;
  category?: string;
  status?: string;
  departmentId?: string;
  employeeId?: string;
  page?: number;
  pageSize?: number;
  /** name, category, employee, status, expiresAt, createdAt, size. */
  sort?: string;
  dir?: 'asc' | 'desc';
}

/** Body for POST /api/hr/documents (link-based) and PUT /api/hr/documents/{id}. */
export interface HrDocumentRequestBody {
  employeeId: string;
  category: string;
  name: string;
  documentId?: string | null;
  externalUrl?: string | null;
  expiresAt?: string | null;
  /** Active, Pending or Expired. */
  status?: string | null;
}

export interface HrDocumentUploadInput {
  employeeId: string;
  category: string;
  name: string;
  file: File;
  expiresAt?: string | null;
}

export interface HrDocumentRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatarUrl?: string | null;
  category: string;
  title: string;
  notes?: string | null;
  /** Open, Fulfilled, Cancelled or Overdue. */
  status: string;
  dueAt?: string | null;
  fulfilledDocumentId?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface CreateHrDocumentRequestBody {
  employeeId: string;
  category: string;
  title?: string | null;
  notes?: string | null;
  dueAt?: string | null;
}

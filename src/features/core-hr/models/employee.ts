/** Core HR employee models. Mirrors nexthire-api `DTOs/CoreHr/EmployeeDtos.cs` (camelCase JSON). */

export const EMPLOYMENT_STATUSES = [
  'Pending',
  'Onboarding',
  'Active',
  'OnLeave',
  'Inactive',
  'Terminated',
] as const;

export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

export const WORK_MODALITIES = ['OnSite', 'Remote', 'Hybrid'] as const;
export type WorkModality = (typeof WORK_MODALITIES)[number];

export const PAY_FREQUENCIES = ['Hourly', 'Weekly', 'BiWeekly', 'SemiMonthly', 'Monthly', 'Annual'] as const;
export type PayFrequency = (typeof PAY_FREQUENCIES)[number];

export const DOCUMENT_CATEGORIES = [
  'Contract',
  'Identification',
  'Tax',
  'Certification',
  'Policy',
  'Medical',
  'Administrative',
  'Legal',
  'Other',
] as const;

/** Capability strings returned by `GET /api/employees/capabilities`. */
export const HR_PERMISSIONS = {
  View: 'Employees.View',
  Create: 'Employees.Create',
  Edit: 'Employees.Edit',
  Archive: 'Employees.Archive',
  Import: 'Employees.Import',
  Export: 'Employees.Export',
  ViewSensitiveData: 'Employees.ViewSensitiveData',
  ManageDocuments: 'Employees.ManageDocuments',
  ViewCompensation: 'Employees.ViewCompensation',
  ManageCompensation: 'Employees.ManageCompensation',
} as const;

export type HrPermission = (typeof HR_PERMISSIONS)[keyof typeof HR_PERMISSIONS];

export interface HrLookup {
  id: string;
  name: string;
  code?: string | null;
  isActive: boolean;
}

export interface WorkLocation extends HrLookup {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface CreateHrLookupRequest {
  name: string;
  code?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface EmployeeListItem {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  preferredName?: string | null;
  displayName: string;
  profilePictureUrl?: string | null;
  workEmail?: string | null;
  jobTitle?: string | null;
  jobTitleId?: string | null;
  department?: string | null;
  departmentId?: string | null;
  location?: string | null;
  workLocationId?: string | null;
  employmentStatus: string;
  employmentType?: string | null;
  employmentTypeId?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  hireDate?: string | null;
  isArchived: boolean;
}

export interface EmergencyContact {
  id?: string | null;
  fullName: string;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  isPrimary: boolean;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  category: string;
  name: string;
  documentId?: string | null;
  externalUrl?: string | null;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
}

export interface EmployeeDetail extends EmployeeListItem {
  middleName?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  personalEmail?: string | null;
  personalPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  workPhone?: string | null;
  workModality?: string | null;
  terminationDate?: string | null;
  terminationReason?: string | null;
  probationEndDate?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  candidateId?: string | null;
  applicationId?: string | null;
  linkedUserId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  archivedAt?: string | null;
  tenureYears?: number | null;
  emergencyContacts: EmergencyContact[];
  upcomingDocumentExpirations: EmployeeDocument[];
}

/** Body for POST /api/employees and PUT /api/employees/{id}. */
export interface EmployeeRequest {
  employeeNumber?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  preferredName?: string | null;
  profilePictureUrl?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  personalEmail?: string | null;
  personalPhone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  workEmail?: string | null;
  workPhone?: string | null;
  jobTitleId?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  employmentTypeId?: string | null;
  employmentStatus?: string | null;
  hireDate?: string | null;
  workLocationId?: string | null;
  workModality?: string | null;
  probationEndDate?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  candidateId?: string | null;
  applicationId?: string | null;
  emergencyContacts?: EmergencyContact[] | null;
}

export interface ChangeEmployeeStatusRequest {
  status: string;
  terminationDate?: string | null;
  terminationReason?: string | null;
  notes?: string | null;
}

export interface ConvertCandidateRequest {
  candidateId: string;
  applicationId?: string | null;
  overrides?: Partial<EmployeeRequest> | null;
}

export interface UpsertEmployeeDocumentRequest {
  category: string;
  name: string;
  documentId?: string | null;
  externalUrl?: string | null;
  expiresAt?: string | null;
  status?: string | null;
}

export interface EmployeeActivity {
  id: string;
  activityType: string;
  summary: string;
  detailsJson?: string | null;
  createdAt: string;
  createdByName?: string | null;
}

export interface EmploymentHistoryEntry {
  id: string;
  effectiveAt: string;
  changeType: string;
  jobTitle?: string | null;
  department?: string | null;
  employmentType?: string | null;
  employmentStatus?: string | null;
  location?: string | null;
  managerName?: string | null;
  notes?: string | null;
  createdByName?: string | null;
}

export interface Compensation {
  id: string;
  amount: number;
  currency: string;
  payFrequency: string;
  effectiveDate: string;
  endDate?: string | null;
  notes?: string | null;
}

export interface UpsertCompensationRequest {
  amount: number;
  currency: string;
  payFrequency: string;
  effectiveDate: string;
  endDate?: string | null;
  notes?: string | null;
}

export interface EmployeeSummary {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  previousNewHires: number;
  turnoverRate: number;
  previousTurnoverRate: number;
  averageTenureYears: number;
  previousAverageTenureYears: number;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  byLocation: Record<string, number>;
  byEmploymentType: Record<string, number>;
}

export type EmployeeSortKey = 'name' | 'employeeNumber' | 'hireDate' | 'status' | 'department' | 'jobTitle';
export type SortDirection = 'asc' | 'desc';

export interface EmployeeListQuery {
  search?: string;
  departmentId?: string;
  jobTitleId?: string;
  employmentStatus?: string;
  employmentTypeId?: string;
  workLocationId?: string;
  managerId?: string;
  hireFrom?: string;
  hireTo?: string;
  includeArchived?: boolean;
  page?: number;
  pageSize?: number;
  sort?: EmployeeSortKey;
  dir?: SortDirection;
}

export interface EmployeeImportRowError {
  rowNumber: number;
  message: string;
}

export interface EmployeeImportResult {
  totalRows: number;
  created: number;
  skipped: number;
  errors: EmployeeImportRowError[];
}

/** CSV columns accepted by POST /api/employees/import. */
export const EMPLOYEE_IMPORT_COLUMNS = [
  'FirstName',
  'LastName',
  'WorkEmail',
  'EmployeeNumber',
  'Department',
  'JobTitle',
  'Location',
  'EmploymentStatus',
  'EmploymentType',
  'HireDate',
] as const;

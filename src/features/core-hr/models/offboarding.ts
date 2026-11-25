/** Capability strings returned by `GET /api/offboardings/capabilities`. */
export const OFFBOARDING_PERMISSIONS = {
  View: 'Offboarding.View',
  Create: 'Offboarding.Create',
  Edit: 'Offboarding.Edit',
  Cancel: 'Offboarding.Cancel',
  Complete: 'Offboarding.Complete',
  ManageTemplates: 'Offboarding.ManageTemplates',
  ManageTasks: 'Offboarding.ManageTasks',
  /** Approve / reject / waive tasks (clearance sign-off). */
  ApproveClearance: 'Offboarding.ApproveClearance',
  ManageAssets: 'Offboarding.ManageAssets',
  ManageAccess: 'Offboarding.ManageAccess',
  ManageDocuments: 'Offboarding.ManageDocuments',
  ManageExitInterviews: 'Offboarding.ManageExitInterviews',
  ManageSettlement: 'Offboarding.ManageSettlement',
  ManageAutomations: 'Offboarding.ManageAutomations',
  /** Separation reason, confidential notes, and exit-interview responses / HR notes. */
  ViewConfidentialInformation: 'Offboarding.ViewConfidentialInformation',
} as const;

export type OffboardingPermission = (typeof OFFBOARDING_PERMISSIONS)[keyof typeof OFFBOARDING_PERMISSIONS];

export const OFFBOARDING_STATUSES = ['Scheduled', 'InProgress', 'PendingClearance', 'Completed', 'Cancelled'] as const;
export type OffboardingStatus = (typeof OFFBOARDING_STATUSES)[number];

/** Kanban columns, in display order (Cancelled is excluded from the pipeline). */
export const OFFBOARDING_PIPELINE_STATUSES = ['Scheduled', 'InProgress', 'PendingClearance', 'Completed'] as const;

export const ACTIVE_OFFBOARDING_STATUSES: readonly string[] = ['Scheduled', 'InProgress', 'PendingClearance'];

export const SEPARATION_TYPES = [
  'VoluntaryResignation',
  'InvoluntaryTermination',
  'ContractExpiration',
  'Retirement',
  'Layoff',
  'MutualAgreement',
  'Other',
] as const;
export type SeparationType = (typeof SEPARATION_TYPES)[number];

/** Employer-initiated separations: the employee can never be notified automatically for these. */
export const INVOLUNTARY_SEPARATION_TYPES: readonly string[] = ['InvoluntaryTermination', 'Layoff'];

export const REHIRE_ELIGIBILITIES = ['Eligible', 'NotEligible', 'Conditional', 'Unknown'] as const;

export const OFFBOARDING_TASK_STATUSES = ['Pending', 'InProgress', 'Completed', 'Cancelled', 'Blocked'] as const;
export type OffboardingTaskStatus = (typeof OFFBOARDING_TASK_STATUSES)[number];

export const OFFBOARDING_TASK_CATEGORIES = [
  'HRAdministration',
  'Documentation',
  'KnowledgeTransfer',
  'ITSecurity',
  'EquipmentAssets',
  'FinancePayroll',
  'Compliance',
  'ExitInterview',
  'ManagementApproval',
  'Other',
] as const;
export type OffboardingTaskCategory = (typeof OFFBOARDING_TASK_CATEGORIES)[number];

export const OFFBOARDING_ASSIGNMENT_TYPES = ['Employee', 'DirectManager', 'HR', 'IT', 'Finance', 'SpecificUser'] as const;
export type OffboardingAssignmentType = (typeof OFFBOARDING_ASSIGNMENT_TYPES)[number];

export const OFFBOARDING_ASSET_STATUSES = ['PendingReturn', 'Returned', 'Damaged', 'Missing', 'Waived'] as const;
export const OFFBOARDING_ACCESS_STATUSES = ['Pending', 'Scheduled', 'Revoked', 'Verified', 'NotApplicable'] as const;
export const OFFBOARDING_SETTLEMENT_STATUSES = ['Pending', 'Completed', 'NotApplicable', 'Waived'] as const;
export const OFFBOARDING_EXIT_INTERVIEW_STATUSES = ['NotScheduled', 'Scheduled', 'InProgress', 'Completed', 'Skipped'] as const;
export const OFFBOARDING_DOCUMENT_STATUSES = ['Missing', 'Uploaded', 'PendingApproval', 'Approved', 'Rejected'] as const;

export const OFFBOARDING_TRIGGERS = [
  'OffboardingCreated',
  'OffboardingStarted',
  'OffboardingPendingClearance',
  'OffboardingCompleted',
  'OffboardingCancelled',
  'LastWorkingDayApproaching',
  'AssetReturnOverdue',
  'TaskAssigned',
  'TaskDueSoon',
  'TaskOverdue',
  'TaskApprovalRequested',
  'TaskApproved',
  'TaskRejected',
] as const;

export const OFFBOARDING_RECIPIENT_ROLES = ['Owner', 'Assignee', 'Employee', 'DirectManager'] as const;

// ---------------------------------------------------------------------------
// Offboardings
// ---------------------------------------------------------------------------

export interface OffboardingListItem {
  id: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  employeeEmail?: string | null;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  jobTitleId?: string | null;
  department?: string | null;
  departmentId?: string | null;
  templateId?: string | null;
  templateName?: string | null;
  ownerUserId?: string | null;
  ownerName?: string | null;
  separationType: SeparationType | string;
  noticeDate?: string | null;
  processStartDate?: string | null;
  lastWorkingDay?: string | null;
  terminationEffectiveDate?: string | null;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  status: OffboardingStatus | string;
  progressPercent: number;
  totalTasks: number;
  completedTasks: number;
  overdueCount: number;
  /** Required assets still to be returned. */
  pendingAssets: number;
  /** Access items not yet revoked / verified. */
  pendingAccessItems: number;
  employmentStatusApplied?: boolean;
  createdAt: string;
}

export interface OffboardingTask {
  id: string;
  offboardingId: string;
  templateTaskId?: string | null;
  title: string;
  description?: string | null;
  category: OffboardingTaskCategory | string;
  assignmentType: OffboardingAssignmentType | string;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  dueDate?: string | null;
  status: OffboardingTaskStatus | string;
  isRequired: boolean;
  requiresDocument: boolean;
  documentCategory?: string | null;
  requiresApproval: boolean;
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected' | string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  completedAt?: string | null;
  completedBy?: string | null;
  completionNotes?: string | null;
  evidenceUrl?: string | null;
  priority?: string | null;
  waiveReason?: string | null;
  displayOrder: number;
  dependsOnTaskId?: string | null;
  isWaived: boolean;
  isOverdue: boolean;
  createdAt: string;
}

export interface OffboardingDocument {
  id: string;
  offboardingId: string;
  offboardingTaskId?: string | null;
  employeeDocumentId?: string | null;
  category: string;
  name: string;
  isRequired: boolean;
  status: 'Missing' | 'Uploaded' | 'PendingApproval' | 'Approved' | 'Rejected' | string;
  createdAt: string;
}

export interface OffboardingAsset {
  id: string;
  offboardingId: string;
  assetName: string;
  assetType?: string | null;
  serialNumber?: string | null;
  returnRequired: boolean;
  expectedReturnDate?: string | null;
  actualReturnDate?: string | null;
  conditionNotes?: string | null;
  status: string;
  notes?: string | null;
  evidenceUrl?: string | null;
  waiveReason?: string | null;
}

export interface OffboardingAccessItem {
  id: string;
  offboardingId: string;
  systemName: string;
  responsibleUserId?: string | null;
  responsibleUserName?: string | null;
  scheduledAt?: string | null;
  revokedAt?: string | null;
  status: string;
  notes?: string | null;
  verifiedAt?: string | null;
  evidenceUrl?: string | null;
}

export interface OffboardingSettlementItem {
  id: string;
  offboardingId: string;
  itemCode: string;
  title: string;
  isRequired: boolean;
  status: string;
  /** Withheld (null) unless the caller has ManageSettlement or ViewConfidentialInformation. */
  amount?: number | null;
  currency?: string | null;
  notes?: string | null;
  completedAt?: string | null;
}

export interface OffboardingExitInterview {
  id: string;
  offboardingId: string;
  status: string;
  interviewerUserId?: string | null;
  interviewerName?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  questionnaireJson?: string | null;
  /** Confidential: only returned to users with ViewConfidentialInformation. */
  hrNotes?: string | null;
  /** Confidential JSON string (question → answer). */
  responsesJson?: string | null;
  confidentialRedacted?: boolean;
}

export interface OffboardingDetail extends OffboardingListItem {
  templateVersion?: number | null;
  notifyEmployee: boolean;
  cancelReason?: string | null;
  updatedAt?: string | null;
  /** Every required task is done (and approved) so the offboarding can go to PendingClearance. */
  canSubmitClearance: boolean;
  /** Clearance gates plus assets, access and settlement are all satisfied. */
  canComplete: boolean;
  clearanceBlockers: string[];
  completionBlockers: string[];
  rehireEligibility?: string | null;
  /** Confidential fields — null unless the caller has ViewConfidentialInformation. */
  separationReason?: string | null;
  confidentialNotes?: string | null;
  confidentialRedacted?: boolean;
  tasks: OffboardingTask[];
  assets: OffboardingAsset[];
  accessItems: OffboardingAccessItem[];
  settlementItems: OffboardingSettlementItem[];
  exitInterview?: OffboardingExitInterview | null;
  documents: OffboardingDocument[];
}

export interface OffboardingActivity {
  id: string;
  offboardingId: string;
  activityType: string;
  summary: string;
  detailsJson?: string | null;
  createdAt: string;
  createdBy?: string | null;
  createdByName?: string | null;
}

export type OffboardingSortKey = 'employee' | 'lastWorkingDay' | 'expectedCompletion' | 'status' | 'created';

export interface OffboardingFilterState {
  departmentId: string;
  ownerUserId: string;
  templateId: string;
  separationType: string;
  status: string;
  overdueOnly: boolean;
}

export const EMPTY_OFFBOARDING_FILTERS: OffboardingFilterState = {
  departmentId: '',
  ownerUserId: '',
  templateId: '',
  separationType: '',
  status: '',
  overdueOnly: false,
};

export function activeOffboardingFilterCount(f: OffboardingFilterState): number {
  return [f.departmentId, f.ownerUserId, f.templateId, f.separationType, f.status].filter(Boolean).length + (f.overdueOnly ? 1 : 0);
}

export interface OffboardingListQuery {
  search?: string;
  departmentId?: string;
  ownerUserId?: string;
  templateId?: string;
  separationType?: string;
  status?: string;
  lastWorkingFrom?: string;
  lastWorkingTo?: string;
  overdueOnly?: boolean;
  page?: number;
  pageSize?: number;
  sort?: OffboardingSortKey;
  dir?: 'asc' | 'desc';
}

export type OffboardingPipelineQuery = Pick<
  OffboardingListQuery,
  'search' | 'departmentId' | 'ownerUserId' | 'templateId' | 'separationType' | 'lastWorkingFrom' | 'lastWorkingTo' | 'overdueOnly'
>;

export interface OffboardingPipelineCard {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  separationType?: string | null;
  lastWorkingDay?: string | null;
  expectedCompletion?: string | null;
  progressPercent: number;
  overdueCount: number;
  pendingAssets: number;
  pendingAccessItems: number;
  ownerName?: string | null;
  templateName?: string | null;
}

export interface OffboardingPipelineColumn {
  status: string;
  label: string;
  count: number;
  cards: OffboardingPipelineCard[];
}

export interface OffboardingPipeline {
  columns: OffboardingPipelineColumn[];
}

export interface OffboardingSummary {
  periodStart: string;
  periodEnd: string;
  activeOffboardings: number;
  scheduled: number;
  inProgress: number;
  pendingClearance: number;
  startedInPeriod: number;
  previousStartedInPeriod: number;
  completedInPeriod: number;
  previousCompletedInPeriod: number;
  averageCompletionDays: number;
  previousAverageCompletionDays: number;
  averageProgressPercent: number;
  /** Active offboardings whose last working day falls within the next 7 days. */
  upcomingDepartures: number;
  pendingAssetReturns: number;
  pendingAccessRevocations: number;
  overdueTasks: number;
  overdueOffboardings: number;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  bySeparationType: Record<string, number>;
}

export interface CreateOffboardingTaskRequest {
  title: string;
  description?: string | null;
  category?: string;
  assignmentType?: string;
  assignedUserId?: string | null;
  dueDate?: string | null;
  isRequired?: boolean;
  requiresDocument?: boolean;
  documentCategory?: string | null;
  requiresApproval?: boolean;
  dependsOnTaskId?: string | null;
}

export interface CreateOffboardingRequest {
  employeeId: string;
  templateId?: string | null;
  ownerUserId?: string | null;
  separationType: string;
  separationReason?: string | null;
  noticeDate?: string | null;
  lastWorkingDay: string;
  /** Defaults to the last working day server-side. */
  terminationEffectiveDate?: string | null;
  expectedCompletionDate?: string | null;
  rehireEligibility?: string | null;
  confidentialNotes?: string | null;
  /** Explicit opt-in (never defaulted); not allowed for involuntary separations. */
  notifyEmployee: boolean;
  startImmediately?: boolean;
  /** Ignored without Offboarding.ManageTasks. */
  excludedTemplateTaskIds?: string[];
  additionalTasks?: CreateOffboardingTaskRequest[];
  /** Company assets to return (ignored without Offboarding.ManageAssets). */
  assets?: CreateOffboardingAssetRequest[];
  /** Overrides the default access systems (ignored without Offboarding.ManageAccess). */
  accessSystems?: string[];
}

export interface StartOffboardingForEmployeeRequest {
  separationType?: string | null;
  separationReason?: string | null;
  noticeDate?: string | null;
  lastWorkingDay?: string | null;
  terminationEffectiveDate?: string | null;
  templateId?: string | null;
  ownerUserId?: string | null;
  notifyEmployee?: boolean;
  startImmediately?: boolean;
}

export interface UpdateOffboardingRequest {
  ownerUserId?: string | null;
  separationType?: string | null;
  separationReason?: string | null;
  noticeDate?: string | null;
  lastWorkingDay?: string | null;
  terminationEffectiveDate?: string | null;
  expectedCompletionDate?: string | null;
  rehireEligibility?: string | null;
  confidentialNotes?: string | null;
  notifyEmployee?: boolean | null;
}

export interface UpdateOffboardingTaskRequest extends CreateOffboardingTaskRequest {
  /** Pending, InProgress or Blocked. */
  status?: string | null;
  isWaived?: boolean | null;
  waiveReason?: string | null;
}

export interface CreateOffboardingAssetRequest {
  assetName: string;
  assetType?: string | null;
  serialNumber?: string | null;
  returnRequired?: boolean;
  expectedReturnDate?: string | null;
  notes?: string | null;
}

export type UpdateOffboardingAssetRequest = CreateOffboardingAssetRequest;

export interface UpdateOffboardingAssetStatusRequest {
  status: string;
  /** Defaults to today when moving to Returned. */
  actualReturnDate?: string | null;
  conditionNotes?: string | null;
  evidenceUrl?: string | null;
  /** Required when moving to Waived. */
  waiveReason?: string | null;
  notes?: string | null;
}

export interface CreateOffboardingAccessItemRequest {
  systemName: string;
  responsibleUserId?: string | null;
  scheduledAt?: string | null;
  notes?: string | null;
}

export type UpdateOffboardingAccessItemRequest = CreateOffboardingAccessItemRequest;

export interface UpdateOffboardingAccessStatusRequest {
  status: string;
  scheduledAt?: string | null;
  evidenceUrl?: string | null;
  notes?: string | null;
}

export interface UpdateOffboardingSettlementItemRequest {
  status: string;
  amount?: number | null;
  currency?: string | null;
  notes?: string | null;
  evidenceUrl?: string | null;
}

export interface UpdateOffboardingExitInterviewRequest {
  status: string;
  interviewerUserId?: string | null;
  scheduledAt?: string | null;
  questionnaireJson?: string | null;
  /** Confidential: ignored (existing value kept) without ViewConfidentialInformation. */
  responsesJson?: string | null;
  /** Confidential: ignored (existing value kept) without ViewConfidentialInformation. */
  hrNotes?: string | null;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface OffboardingTemplateTask {
  id: string;
  title: string;
  description?: string | null;
  category: OffboardingTaskCategory | string;
  displayOrder: number;
  assignmentType: OffboardingAssignmentType | string;
  defaultAssigneeUserId?: string | null;
  dueOffsetDays?: number | null;
  isRequired: boolean;
  requiresDocument: boolean;
  documentCategory?: string | null;
  requiresApproval: boolean;
  dependsOnTaskId?: string | null;
}

export interface OffboardingTemplateListItem {
  id: string;
  name: string;
  description?: string | null;
  separationType?: string | null;
  departmentId?: string | null;
  department?: string | null;
  jobTitleId?: string | null;
  jobTitle?: string | null;
  employmentTypeId?: string | null;
  employmentType?: string | null;
  estimatedDurationDays?: number | null;
  isActive: boolean;
  isDefault: boolean;
  version: number;
  taskCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface OffboardingTemplateDetail extends OffboardingTemplateListItem {
  tasks: OffboardingTemplateTask[];
}

export interface OffboardingTemplateListQuery {
  search?: string;
  departmentId?: string;
  separationType?: string;
  isActive?: boolean;
  includeArchived?: boolean;
}

export interface UpsertOffboardingTemplateTaskRequest {
  /** Client-side reference, only used to express `dependsOnTaskId` inside the same payload. */
  id?: string | null;
  title: string;
  description?: string | null;
  category: string;
  assignmentType: string;
  defaultAssigneeUserId?: string | null;
  dueOffsetDays?: number | null;
  isRequired: boolean;
  requiresDocument: boolean;
  documentCategory?: string | null;
  requiresApproval: boolean;
  dependsOnTaskId?: string | null;
}

export interface UpsertOffboardingTemplateRequest {
  name: string;
  description?: string | null;
  separationType?: string | null;
  departmentId?: string | null;
  jobTitleId?: string | null;
  employmentTypeId?: string | null;
  estimatedDurationDays?: number | null;
  isActive: boolean;
  isDefault: boolean;
  tasks: UpsertOffboardingTemplateTaskRequest[];
}

// ---------------------------------------------------------------------------
// Notification settings
// ---------------------------------------------------------------------------

export interface OffboardingNotificationSetting {
  triggerCode: string;
  isEnabled: boolean;
  channelEmail: boolean;
  channelWhatsapp: boolean;
  daysBefore?: number | null;
  recipients: string[];
  updatedAt?: string | null;
}

export interface UpdateOffboardingNotificationSettingRequest {
  triggerCode: string;
  isEnabled: boolean;
  channelEmail: boolean;
  channelWhatsapp: boolean;
  daysBefore?: number | null;
  recipients?: string[];
}

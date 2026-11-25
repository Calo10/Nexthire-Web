/** Capability strings returned by `GET /api/onboardings/capabilities`. */
export const ONBOARDING_PERMISSIONS = {
  View: 'Onboarding.View',
  Create: 'Onboarding.Create',
  Edit: 'Onboarding.Edit',
  Cancel: 'Onboarding.Cancel',
  Complete: 'Onboarding.Complete',
  ManageTemplates: 'Onboarding.ManageTemplates',
  ManageTasks: 'Onboarding.ManageTasks',
  ApproveTasks: 'Onboarding.ApproveTasks',
  ManageDocuments: 'Onboarding.ManageDocuments',
  ManageAutomations: 'Onboarding.ManageAutomations',
} as const;

export type OnboardingPermission = (typeof ONBOARDING_PERMISSIONS)[keyof typeof ONBOARDING_PERMISSIONS];

export const ONBOARDING_STATUSES = ['NotStarted', 'InProgress', 'InReview', 'Completed', 'Cancelled'] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

/** Kanban columns, in display order (Cancelled is excluded from the pipeline). */
export const ONBOARDING_PIPELINE_STATUSES = ['NotStarted', 'InProgress', 'InReview', 'Completed'] as const;

export const ACTIVE_ONBOARDING_STATUSES: readonly string[] = ['NotStarted', 'InProgress', 'InReview'];

export const ONBOARDING_TASK_STATUSES = ['Pending', 'InProgress', 'Completed', 'Cancelled', 'Blocked'] as const;
export type OnboardingTaskStatus = (typeof ONBOARDING_TASK_STATUSES)[number];

export const ONBOARDING_TASK_CATEGORIES = [
  'Documentation',
  'Administrative',
  'ITEquipment',
  'Training',
  'Compliance',
  'Orientation',
  'Meetings',
  'Other',
] as const;
export type OnboardingTaskCategory = (typeof ONBOARDING_TASK_CATEGORIES)[number];

export const ONBOARDING_ASSIGNMENT_TYPES = ['Employee', 'DirectManager', 'HR', 'IT', 'SpecificUser'] as const;
export type OnboardingAssignmentType = (typeof ONBOARDING_ASSIGNMENT_TYPES)[number];

export const ONBOARDING_TRIGGERS = [
  'OnboardingCreated',
  'OnboardingStarted',
  'OnboardingInReview',
  'OnboardingCompleted',
  'OnboardingCancelled',
  'TaskAssigned',
  'TaskDueSoon',
  'TaskOverdue',
  'TaskApprovalRequested',
  'TaskApproved',
  'TaskRejected',
] as const;

export const ONBOARDING_RECIPIENT_ROLES = ['Owner', 'Assignee', 'Employee', 'DirectManager'] as const;

// ---------------------------------------------------------------------------
// Onboardings
// ---------------------------------------------------------------------------

export interface OnboardingListItem {
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
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  status: OnboardingStatus | string;
  progressPercent: number;
  totalTasks: number;
  completedTasks: number;
  overdueCount: number;
  createdAt: string;
}

export interface OnboardingTask {
  id: string;
  onboardingId: string;
  templateTaskId?: string | null;
  title: string;
  description?: string | null;
  category: OnboardingTaskCategory | string;
  assignmentType: OnboardingAssignmentType | string;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  dueDate?: string | null;
  status: OnboardingTaskStatus | string;
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
  displayOrder: number;
  dependsOnTaskId?: string | null;
  isWaived: boolean;
  isOverdue: boolean;
  createdAt: string;
}

export interface OnboardingDocument {
  id: string;
  onboardingId: string;
  onboardingTaskId?: string | null;
  employeeDocumentId?: string | null;
  category: string;
  name: string;
  isRequired: boolean;
  status: 'Missing' | 'Uploaded' | 'PendingApproval' | 'Approved' | 'Rejected' | string;
  createdAt: string;
}

export interface OnboardingDetail extends OnboardingListItem {
  templateVersion?: number | null;
  notes?: string | null;
  cancelReason?: string | null;
  updatedAt?: string | null;
  canComplete: boolean;
  completionBlockers: string[];
  tasks: OnboardingTask[];
  documents: OnboardingDocument[];
}

export interface OnboardingActivity {
  id: string;
  onboardingId: string;
  activityType: string;
  summary: string;
  detailsJson?: string | null;
  createdAt: string;
  createdBy?: string | null;
  createdByName?: string | null;
}

export type OnboardingSortKey = 'employee' | 'startDate' | 'expectedCompletion' | 'status' | 'created';

export interface OnboardingFilterState {
  departmentId: string;
  ownerUserId: string;
  templateId: string;
  status: string;
  overdueOnly: boolean;
}

export const EMPTY_ONBOARDING_FILTERS: OnboardingFilterState = {
  departmentId: '',
  ownerUserId: '',
  templateId: '',
  status: '',
  overdueOnly: false,
};

export function activeOnboardingFilterCount(f: OnboardingFilterState): number {
  return [f.departmentId, f.ownerUserId, f.templateId, f.status].filter(Boolean).length + (f.overdueOnly ? 1 : 0);
}

export interface OnboardingListQuery {
  search?: string;
  departmentId?: string;
  ownerUserId?: string;
  templateId?: string;
  status?: string;
  startFrom?: string;
  startTo?: string;
  overdueOnly?: boolean;
  page?: number;
  pageSize?: number;
  sort?: OnboardingSortKey;
  dir?: 'asc' | 'desc';
}

export type OnboardingPipelineQuery = Pick<
  OnboardingListQuery,
  'search' | 'departmentId' | 'ownerUserId' | 'templateId' | 'startFrom' | 'startTo' | 'overdueOnly'
>;

export interface OnboardingPipelineCard {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  startDate?: string | null;
  expectedCompletion?: string | null;
  progressPercent: number;
  overdueCount: number;
  ownerName?: string | null;
  templateName?: string | null;
}

export interface OnboardingPipelineColumn {
  status: string;
  label: string;
  count: number;
  cards: OnboardingPipelineCard[];
}

export interface OnboardingPipeline {
  columns: OnboardingPipelineColumn[];
}

export interface OnboardingSummary {
  periodStart: string;
  periodEnd: string;
  activeOnboardings: number;
  notStarted: number;
  inProgress: number;
  inReview: number;
  startedInPeriod: number;
  previousStartedInPeriod: number;
  completedInPeriod: number;
  previousCompletedInPeriod: number;
  averageCompletionDays: number;
  previousAverageCompletionDays: number;
  averageProgressPercent: number;
  overdueTasks: number;
  overdueOnboardings: number;
  upcomingStarts: number;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
}

export interface CreateOnboardingTaskRequest {
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

export interface CreateOnboardingRequest {
  employeeId: string;
  templateId?: string | null;
  ownerUserId?: string | null;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  notes?: string | null;
  startImmediately?: boolean;
  excludedTemplateTaskIds?: string[];
  additionalTasks?: CreateOnboardingTaskRequest[];
}

export interface StartOnboardingForEmployeeRequest {
  templateId?: string | null;
  ownerUserId?: string | null;
  startDate?: string | null;
  startImmediately?: boolean;
}

export interface UpdateOnboardingRequest {
  ownerUserId?: string | null;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  notes?: string | null;
}

export interface UpdateOnboardingTaskRequest extends CreateOnboardingTaskRequest {
  status?: string | null;
  isWaived?: boolean | null;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface OnboardingTemplateTask {
  id: string;
  title: string;
  description?: string | null;
  category: OnboardingTaskCategory | string;
  displayOrder: number;
  assignmentType: OnboardingAssignmentType | string;
  defaultAssigneeUserId?: string | null;
  dueOffsetDays?: number | null;
  isRequired: boolean;
  requiresDocument: boolean;
  documentCategory?: string | null;
  requiresApproval: boolean;
  dependsOnTaskId?: string | null;
}

export interface OnboardingTemplateListItem {
  id: string;
  name: string;
  description?: string | null;
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

export interface OnboardingTemplateDetail extends OnboardingTemplateListItem {
  tasks: OnboardingTemplateTask[];
}

export interface OnboardingTemplateListQuery {
  search?: string;
  departmentId?: string;
  isActive?: boolean;
  includeArchived?: boolean;
}

export interface UpsertOnboardingTemplateTaskRequest {
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

export interface UpsertOnboardingTemplateRequest {
  name: string;
  description?: string | null;
  departmentId?: string | null;
  jobTitleId?: string | null;
  employmentTypeId?: string | null;
  estimatedDurationDays?: number | null;
  isActive: boolean;
  isDefault: boolean;
  tasks: UpsertOnboardingTemplateTaskRequest[];
}

// ---------------------------------------------------------------------------
// Notification settings
// ---------------------------------------------------------------------------

export interface OnboardingNotificationSetting {
  triggerCode: string;
  isEnabled: boolean;
  channelEmail: boolean;
  channelWhatsapp: boolean;
  daysBefore?: number | null;
  recipients: string[];
  updatedAt?: string | null;
}

export interface UpdateOnboardingNotificationSettingRequest {
  triggerCode: string;
  isEnabled: boolean;
  channelEmail: boolean;
  channelWhatsapp: boolean;
  daysBefore?: number | null;
  recipients?: string[];
}

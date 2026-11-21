export type WorkflowExecutionStatus =
  | 'Pending'
  | 'Running'
  | 'Waiting'
  | 'Completed'
  | 'Failed'
  | 'Cancelled'
  | string;

export type WorkflowExecutionListItem = {
  id: string;
  workflowDefinitionId: string;
  entityType: string;
  entityId: string;
  status: WorkflowExecutionStatus;
  currentStepId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  revision: number;
};

export type CreateWorkflowExecutionRequest = {
  workflowDefinitionId: string;
  entityType: string;
  entityId: string;
  initialVariables?: Record<string, unknown> | null;
};

export type WorkflowExecution = {
  id: string;
  organizationId: string;
  workflowDefinitionId: string;
  workflowVersion: number;
  entityType: string;
  entityId: string;
  status: WorkflowExecutionStatus;
  currentStepId?: string | null;
  currentStepExecutionId?: string | null;
  conversationId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  startedAt?: string | null;
  waitingSince?: string | null;
  resumeAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  revision: number;
  variables?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

/** GET /workflow-executions/{id}/history */
export type WorkflowExecutionHistoryItem = {
  id: string;
  eventType: string;
  occurredAt: string;
  message: string;
  data?: unknown;
};

/** GET /workflow-executions/{id}/steps */
export type WorkflowExecutionStepItem = {
  id: string;
  stepDefinitionId: string;
  activityType: string;
  status: string;
  attempt: number;
  startedAt?: string | null;
  waitingSince?: string | null;
  resumeAt?: string | null;
  completedAt?: string | null;
  waitingEventType?: string | null;
  correlationId?: string | null;
  externalReferenceId?: string | null;
  input?: unknown;
  output?: unknown;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
};

/** GET /workflow-executions/{id}/events */
export type WorkflowExecutionEventReceipt = {
  eventId: string;
  eventType?: string | null;
  correlationId?: string | null;
  processedAt: string;
};

export const EXECUTION_STATUSES = [
  'Pending',
  'Running',
  'Waiting',
  'Completed',
  'Failed',
  'Cancelled',
] as const;

export function normalizeExecutionStatus(status: string): string {
  if (!status) return 'Pending';
  const match = EXECUTION_STATUSES.find((s) => s.toLowerCase() === status.toLowerCase());
  return match ?? status;
}

export function isTerminalExecutionStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === 'completed' || s === 'cancelled' || s === 'failed';
}

/** Cancel is available for non-terminal executions (Pending, Running, Waiting, …). */
export function canCancelExecution(status: string): boolean {
  return !isTerminalExecutionStatus(status);
}

/** Resume is only available while Waiting. */
export function canResumeExecution(status: string): boolean {
  return status.toLowerCase() === 'waiting';
}

/** Retry is only available for Failed executions. */
export function canRetryExecution(status: string): boolean {
  return status.toLowerCase() === 'failed';
}

export function stepHasOutput(step: WorkflowExecutionStepItem): boolean {
  const output = step.output;
  if (output === null || output === undefined) return false;
  if (typeof output === 'string' && output.trim() === '') return false;
  return true;
}

/** Steps shown in Outputs: those with output, plus failed/running/pending attempts. */
export function isOutputsTabStep(step: WorkflowExecutionStepItem): boolean {
  if (stepHasOutput(step)) return true;
  const status = step.status.toLowerCase();
  return status === 'failed' || status === 'running' || status === 'pending';
}

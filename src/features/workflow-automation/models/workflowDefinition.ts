import { DEFAULT_TRIGGER_TYPE } from './triggerCatalog';

export type WorkflowDefinitionStatus = 'Draft' | 'Published' | 'Archived' | string;

export type WorkflowTriggerDefinition = {
  type: string;
  configuration?: Record<string, unknown> | null;
};

export type WorkflowTransitionDefinition = {
  key: string;
  targetStepId: string;
  description?: string | null;
};

export type WorkflowStepDefinition = {
  id: string;
  name: string;
  activityType: string;
  configuration: Record<string, unknown>;
  nextStepId?: string | null;
  failureStepId?: string | null;
  timeoutStepId?: string | null;
  transitions: WorkflowTransitionDefinition[];
  maxAttempts?: number | null;
  retryDelay?: string | null;
  timeout?: string | null;
  metadata: Record<string, unknown>;
};

export type WorkflowDefinition = {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  version: number;
  status: WorkflowDefinitionStatus;
  startStepId: string;
  steps: WorkflowStepDefinition[];
  /** Workflow-level trigger. Not a canvas node / activity. */
  trigger: WorkflowTriggerDefinition;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  createdBy?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  publishedAt?: string | null;
  archivedAt?: string | null;
};

export type WorkflowDefinitionListItem = {
  id: string;
  name: string;
  description?: string | null;
  version: number;
  status: WorkflowDefinitionStatus;
  createdAt: string;
  updatedAt?: string | null;
  publishedAt?: string | null;
  archivedAt?: string | null;
};

export type CreateWorkflowDefinitionRequest = {
  name: string;
  description?: string | null;
  startStepId: string;
  trigger: WorkflowTriggerDefinition;
  steps: WorkflowStepDefinition[];
  metadata?: Record<string, unknown> | null;
};

export type UpdateWorkflowDefinitionRequest = {
  name: string;
  description?: string | null;
  startStepId: string;
  trigger: WorkflowTriggerDefinition;
  steps: WorkflowStepDefinition[];
  metadata?: Record<string, unknown> | null;
};

export function createDefaultTrigger(): WorkflowTriggerDefinition {
  return {
    type: DEFAULT_TRIGGER_TYPE,
    configuration: {},
  };
}

/** Maps API/state trigger. Missing trigger defaults to Manual in the designer UI. */
export function resolveWorkflowTrigger(
  trigger?: WorkflowTriggerDefinition | null,
): WorkflowTriggerDefinition {
  if (trigger?.type?.trim()) {
    return {
      type: trigger.type.trim(),
      configuration: normalizeConfiguration(trigger.configuration),
    };
  }
  return createDefaultTrigger();
}

/** Designer metadata only — strips any legacy functional keys. */
export function normalizeDesignerMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const next = normalizeMetadata(metadata);
  delete next['workflow.trigger'];
  return next;
}

export const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

export const DESIGNER_POSITION_X = 'designer.positionX';
export const DESIGNER_POSITION_Y = 'designer.positionY';

export function isDraftStatus(status: string): boolean {
  return status.toLowerCase() === 'draft';
}

export function isPublishedStatus(status: string): boolean {
  return status.toLowerCase() === 'published';
}

export function isArchivedStatus(status: string): boolean {
  return status.toLowerCase() === 'archived';
}

export function isEditableStatus(status: string): boolean {
  return isDraftStatus(status);
}

export function normalizeConfiguration(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function getStepPosition(step: WorkflowStepDefinition): { x: number; y: number } {
  const meta = normalizeMetadata(step.metadata);
  const x = Number(meta[DESIGNER_POSITION_X]);
  const y = Number(meta[DESIGNER_POSITION_Y]);
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  };
}

export function withStepPosition(
  step: WorkflowStepDefinition,
  x: number,
  y: number,
): WorkflowStepDefinition {
  return {
    ...step,
    metadata: {
      ...normalizeMetadata(step.metadata),
      [DESIGNER_POSITION_X]: x,
      [DESIGNER_POSITION_Y]: y,
    },
  };
}

export function createDefaultEndStep(id: string): WorkflowStepDefinition {
  return {
    id,
    name: 'End',
    activityType: 'flow.end',
    configuration: {},
    nextStepId: null,
    failureStepId: null,
    timeoutStepId: null,
    transitions: [],
    maxAttempts: null,
    retryDelay: null,
    timeout: null,
    metadata: {
      [DESIGNER_POSITION_X]: 280,
      [DESIGNER_POSITION_Y]: 120,
    },
  };
}

import {
  EMPTY_GUID,
  type CreateWorkflowDefinitionRequest,
  type WorkflowStepDefinition,
  type WorkflowTriggerDefinition,
} from './workflowDefinition';
import { getActivityDescriptor, isBranchActivity } from './activityCatalog';
import { getTriggerDescriptor } from './triggerCatalog';

export type WorkflowTemplateCategory =
  | 'Recruiting'
  | 'Screening'
  | 'Interview'
  | 'Nurture'
  | 'Sourcing'
  | 'Engagement';

export type WorkflowTemplatePreviewNode =
  | { kind: 'trigger'; label: string }
  | { kind: 'step'; label: string; activityType: string }
  | { kind: 'branch'; label: string; trueLabel: string; falseLabel: string; truePath: string[]; falsePath: string[] }
  | { kind: 'end'; label?: string };

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  category: WorkflowTemplateCategory;
  icon: string;
  /** Short activity names for card chips */
  highlights: string[];
  trigger: WorkflowTriggerDefinition;
  startStepId: string;
  steps: WorkflowStepDefinition[];
  /** Simple structural preview (not React Flow). */
  preview: WorkflowTemplatePreviewNode[];
};

export type TemplateValidationResult = {
  valid: boolean;
  errors: string[];
};

function isEmptyRef(id: string | null | undefined): boolean {
  return !id || id === EMPTY_GUID;
}

/**
 * Validates a built-in template before calling the create API.
 * Does not require user-specific configuration fields to be filled.
 */
export function validateWorkflowTemplate(template: WorkflowTemplate): TemplateValidationResult {
  const errors: string[] = [];

  if (!template.id?.trim()) errors.push('Template id is required.');
  if (!template.name?.trim()) errors.push('Template name is required.');
  if (!template.trigger?.type?.trim()) {
    errors.push('Template trigger.type is required.');
  } else if (!getTriggerDescriptor(template.trigger.type)) {
    errors.push(`Unknown trigger type "${template.trigger.type}".`);
  }

  if (!template.steps?.length) {
    errors.push('Template must include at least one step.');
    return { valid: false, errors };
  }

  const stepIds = new Set(template.steps.map((s) => s.id));
  if (stepIds.size !== template.steps.length) {
    errors.push('Template has duplicate step ids.');
  }

  if (!template.startStepId || !stepIds.has(template.startStepId)) {
    errors.push('Template startStepId must reference an existing step.');
  }

  const assertRef = (ref: string | null | undefined, label: string) => {
    if (isEmptyRef(ref)) return;
    if (!stepIds.has(ref!)) {
      errors.push(`${label} points to missing step "${ref}".`);
    }
  };

  for (const step of template.steps) {
    if (!step.id?.trim()) {
      errors.push('Every step must have an id.');
      continue;
    }
    if (!step.activityType?.trim()) {
      errors.push(`Step "${step.name || step.id}" is missing activityType.`);
    } else if (!getActivityDescriptor(step.activityType)) {
      errors.push(`Step "${step.name || step.id}" has unknown activityType "${step.activityType}".`);
    }

    assertRef(step.nextStepId, `Step "${step.name || step.id}" nextStepId`);
    assertRef(step.failureStepId, `Step "${step.name || step.id}" failureStepId`);
    assertRef(step.timeoutStepId, `Step "${step.name || step.id}" timeoutStepId`);

    const keys = new Set<string>();
    for (const transition of step.transitions ?? []) {
      if (!transition.key?.trim()) {
        errors.push(`Step "${step.name || step.id}" has a transition without a key.`);
        continue;
      }
      const normalized = transition.key.toLowerCase();
      if (keys.has(normalized)) {
        errors.push(`Step "${step.name || step.id}" has duplicate transition key "${transition.key}".`);
      }
      keys.add(normalized);
      assertRef(
        transition.targetStepId,
        `Step "${step.name || step.id}" transition "${transition.key}"`,
      );
    }

    if (isBranchActivity(step.activityType)) {
      if (!keys.has('true')) {
        errors.push(`Branch step "${step.name || step.id}" requires transition key "true".`);
      }
      if (!keys.has('false')) {
        errors.push(`Branch step "${step.name || step.id}" requires transition key "false".`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function remapRef(
  id: string | null | undefined,
  idMap: Map<string, string>,
): string | null {
  if (isEmptyRef(id)) return id === EMPTY_GUID ? EMPTY_GUID : null;
  const next = idMap.get(id!);
  if (!next) {
    throw new Error(`Cannot remap step reference "${id}" — not found in template.`);
  }
  return next;
}

/**
 * Deep-clones a template into a create request with fresh step IDs and remapped refs.
 */
export function materializeWorkflowTemplate(
  template: WorkflowTemplate,
  name: string,
  description?: string | null,
  createId: () => string = () => crypto.randomUUID(),
): CreateWorkflowDefinitionRequest {
  const validation = validateWorkflowTemplate(template);
  if (!validation.valid) {
    throw new Error(validation.errors[0] || 'Invalid workflow template.');
  }

  const idMap = new Map<string, string>();
  for (const step of template.steps) {
    idMap.set(step.id, createId());
  }

  const steps: WorkflowStepDefinition[] = template.steps.map((step) => ({
    id: idMap.get(step.id)!,
    name: step.name,
    activityType: step.activityType,
    configuration: { ...(step.configuration ?? {}) },
    nextStepId: remapRef(step.nextStepId, idMap),
    failureStepId: remapRef(step.failureStepId, idMap),
    timeoutStepId: remapRef(step.timeoutStepId, idMap),
    transitions: (step.transitions ?? []).map((t) => ({
      key: t.key,
      description: t.description ?? null,
      targetStepId: remapRef(t.targetStepId, idMap) ?? EMPTY_GUID,
    })),
    maxAttempts: step.maxAttempts ?? null,
    retryDelay: step.retryDelay ?? null,
    timeout: step.timeout ?? null,
    metadata: { ...(step.metadata ?? {}) },
  }));

  return {
    name: name.trim(),
    description: description?.trim() ? description.trim() : null,
    startStepId: idMap.get(template.startStepId)!,
    trigger: {
      type: template.trigger.type,
      configuration: { ...(template.trigger.configuration ?? {}) },
    },
    steps,
    metadata: {},
  };
}

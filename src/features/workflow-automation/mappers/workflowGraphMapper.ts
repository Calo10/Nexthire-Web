import type { Edge, Node } from '@xyflow/react';
import {
  EMPTY_GUID,
  getStepPosition,
  normalizeConfiguration,
  normalizeDesignerMetadata,
  normalizeMetadata,
  resolveWorkflowTrigger,
  withStepPosition,
  type WorkflowDefinition,
  type WorkflowStepDefinition,
  type WorkflowTransitionDefinition,
} from '../models/workflowDefinition';
import {
  applyOutboundWaitConfiguration,
  getActivityDescriptor,
  isBranchActivity,
  validateStepConfiguration,
} from '../models/activityCatalog';
import { conditionSummary } from '../lib/workflowExpression';

export type WorkflowStepNodeData = {
  stepId: string;
  name: string;
  activityType: string;
  activityName: string;
  isStart: boolean;
  hasErrors: boolean;
  errorCount: number;
  isBranch: boolean;
  transitionKeys: string[];
  conditionSummary: string | null;
  readOnly: boolean;
};

export type WorkflowGraph = {
  nodes: Node<WorkflowStepNodeData>[];
  edges: Edge[];
};

export function definitionToGraph(
  definition: WorkflowDefinition,
  options?: { readOnly?: boolean; stepErrors?: Record<string, string[]> },
): WorkflowGraph {
  const readOnly = options?.readOnly ?? false;
  const stepErrors = options?.stepErrors ?? {};
  const steps = definition.steps ?? [];

  const nodes: Node<WorkflowStepNodeData>[] = steps.map((step, index) => {
    const position = getStepPosition(step);
    const descriptor = getActivityDescriptor(step.activityType);
    const errors = stepErrors[step.id] ?? [];
    const transitionKeys = (step.transitions ?? []).map((t) => t.key).filter(Boolean);
    const x = position.x || 80 + (index % 3) * 280;
    const y = position.y || 80 + Math.floor(index / 3) * 160;
    const configuration = normalizeConfiguration(step.configuration);
    const condition =
      typeof configuration.condition === 'string' ? configuration.condition : null;

    return {
      id: step.id,
      type: 'workflowStep',
      position: { x, y },
      data: {
        stepId: step.id,
        name: step.name,
        activityType: step.activityType,
        activityName: descriptor?.name ?? step.activityType,
        isStart: step.id === definition.startStepId,
        hasErrors: errors.length > 0,
        errorCount: errors.length,
        isBranch: isBranchActivity(step.activityType),
        transitionKeys,
        conditionSummary: isBranchActivity(step.activityType)
          ? conditionSummary(condition)
          : null,
        readOnly,
      },
      draggable: !readOnly,
      selectable: true,
      connectable: !readOnly,
    };
  });

  const edges: Edge[] = [];
  const stepIds = new Set(steps.map((s) => s.id));

  for (const step of steps) {
    if (isBranchActivity(step.activityType)) {
      for (const transition of step.transitions ?? []) {
        if (!transition.targetStepId || transition.targetStepId === EMPTY_GUID) continue;
        if (!stepIds.has(transition.targetStepId)) continue;
        edges.push({
          id: `${step.id}|transition:${transition.key}|${transition.targetStepId}`,
          source: step.id,
          target: transition.targetStepId,
          sourceHandle: `transition:${transition.key}`,
          targetHandle: 'in',
          label: transition.key,
          type: 'smoothstep',
          data: { kind: 'transition', key: transition.key },
        });
      }
    } else if (step.nextStepId && step.nextStepId !== EMPTY_GUID && stepIds.has(step.nextStepId)) {
      edges.push({
        id: `${step.id}|next|${step.nextStepId}`,
        source: step.id,
        target: step.nextStepId,
        sourceHandle: 'out',
        targetHandle: 'in',
        type: 'smoothstep',
        data: { kind: 'next' },
      });
    }
  }

  return { nodes, edges };
}

export function graphToDefinition(
  definition: WorkflowDefinition,
  nodes: Node<WorkflowStepNodeData>[],
  edges: Edge[],
): WorkflowDefinition {
  const stepById = new Map(
    (definition.steps ?? []).map((step) => [step.id, { ...step } as WorkflowStepDefinition]),
  );

  // Apply positions and ensure every node maps to a step
  for (const node of nodes) {
    const existing = stepById.get(node.id);
    if (!existing) continue;
    stepById.set(node.id, withStepPosition(existing, node.position.x, node.position.y));
  }

  // Reset connection fields from edges
  for (const [id, step] of stepById) {
    if (isBranchActivity(step.activityType)) {
      const transitions = (step.transitions ?? []).map((t) => ({
        ...t,
        targetStepId: EMPTY_GUID,
      }));
      stepById.set(id, { ...step, transitions, nextStepId: null });
    } else {
      stepById.set(id, { ...step, nextStepId: null });
    }
  }

  for (const edge of edges) {
    const source = stepById.get(edge.source);
    if (!source) continue;

    if (isBranchActivity(source.activityType)) {
      const key =
        (edge.data && typeof edge.data === 'object' && 'key' in edge.data
          ? String((edge.data as { key?: string }).key || '')
          : '') ||
        (edge.sourceHandle?.startsWith('transition:')
          ? edge.sourceHandle.slice('transition:'.length)
          : '');
      if (!key) continue;

      const transitions = [...(source.transitions ?? [])];
      const idx = transitions.findIndex((t) => t.key.toLowerCase() === key.toLowerCase());
      const next: WorkflowTransitionDefinition = {
        key,
        targetStepId: edge.target,
        description: idx >= 0 ? transitions[idx].description : key,
      };
      if (idx >= 0) transitions[idx] = next;
      else transitions.push(next);
      stepById.set(source.id, { ...source, transitions, nextStepId: null });
    } else {
      stepById.set(source.id, { ...source, nextStepId: edge.target });
    }
  }

  // Preserve step order based on current definition, append any extras
  const ordered: WorkflowStepDefinition[] = [];
  const seen = new Set<string>();
  for (const step of definition.steps ?? []) {
    const updated = stepById.get(step.id);
    if (updated) {
      ordered.push(normalizeStep(updated));
      seen.add(step.id);
    }
  }
  for (const [id, step] of stepById) {
    if (!seen.has(id)) ordered.push(normalizeStep(step));
  }

  return {
    ...definition,
    steps: ordered,
  };
}

function normalizeStep(step: WorkflowStepDefinition): WorkflowStepDefinition {
  return {
    ...step,
    configuration: applyOutboundWaitConfiguration(
      step.activityType,
      normalizeConfiguration(step.configuration),
    ),
    metadata: normalizeMetadata(step.metadata),
    transitions: (step.transitions ?? []).map((t) => ({
      key: t.key,
      targetStepId: t.targetStepId || EMPTY_GUID,
      description: t.description ?? null,
    })),
    nextStepId: step.nextStepId || null,
    failureStepId: step.failureStepId || null,
    timeoutStepId: step.timeoutStepId || null,
  };
}

export type WorkflowValidationResult = {
  valid: boolean;
  errors: string[];
  stepErrors: Record<string, string[]>;
};

export function validateWorkflowForSave(definition: WorkflowDefinition): WorkflowValidationResult {
  const errors: string[] = [];
  const stepErrors: Record<string, string[]> = {};
  const steps = definition.steps ?? [];
  const stepIds = new Set(steps.map((s) => s.id));

  if (!definition.name?.trim()) {
    errors.push('Name is required.');
  }

  const trigger = resolveWorkflowTrigger(definition.trigger);
  if (!trigger.type?.trim()) {
    errors.push('Trigger is required.');
  }

  if (steps.length === 0) {
    errors.push('Add at least one step.');
  }

  if (!definition.startStepId || definition.startStepId === EMPTY_GUID) {
    errors.push('Start step is required.');
  } else if (!stepIds.has(definition.startStepId)) {
    errors.push('Start step must reference an existing step.');
  }

  for (const step of steps) {
    const local: string[] = [];
    if (!step.activityType?.trim()) {
      local.push('Activity type is required.');
    } else {
      local.push(
        ...validateStepConfiguration(
          step.activityType,
          normalizeConfiguration(step.configuration),
          { transitions: step.transitions },
        ),
      );
    }

    const refs: Array<[string | null | undefined, string]> = [
      [step.nextStepId, 'Next step'],
      [step.failureStepId, 'Failure step'],
      [step.timeoutStepId, 'Timeout step'],
    ];
    for (const [ref, label] of refs) {
      if (ref && ref !== EMPTY_GUID && !stepIds.has(ref)) {
        local.push(`${label} points to a missing step.`);
      }
    }

    const keys = new Set<string>();
    for (const transition of step.transitions ?? []) {
      if (!transition.key?.trim()) {
        local.push('Transition key is required.');
        continue;
      }
      const normalized = transition.key.toLowerCase();
      if (keys.has(normalized)) {
        local.push(`Duplicate transition key "${transition.key}".`);
      }
      keys.add(normalized);
      if (
        transition.targetStepId &&
        transition.targetStepId !== EMPTY_GUID &&
        !stepIds.has(transition.targetStepId)
      ) {
        local.push(`Transition "${transition.key}" points to a missing step.`);
      }
    }

    if (local.length) {
      stepErrors[step.id] = local;
      errors.push(`Step "${step.name || step.activityType}": ${local[0]}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    stepErrors,
  };
}

export function toUpdateRequest(definition: WorkflowDefinition) {
  const trigger = resolveWorkflowTrigger(definition.trigger);
  return {
    name: definition.name,
    description: definition.description ?? null,
    startStepId: definition.startStepId,
    trigger,
    steps: (definition.steps ?? []).map(normalizeStep),
    metadata: normalizeDesignerMetadata(definition.metadata),
  };
}

export function toCreateRequest(definition: {
  name: string;
  description?: string | null;
  startStepId: string;
  steps: WorkflowStepDefinition[];
  trigger?: WorkflowDefinition['trigger'] | null;
  metadata?: Record<string, unknown> | null;
}) {
  const trigger = resolveWorkflowTrigger(definition.trigger);
  return {
    name: definition.name,
    description: definition.description ?? null,
    startStepId: definition.startStepId,
    trigger,
    steps: (definition.steps ?? []).map(normalizeStep),
    metadata: normalizeDesignerMetadata(definition.metadata),
  };
}

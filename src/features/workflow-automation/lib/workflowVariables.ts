import { EMPTY_GUID, type WorkflowStepDefinition } from '../models/workflowDefinition';
import {
  getActivityDescriptor,
  isBranchActivity,
} from '../models/activityCatalog';
import {
  STANDARD_WORKFLOW_VARIABLES,
  variableFromPath,
  type ActivityOutputDescriptor,
  type WorkflowVariableDescriptor,
  type WorkflowVariableType,
} from '../models/variableCatalog';

/** Field keys that bind to a variable path (picker sets the whole value). */
const VARIABLE_FIELD_KEYS = new Set([
  'toVariable',
  'recipientVariable',
  'documentIdVariable',
  'recipientEmailVariable',
  'recipientNameVariable',
  'responseVariable',
  'outputVariable',
  'phoneVariable',
  'participantEmailVariable',
  'participantNameVariable',
  'conversationIdVariable',
  'correlationIdVariable',
  'assigneeVariable',
  'contactVariable',
  'variableName',
]);

/** Field keys that support {{Variable}} insertion. */
const TEMPLATE_FIELD_KEYS = new Set([
  'subjectTemplate',
  'messageTemplate',
  'bodyTemplate',
  'systemPrompt',
  'userPrompt',
  'prompt',
  'notesTemplate',
  'introMessage',
  'scriptTemplate',
  'descriptionTemplate',
  'titleTemplate',
  'subject',
  'message',
  'script',
]);

export function isVariableConfigurationField(key: string, valueKind?: string): boolean {
  if (valueKind === 'variable') return true;
  if (valueKind === 'template' || valueKind === 'plain') return false;
  return VARIABLE_FIELD_KEYS.has(key) || key.endsWith('Variable');
}

export function isTemplateConfigurationField(key: string, valueKind?: string): boolean {
  if (valueKind === 'template') return true;
  if (valueKind === 'variable' || valueKind === 'plain') return false;
  return TEMPLATE_FIELD_KEYS.has(key) || key.endsWith('Template') || key.endsWith('Prompt');
}

/**
 * Returns step ids that can reach `targetStepId` via workflow connections
 * (nextStepId, transitions, failureStepId, timeoutStepId). Excludes the target.
 */
export function getPredecessorStepIds(
  steps: WorkflowStepDefinition[],
  targetStepId: string,
): Set<string> {
  const incoming = new Map<string, string[]>();

  const addEdge = (from: string, to: string | null | undefined) => {
    if (!to || to === EMPTY_GUID || to === from) return;
    const list = incoming.get(to) ?? [];
    list.push(from);
    incoming.set(to, list);
  };

  for (const step of steps) {
    if (isBranchActivity(step.activityType)) {
      for (const t of step.transitions ?? []) {
        addEdge(step.id, t.targetStepId);
      }
    } else {
      addEdge(step.id, step.nextStepId);
    }
    addEdge(step.id, step.failureStepId);
    addEdge(step.id, step.timeoutStepId);
  }

  const predecessors = new Set<string>();
  const stack = [...(incoming.get(targetStepId) ?? [])];
  while (stack.length > 0) {
    const id = stack.pop()!;
    if (predecessors.has(id) || id === targetStepId) continue;
    predecessors.add(id);
    for (const parent of incoming.get(id) ?? []) {
      if (!predecessors.has(parent)) stack.push(parent);
    }
  }

  return predecessors;
}

function configuredVariablesFromStep(
  step: WorkflowStepDefinition,
): WorkflowVariableDescriptor[] {
  const config = step.configuration ?? {};
  const source = step.name || step.activityType;
  const results: WorkflowVariableDescriptor[] = [];

  const pushPath = (raw: unknown, type: WorkflowVariableType = 'unknown') => {
    if (typeof raw !== 'string' || !raw.trim()) return;
    results.push(
      variableFromPath(raw.trim(), {
        type,
        source,
        sourceKind: 'configured',
        producedByStepId: step.id,
      }),
    );
  };

  if (step.activityType === 'flow.setVariable') {
    pushPath(config.variableName ?? config.name, 'unknown');
  }

  if (step.activityType === 'ai.execute') {
    pushPath(config.responseVariable ?? config.outputVariable, 'object');
  }

  if (step.activityType === 'conversation.askQuestions') {
    const questions = config.questions;
    if (Array.isArray(questions)) {
      for (const q of questions) {
        if (q && typeof q === 'object' && !Array.isArray(q)) {
          pushPath((q as Record<string, unknown>).variable, 'string');
        }
      }
    }
  }

  return results;
}

function activityOutputVariablesFromStep(
  step: WorkflowStepDefinition,
): WorkflowVariableDescriptor[] {
  const descriptor = getActivityDescriptor(step.activityType);
  const outputs: ActivityOutputDescriptor[] = descriptor?.outputs ?? [];
  const source = step.name || descriptor?.name || step.activityType;

  return outputs.map((output) => {
    const path = (output.path ?? output.key).trim();
    const parts = path.split('.');
    const group = parts.length > 1 ? parts[0] : source;
    return variableFromPath(path, {
      type: output.type,
      source,
      sourceKind: 'activityOutput',
      producedByStepId: step.id,
      group,
    });
  });
}

function dedupeVariables(variables: WorkflowVariableDescriptor[]): WorkflowVariableDescriptor[] {
  const map = new Map<string, WorkflowVariableDescriptor>();
  for (const variable of variables) {
    const key = variable.path.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, variable);
      continue;
    }
    // Prefer configured / activity output over standard duplicates
    if (existing.sourceKind === 'standard' && variable.sourceKind !== 'standard') {
      map.set(key, variable);
    }
  }
  return [...map.values()];
}

/**
 * Variables available when configuring `selectedStepId`:
 * - always: standard LeadSphere variables
 * - plus: outputs / configured vars from predecessor steps only
 */
export function getAvailableVariablesForStep(
  steps: WorkflowStepDefinition[],
  selectedStepId: string | null | undefined,
): WorkflowVariableDescriptor[] {
  if (!selectedStepId) {
    return dedupeVariables([...STANDARD_WORKFLOW_VARIABLES]);
  }

  const predecessors = getPredecessorStepIds(steps, selectedStepId);
  const fromGraph: WorkflowVariableDescriptor[] = [];

  for (const step of steps) {
    if (!predecessors.has(step.id)) continue;
    fromGraph.push(...activityOutputVariablesFromStep(step));
    fromGraph.push(...configuredVariablesFromStep(step));
  }

  return dedupeVariables([...STANDARD_WORKFLOW_VARIABLES, ...fromGraph]).sort((a, b) => {
    const g = a.group.localeCompare(b.group);
    if (g !== 0) return g;
    return a.name.localeCompare(b.name);
  });
}

export function groupVariables(
  variables: WorkflowVariableDescriptor[],
): { group: string; variables: WorkflowVariableDescriptor[] }[] {
  const groups = new Map<string, WorkflowVariableDescriptor[]>();
  for (const variable of variables) {
    const list = groups.get(variable.group) ?? [];
    list.push(variable);
    groups.set(variable.group, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, vars]) => ({
      group,
      variables: vars.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

export function insertTemplateVariable(
  current: string,
  variablePath: string,
  selectionStart: number,
  selectionEnd: number,
): { value: string; cursor: number } {
  const token = `{{${variablePath}}}`;
  const start = Math.max(0, Math.min(selectionStart, current.length));
  const end = Math.max(start, Math.min(selectionEnd, current.length));
  const value = `${current.slice(0, start)}${token}${current.slice(end)}`;
  return { value, cursor: start + token.length };
}

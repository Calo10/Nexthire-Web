export type WorkflowVariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'unknown';

export type WorkflowVariableSourceKind = 'standard' | 'activityOutput' | 'configured';

export type WorkflowVariableDescriptor = {
  /** Full path used in configuration / templates, e.g. Candidate.Email */
  path: string;
  /** Leaf display name, e.g. Email */
  name: string;
  /** Group heading, e.g. Candidate */
  group: string;
  type: WorkflowVariableType;
  /** Human source label shown in the picker */
  source: string;
  sourceKind: WorkflowVariableSourceKind;
  producedByStepId?: string;
};

export type ActivityOutputDescriptor = {
  key: string;
  type: WorkflowVariableType;
  /** Optional full path override (defaults to key). */
  path?: string;
};

/** Standard NextHire recruiting variables — frontend catalog only. */
export const STANDARD_WORKFLOW_VARIABLES: WorkflowVariableDescriptor[] = [
  std('Candidate.Id', 'string'),
  std('Candidate.FirstName', 'string'),
  std('Candidate.LastName', 'string'),
  std('Candidate.Name', 'string'),
  std('Candidate.Email', 'string'),
  std('Candidate.Phone', 'string'),
  std('Candidate.Source', 'string'),
  std('Application.Id', 'string'),
  std('Application.Status', 'string'),
  std('Application.Stage', 'string'),
  std('Application.StageId', 'string'),
  std('Application.FitScore', 'number'),
  std('Job.Id', 'string'),
  std('Job.Title', 'string'),
  std('Conversation.Transcript', 'string'),
  std('Conversation.Answers', 'object'),
  std('Agent.Id', 'string'),
  std('Document.Id', 'string'),
  std('Document.Url', 'string'),
  std('Meeting.Url', 'string'),
  std('Meeting.BookingUrl', 'string'),
  std('Task.Id', 'string'),
  std('Workflow.ExecutionId', 'string'),
  std('Workflow.EntityType', 'string'),
  std('Workflow.EntityId', 'string'),
];

function std(path: string, type: WorkflowVariableType): WorkflowVariableDescriptor {
  const parts = path.split('.');
  const group = parts[0] || 'Variables';
  const name = parts.slice(1).join('.') || path;
  return {
    path,
    name,
    group,
    type,
    source: group,
    sourceKind: 'standard',
  };
}

export function variableFromPath(
  path: string,
  options: {
    type?: WorkflowVariableType;
    source: string;
    sourceKind: WorkflowVariableSourceKind;
    producedByStepId?: string;
    group?: string;
  },
): WorkflowVariableDescriptor {
  const trimmed = path.trim();
  const parts = trimmed.split('.').filter(Boolean);
  const group = options.group ?? parts[0] ?? options.source;
  const name = parts.length > 1 ? parts.slice(1).join('.') : trimmed;
  return {
    path: trimmed,
    name,
    group,
    type: options.type ?? 'unknown',
    source: options.source,
    sourceKind: options.sourceKind,
    producedByStepId: options.producedByStepId,
  };
}

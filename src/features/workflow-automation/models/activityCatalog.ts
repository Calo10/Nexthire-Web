import type { ActivityOutputDescriptor, WorkflowVariableType } from './variableCatalog';

export type { ActivityOutputDescriptor };

export type ActivityCategory =
  | 'Flow'
  | 'Communication'
  | 'Documents'
  | 'Meetings'
  | 'AI'
  | 'Conversation'
  | 'NextHire';

export type ConfigurationFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'number'
  | 'checkbox'
  | 'json'
  | 'expression';

/** How DynamicActivityForm treats the field for the Variables Explorer. */
export type ConfigurationFieldValueKind = 'plain' | 'variable' | 'template' | 'expression';

export type ConfigurationFieldOption = {
  value: string;
  label: string;
};

export type ConfigurationField = {
  key: string;
  label: string;
  type: ConfigurationFieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: ConfigurationFieldOption[];
  helpText?: string;
  /** Only render when another config value matches. */
  visibleWhen?: { key: string; equals: unknown };
  /** Frontend-only: drives WorkflowVariablePicker integration. */
  valueKind?: ConfigurationFieldValueKind;
};

export const EMAIL_REPLY_EVENT = 'email.reply.received';
export const WHATSAPP_REPLY_EVENT = 'whatsapp.received';

const inboundWaitEvents: ConfigurationFieldOption[] = [
  { value: EMAIL_REPLY_EVENT, label: 'Email reply' },
  { value: 'email.received', label: 'Inbound email (new thread)' },
  { value: WHATSAPP_REPLY_EVENT, label: 'WhatsApp reply' },
  { value: 'conversation.completed', label: 'Questionnaire finished' },
  { value: 'signature.completed', label: 'Document signed' },
  { value: 'meeting.completed', label: 'Meeting booked' },
];

export type ActivityDescriptor = {
  type: string;
  name: string;
  icon: string;
  category: ActivityCategory;
  description?: string;
  configurationFields: ConfigurationField[];
  /** Frontend-only declared outputs produced when the activity completes. */
  outputs?: ActivityOutputDescriptor[];
  /** When true, step uses transitions instead of a single nextStepId. */
  isBranch?: boolean;
};

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  'Flow',
  'Communication',
  'Documents',
  'Meetings',
  'AI',
  'Conversation',
  'NextHire',
];

const delayUnits: ConfigurationFieldOption[] = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

function out(key: string, type: WorkflowVariableType, path?: string): ActivityOutputDescriptor {
  return path ? { key, type, path } : { key, type };
}

export function getActivityByType(type: string | null | undefined): ActivityDescriptor | undefined {
  if (!type) return undefined;
  return ACTIVITY_CATALOG.find((activity) => activity.type === type);
}

/**
 * Local activity catalog. configurationFields drive the right-hand dynamic form.
 * outputs is frontend metadata only — never sent as a separate backend payload.
 */
export const ACTIVITY_CATALOG: ActivityDescriptor[] = [
  {
    type: 'flow.end',
    name: 'End',
    description: 'Completes the workflow.',
    category: 'Flow',
    icon: 'stop',
    configurationFields: [],
  },
  {
    type: 'flow.delay',
    name: 'Delay',
    description: 'Waits for a duration before continuing.',
    category: 'Flow',
    icon: 'clock',
    configurationFields: [
      {
        key: 'duration',
        label: 'Duration',
        type: 'number',
        required: true,
        placeholder: '1',
        defaultValue: 1,
      },
      {
        key: 'unit',
        label: 'Unit',
        type: 'select',
        required: true,
        defaultValue: 'days',
        options: delayUnits,
      },
    ],
  },
  {
    type: 'flow.waitForEvent',
    name: 'Wait Event',
    description: 'Pauses until a correlated event arrives.',
    category: 'Flow',
    icon: 'hourglass',
    configurationFields: [
      {
        key: 'eventType',
        label: 'Wait for',
        type: 'select',
        required: true,
        defaultValue: EMAIL_REPLY_EVENT,
        options: inboundWaitEvents,
        helpText: 'Must match how the inbound webhook resumes: email/WhatsApp reply, signature, or meeting.',
      },
      {
        key: 'correlationKey',
        label: 'Match on',
        type: 'text',
        required: true,
        placeholder: 'Candidate.Email',
        defaultValue: 'Candidate.Email',
        valueKind: 'variable',
        helpText: 'Use Candidate.Email for email replies or Candidate.Phone for WhatsApp. Never MessageId.',
      },
      {
        key: 'timeout',
        label: 'Timeout (seconds)',
        type: 'number',
        required: false,
        placeholder: '259200',
        defaultValue: 259200,
      },
    ],
  },
  {
    type: 'flow.branch',
    name: 'Branch',
    description: 'Evaluates a condition and follows a named transition.',
    category: 'Flow',
    icon: 'branch',
    isBranch: true,
    configurationFields: [
      {
        key: 'condition',
        label: 'Condition',
        type: 'expression',
        required: true,
        placeholder: 'AI.Result.score >= 80',
        valueKind: 'expression',
      },
    ],
  },
  {
    type: 'flow.setVariable',
    name: 'Set Variable',
    description: 'Writes a value into the workflow variable bag.',
    category: 'Flow',
    icon: 'variable',
    configurationFields: [
      {
        key: 'variableName',
        label: 'Variable Name',
        type: 'text',
        required: true,
        placeholder: 'Application.FitScore',
        valueKind: 'variable',
      },
      {
        key: 'value',
        label: 'Value',
        type: 'text',
        required: true,
        placeholder: 'hot',
        valueKind: 'template',
      },
    ],
  },
  {
    type: 'communication.sendEmail',
    name: 'Send Email',
    description: 'Sends an email using a template.',
    category: 'Communication',
    icon: 'email',
    outputs: [out('messageId', 'string', 'Email.MessageId')],
    configurationFields: [
      {
        key: 'template',
        label: 'Body',
        type: 'textarea',
        required: true,
        placeholder: 'Hello {{Candidate.FirstName}}',
        valueKind: 'template',
      },
      {
        key: 'toVariable',
        label: 'To',
        type: 'text',
        required: true,
        placeholder: 'Candidate.Email',
        defaultValue: 'Candidate.Email',
        valueKind: 'variable',
      },
      {
        key: 'waitForReply',
        label: 'Wait until they reply before continuing',
        type: 'checkbox',
        required: false,
        defaultValue: true,
        helpText: 'Required for replies to resume this workflow. Uncheck only if a later Wait Event, Ask Questions, or Delay handles the follow-up.',
      },
      {
        key: 'subjectTemplate',
        label: 'Subject',
        type: 'text',
        required: true,
        placeholder: 'Hello {{Candidate.FirstName}}',
        valueKind: 'template',
      },
    ],
  },
  {
    type: 'communication.sendWhatsApp',
    name: 'Send WhatsApp',
    description: 'Sends a WhatsApp message.',
    category: 'Communication',
    icon: 'whatsapp',
    outputs: [
      out('messageId', 'string', 'WhatsApp.MessageId'),
      out('conversationId', 'string', 'Conversation.Id'),
      out('attachmentUrl', 'string', 'WhatsApp.AttachmentUrl'),
    ],
    configurationFields: [
      {
        key: 'toVariable',
        label: 'To',
        type: 'text',
        required: true,
        placeholder: 'Candidate.Phone',
        defaultValue: 'Candidate.Phone',
        valueKind: 'variable',
      },
      {
        key: 'messageTemplate',
        label: 'Message',
        type: 'textarea',
        required: true,
        valueKind: 'template',
      },
      {
        key: 'waitForReply',
        label: 'Wait until they reply before continuing',
        type: 'checkbox',
        required: false,
        defaultValue: true,
        helpText: 'Required for WhatsApp replies to resume this workflow. Uncheck only if a later Wait Event or Delay handles the follow-up.',
      },
    ],
  },
  {
    type: 'communication.call',
    name: 'Call',
    description: 'Records a call follow-up in the execution (LeadSphere has no dialer).',
    category: 'Communication',
    icon: 'phone',
    configurationFields: [
      {
        key: 'phoneVariable',
        label: 'Phone',
        type: 'text',
        required: true,
        placeholder: 'Candidate.Phone',
        valueKind: 'variable',
      },
      {
        key: 'scriptTemplate',
        label: 'Script',
        type: 'textarea',
        required: false,
        valueKind: 'template',
      },
    ],
  },
  {
    type: 'documents.send',
    name: 'Send document',
    description: 'Sends a document to a recipient.',
    category: 'Documents',
    icon: 'document',
    outputs: [
      out('documentId', 'string', 'Document.Id'),
      out('documentUrl', 'string', 'Document.Url'),
      out('messageId', 'string', 'Document.MessageId'),
    ],
    configurationFields: [
      {
        key: 'documentIdVariable',
        label: 'Document ID',
        type: 'text',
        required: true,
        valueKind: 'variable',
      },
      {
        key: 'recipientVariable',
        label: 'Recipient',
        type: 'text',
        required: true,
        placeholder: 'Candidate.Email',
        valueKind: 'variable',
      },
      {
        key: 'messageTemplate',
        label: 'Message',
        type: 'textarea',
        required: false,
        valueKind: 'template',
      },
    ],
  },
  {
    type: 'documents.sendForSignature',
    name: 'Send for signature',
    description: 'Sends for DocuSign and waits until the envelope is completed. Do not add a Wait Event after this step.',
    category: 'Documents',
    icon: 'signature',
    outputs: [
      out('documentId', 'string', 'Document.Id'),
      out('documentUrl', 'string', 'Document.Url'),
      out('signatureRequestId', 'string', 'Document.SignatureRequestId'),
    ],
    configurationFields: [
      {
        key: 'documentIdVariable',
        label: 'Document ID',
        type: 'text',
        required: true,
        valueKind: 'variable',
      },
      {
        key: 'recipientNameVariable',
        label: 'Recipient Name',
        type: 'text',
        required: true,
        valueKind: 'variable',
      },
      {
        key: 'recipientEmailVariable',
        label: 'Recipient Email',
        type: 'text',
        required: true,
        placeholder: 'Candidate.Email',
        valueKind: 'variable',
      },
      {
        key: 'subjectTemplate',
        label: 'Subject',
        type: 'text',
        required: true,
        valueKind: 'template',
      },
    ],
  },
  {
    type: 'meetings.schedule',
    name: 'Schedule meeting',
    description:
      'Creates a Calendly link, emails it to the lead, and waits until they book. Do not add a Wait Event after this step.',
    category: 'Meetings',
    icon: 'calendar',
    outputs: [
      out('meetingId', 'string', 'Meeting.Id'),
      out('eventUri', 'string', 'Meeting.EventUri'),
      out('inviteeUri', 'string', 'Meeting.InviteeUri'),
      out('bookingUrl', 'string', 'Meeting.BookingUrl'),
    ],
    configurationFields: [
      {
        key: 'participantEmailVariable',
        label: 'Participant Email',
        type: 'text',
        required: true,
        placeholder: 'Candidate.Email',
        defaultValue: 'Candidate.Email',
        valueKind: 'variable',
      },
      {
        key: 'participantNameVariable',
        label: 'Participant Name',
        type: 'text',
        required: false,
        placeholder: 'Candidate.Name',
        defaultValue: 'Candidate.Name',
        valueKind: 'variable',
      },
      {
        key: 'titleTemplate',
        label: 'Email subject',
        type: 'text',
        required: true,
        defaultValue: 'Book your meeting',
        valueKind: 'template',
        helpText: 'Subject of the invite email that includes the Calendly link.',
      },
      {
        key: 'messageTemplate',
        label: 'Invite message',
        type: 'textarea',
        required: false,
        placeholder: 'Hi {{Candidate.FirstName}}, pick a time that works for you.',
        valueKind: 'template',
        helpText: 'The booking URL is added automatically if it is not already in the message.',
      },
      {
        key: 'eventType',
        label: 'Calendly event type',
        type: 'text',
        required: true,
        placeholder: 'https://api.calendly.com/event_types/…',
        helpText: 'Event type URI or name from the Calendly integration. This step emails the link and waits for the booking webhook.',
      },
      {
        key: 'timeoutSeconds',
        label: 'Wait timeout (seconds)',
        type: 'number',
        required: false,
        defaultValue: 604800,
        placeholder: '604800',
        helpText: 'Stop waiting if they have not booked (default 7 days). Use Timeout path on the step, or the run fails instead of hanging.',
      },
    ],
  },
  {
    type: 'ai.execute',
    name: 'AI Execute',
    description: 'Runs an AI operation and stores the result.',
    category: 'AI',
    icon: 'spark',
    outputs: [
      out('provider', 'string', 'AI.Provider'),
      out('model', 'string', 'AI.Model'),
      out('tokensPrompt', 'number', 'AI.TokensPrompt'),
      out('tokensCompletion', 'number', 'AI.TokensCompletion'),
      out('tokensTotal', 'number', 'AI.TokensTotal'),
      out('durationMs', 'number', 'AI.DurationMs'),
    ],
    configurationFields: [
      {
        key: 'systemPrompt',
        label: 'System Prompt',
        type: 'textarea',
        required: false,
        placeholder: 'You are a B2B lead qualification assistant.',
        valueKind: 'template',
      },
      {
        key: 'userPrompt',
        label: 'User Prompt',
        type: 'textarea',
        required: true,
        placeholder: 'Analyze {{Job.Title}}…',
        valueKind: 'template',
      },
      {
        key: 'responseVariable',
        label: 'Response Variable',
        type: 'text',
        required: true,
        placeholder: 'AI.Result',
        defaultValue: 'AI.Result',
        valueKind: 'variable',
      },
    ],
  },
  {
    type: 'conversation.askQuestions',
    name: 'Ask Questions',
    description: 'Starts a questionnaire conversation.',
    category: 'Conversation',
    icon: 'chat',
    outputs: [out('conversationId', 'string', 'Conversation.Id')],
    configurationFields: [
      {
        key: 'recipientVariable',
        label: 'Recipient',
        type: 'text',
        required: true,
        placeholder: 'Candidate.Email',
        defaultValue: 'Candidate.Email',
        valueKind: 'variable',
      },
      {
        key: 'channel',
        label: 'Channel',
        type: 'select',
        required: true,
        defaultValue: 'email',
        options: [
          { value: 'email', label: 'Email' },
          { value: 'whatsapp', label: 'WhatsApp' },
        ],
      },
      {
        key: 'questions',
        label: 'Questions (JSON)',
        type: 'json',
        required: true,
        placeholder: '[{ "id": "q1", "text": "What is your role?", "variable": "Candidate.Role" }]',
        defaultValue: [
          { id: 'q1', text: 'What is your role?', variable: 'Candidate.Role' },
        ],
      },
      {
        key: 'introMessage',
        label: 'Intro Message',
        type: 'textarea',
        required: false,
        valueKind: 'template',
      },
    ],
  },
  {
    type: 'nexthire.moveStage',
    name: 'Move Stage',
    description: 'Moves an application to a pipeline stage.',
    category: 'NextHire',
    icon: 'pipeline',
    configurationFields: [
      {
        key: 'applicationIdVariable',
        label: 'Application Id Variable',
        type: 'text',
        required: false,
        valueKind: 'variable',
        placeholder: 'Application.Id',
        defaultValue: 'Application.Id',
      },
      {
        key: 'stageName',
        label: 'Stage Name',
        type: 'text',
        required: false,
        placeholder: 'Interview',
        helpText: 'Match by stage name when stageIdVariable is empty.',
      },
      {
        key: 'stageIdVariable',
        label: 'Stage Id Variable',
        type: 'text',
        required: false,
        valueKind: 'variable',
        placeholder: 'Application.TargetStageId',
      },
    ],
    outputs: [out('Application.StageId', 'string'), out('Application.Stage', 'string')],
  },
  {
    type: 'tasks.create',
    name: 'Create Task',
    description: 'Creates a recruiter task for the application.',
    category: 'NextHire',
    icon: 'task',
    configurationFields: [
      {
        key: 'titleTemplate',
        label: 'Title',
        type: 'text',
        required: true,
        valueKind: 'template',
        placeholder: 'Follow up with {{Candidate.Name}}',
      },
    ],
    outputs: [out('Task.Id', 'string')],
  },
];

const catalogByType = new Map(ACTIVITY_CATALOG.map((descriptor) => [descriptor.type, descriptor]));

export function getActivityDescriptor(activityType: string): ActivityDescriptor | undefined {
  return catalogByType.get(activityType);
}

export function isBranchActivity(activityType: string): boolean {
  return getActivityDescriptor(activityType)?.isBranch === true;
}

export function buildDefaultConfiguration(activityType: string): Record<string, unknown> {
  const descriptor = getActivityDescriptor(activityType);
  if (!descriptor) return {};

  const config: Record<string, unknown> = {};
  for (const field of descriptor.configurationFields) {
    if (field.defaultValue !== undefined) {
      config[field.key] = field.defaultValue;
    } else if (field.type === 'checkbox') {
      config[field.key] = false;
    } else if (field.type === 'json') {
      config[field.key] = {};
    }
  }
  return config;
}

export function getDefaultTransitions(activityType: string) {
  if (!isBranchActivity(activityType)) return [];
  return [
    { key: 'true', targetStepId: '00000000-0000-0000-0000-000000000000', description: 'True' },
    { key: 'false', targetStepId: '00000000-0000-0000-0000-000000000000', description: 'False' },
  ];
}

export function validateStepConfiguration(
  activityType: string,
  configuration: Record<string, unknown>,
  options?: { transitions?: Array<{ key?: string | null }> },
): string[] {
  const descriptor = getActivityDescriptor(activityType);
  if (!descriptor) return ['Unknown activity type.'];

  configuration = applyOutboundWaitConfiguration(activityType, configuration);
  const errors: string[] = [];
  for (const field of descriptor.configurationFields) {
    const value = configuration[field.key];

    if (field.type === 'json' && value !== undefined && value !== null) {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (
            !parsed ||
            (typeof parsed !== 'object')
          ) {
            errors.push(`${field.label} must be valid JSON.`);
          } else if (field.key === 'questions' && Array.isArray(parsed)) {
            errors.push(...validateQuestions(parsed, field.label));
          }
        } catch {
          errors.push(`${field.label} must be valid JSON.`);
        }
      } else if (typeof value !== 'object') {
        errors.push(`${field.label} must be a JSON value.`);
      } else if (field.key === 'questions' && Array.isArray(value)) {
        errors.push(...validateQuestions(value, field.label));
      }
    }

    if (field.type === 'expression') {
      const condition = value == null ? '' : String(value).trim();
      if (field.required && !condition) {
        errors.push(
          `${field.label} is required. Build Variable / Operator / Value (e.g. AI.Result.score >= 80).`,
        );
      }
      continue;
    }

    if (field.visibleWhen && configuration[field.visibleWhen.key] !== field.visibleWhen.equals) {
      continue;
    }
    if (!field.required) continue;
    if (field.type === 'checkbox') continue;
    if (value === undefined || value === null || value === '') {
      errors.push(`${field.label} is required.`);
    }
  }

  if (activityType === 'flow.waitForEvent') {
    const key = String(configuration.correlationKey ?? configuration.correlationIdVariable ?? '');
    if (/messageid/i.test(key)) {
      errors.push('Match on Candidate.Email or Candidate.Phone, not MessageId. Inbound replies correlate by address.');
    }
    const eventType = String(configuration.eventType ?? '').trim();
    if (eventType && !inboundWaitEvents.some((option) => option.value === eventType)) {
      errors.push(`Unsupported wait event "${eventType}".`);
    }
  }

  if (isBranchActivity(activityType)) {
    const keys = new Set(
      (options?.transitions ?? [])
        .map((t) => (t.key ?? '').trim().toLowerCase())
        .filter(Boolean),
    );
    if (!keys.has('true')) {
      errors.push('Branch requires a transition with key "true".');
    }
    if (!keys.has('false')) {
      errors.push('Branch requires a transition with key "false".');
    }
  }

  return errors;
}

export function applyOutboundWaitConfiguration(
  activityType: string,
  configuration: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...configuration };
  if (activityType === 'communication.sendEmail' || activityType === 'communication.sendWhatsApp') {
    const defaultEvent =
      activityType === 'communication.sendWhatsApp' ? WHATSAPP_REPLY_EVENT : EMAIL_REPLY_EVENT;
    if (next.waitForReply === undefined) {
      next.waitForReply = Boolean(String(next.completionEventType ?? '').trim());
    }
    if (next.waitForReply === true) {
      next.completionEventType = String(next.completionEventType ?? '').trim() || defaultEvent;
    } else {
      delete next.completionEventType;
      next.waitForReply = false;
    }
  }

  if (activityType === 'flow.waitForEvent') {
    const key = String(next.correlationKey ?? next.correlationIdVariable ?? '');
    if (/messageid/i.test(key)) {
      const eventType = String(next.eventType ?? '');
      next.correlationKey = eventType.startsWith('whatsapp') ? 'Candidate.Phone' : 'Candidate.Email';
    }
    if (!String(next.eventType ?? '').trim()) {
      next.eventType = EMAIL_REPLY_EVENT;
    }
    if (!String(next.correlationKey ?? '').trim()) {
      const eventType = String(next.eventType ?? '');
      next.correlationKey = eventType.startsWith('whatsapp') ? 'Candidate.Phone' : 'Candidate.Email';
    }
  }

  return next;
}

function validateQuestions(questions: unknown[], label: string): string[] {
  if (questions.length === 0) {
    return [`${label} must contain at least one item with id, text, and variable.`];
  }

  const errors: string[] = [];
  questions.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label}[${index}] must be an object with id, text, and variable.`);
      return;
    }
    const row = item as Record<string, unknown>;
    if (!String(row.id ?? '').trim()) errors.push(`${label}[${index}].id is required.`);
    if (!String(row.text ?? '').trim()) errors.push(`${label}[${index}].text is required.`);
    if (!String(row.variable ?? '').trim()) errors.push(`${label}[${index}].variable is required.`);
  });
  return errors;
}

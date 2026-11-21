import {
  DESIGNER_POSITION_X,
  DESIGNER_POSITION_Y,
  type WorkflowStepDefinition,
} from '../models/workflowDefinition';
import type { WorkflowTemplate } from '../models/workflowTemplate';

function pos(x: number, y: number): Record<string, unknown> {
  return {
    [DESIGNER_POSITION_X]: x,
    [DESIGNER_POSITION_Y]: y,
  };
}

function baseStep(
  id: string,
  name: string,
  activityType: string,
  configuration: Record<string, unknown>,
  x: number,
  y: number,
  patch?: Partial<WorkflowStepDefinition>,
): WorkflowStepDefinition {
  return {
    id,
    name,
    activityType,
    configuration,
    nextStepId: null,
    failureStepId: null,
    timeoutStepId: null,
    transitions: [],
    maxAttempts: null,
    retryDelay: null,
    timeout: null,
    metadata: pos(x, y),
    ...patch,
  };
}

function endStep(id: string, x: number, y: number, name = 'End'): WorkflowStepDefinition {
  return baseStep(id, name, 'flow.end', {}, x, y);
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl-application-welcome',
    name: 'Application Welcome Email',
    description: 'When a candidate applies, send a welcome email and end.',
    category: 'Recruiting',
    icon: 'mail',
    highlights: ['Email', 'End'],
    trigger: { type: 'application.created', configuration: {} },
    startStepId: 'welcome-email',
    steps: [
      baseStep(
        'welcome-email',
        'Welcome Email',
        'communication.sendEmail',
        {
          toVariable: 'Candidate.Email',
          subjectTemplate: 'Thanks for applying to {{Job.Title}}',
          bodyTemplate:
            'Hi {{Candidate.FirstName}},\n\nWe received your application for {{Job.Title}}. Our team will review it shortly.',
          waitForReply: false,
        },
        80,
        120,
        { nextStepId: 'welcome-end' },
      ),
      endStep('welcome-end', 80, 280),
    ],
    preview: [
      { kind: 'trigger', label: 'Application Created' },
      { kind: 'step', label: 'Welcome Email', activityType: 'communication.sendEmail' },
      { kind: 'end' },
    ],
  },
  {
    id: 'tpl-screening-whatsapp',
    name: 'Screening WhatsApp Outreach',
    description: 'Kai-style outreach: WhatsApp message, wait for reply, then create a follow-up task.',
    category: 'Screening',
    icon: 'whatsapp',
    highlights: ['WhatsApp', 'Wait', 'Task'],
    trigger: { type: 'screening.outreach', configuration: {} },
    startStepId: 'wa-send',
    steps: [
      baseStep(
        'wa-send',
        'Send WhatsApp',
        'communication.sendWhatsApp',
        {
          toVariable: 'Candidate.Phone',
          messageTemplate:
            'Hi {{Candidate.FirstName}}, thanks for your interest in {{Job.Title}}. Are you available for a quick screen this week?',
          waitForReply: true,
          completionEventType: 'whatsapp.received',
        },
        80,
        80,
        { nextStepId: 'create-task' },
      ),
      baseStep(
        'create-task',
        'Create Follow-up Task',
        'tasks.create',
        {
          titleTemplate: 'Review WhatsApp reply from {{Candidate.Name}}',
        },
        80,
        240,
        { nextStepId: 'wa-end' },
      ),
      endStep('wa-end', 80, 400),
    ],
    preview: [
      { kind: 'trigger', label: 'Screening Outreach' },
      { kind: 'step', label: 'WhatsApp', activityType: 'communication.sendWhatsApp' },
      { kind: 'step', label: 'Create Task', activityType: 'tasks.create' },
      { kind: 'end' },
    ],
  },
  {
    id: 'tpl-stage-interview-invite',
    name: 'Interview Invite on Stage Change',
    description: 'When stage changes, email a Calendly link and move to Interview when ready.',
    category: 'Interview',
    icon: 'calendar',
    highlights: ['Email', 'Meeting', 'Move Stage'],
    trigger: { type: 'application.stage_changed', configuration: {} },
    startStepId: 'meeting-email',
    steps: [
      baseStep(
        'meeting-email',
        'Send Scheduling Link',
        'meetings.schedule',
        {
          inviteeEmailVariable: 'Candidate.Email',
          titleTemplate: 'Interview for {{Job.Title}}',
          subjectTemplate: 'Schedule your interview for {{Job.Title}}',
          messageTemplate: 'Hi {{Candidate.FirstName}}, please book a time: {{Meeting.Url}}',
        },
        80,
        80,
        { nextStepId: 'move-interview' },
      ),
      baseStep(
        'move-interview',
        'Move to Interview',
        'nexthire.moveStage',
        {
          applicationIdVariable: 'Application.Id',
          stageName: 'Interview',
        },
        80,
        240,
        { nextStepId: 'invite-end' },
      ),
      endStep('invite-end', 80, 400),
    ],
    preview: [
      { kind: 'trigger', label: 'Stage Changed' },
      { kind: 'step', label: 'Schedule Meeting', activityType: 'meetings.schedule' },
      { kind: 'step', label: 'Move Stage', activityType: 'nexthire.moveStage' },
      { kind: 'end' },
    ],
  },
  {
    id: 'tpl-candidate-created-nurture',
    name: 'New Candidate Nurture',
    description: 'On candidate create, wait one day then send a check-in email.',
    category: 'Nurture',
    icon: 'clock',
    highlights: ['Delay', 'Email'],
    trigger: { type: 'candidate.created', configuration: {} },
    startStepId: 'delay-1d',
    steps: [
      baseStep(
        'delay-1d',
        'Wait 1 Day',
        'flow.delay',
        { duration: 1, unit: 'days' },
        80,
        80,
        { nextStepId: 'nurture-email' },
      ),
      baseStep(
        'nurture-email',
        'Check-in Email',
        'communication.sendEmail',
        {
          toVariable: 'Candidate.Email',
          subjectTemplate: 'Still interested in opportunities with us?',
          bodyTemplate:
            'Hi {{Candidate.FirstName}},\n\nJust checking in — we would love to learn more about your goals.',
          waitForReply: false,
        },
        80,
        240,
        { nextStepId: 'nurture-end' },
      ),
      endStep('nurture-end', 80, 400),
    ],
    preview: [
      { kind: 'trigger', label: 'Candidate Created' },
      { kind: 'step', label: 'Delay', activityType: 'flow.delay' },
      { kind: 'step', label: 'Email', activityType: 'communication.sendEmail' },
      { kind: 'end' },
    ],
  },
  {
    id: 'tpl-sourcing-completed',
    name: 'Sourcing Completed Alert',
    description: 'After Aria finishes sourcing, create a review task for recruiters.',
    category: 'Sourcing',
    icon: 'search',
    highlights: ['Task'],
    trigger: { type: 'sourcing.completed', configuration: {} },
    startStepId: 'sourcing-task',
    steps: [
      baseStep(
        'sourcing-task',
        'Create Review Task',
        'tasks.create',
        {
          titleTemplate: 'Review sourcing results for {{Job.Title}}',
        },
        80,
        120,
        { nextStepId: 'sourcing-end' },
      ),
      endStep('sourcing-end', 80, 280),
    ],
    preview: [
      { kind: 'trigger', label: 'Sourcing Completed' },
      { kind: 'step', label: 'Create Task', activityType: 'tasks.create' },
      { kind: 'end' },
    ],
  },
];

export function getWorkflowTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}

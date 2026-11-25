export type TriggerCategory = 'NextHire';

export type TriggerDescriptor = {
  type: string;
  name: string;
  description: string;
  category: TriggerCategory;
};

export const DEFAULT_TRIGGER_TYPE = 'manual';

export const TRIGGER_CATALOG: TriggerDescriptor[] = [
  {
    type: 'manual',
    name: 'Manual',
    description: 'Start the workflow manually.',
    category: 'NextHire',
  },
  {
    type: 'application.created',
    name: 'Application Created',
    description: 'Starts when a candidate applies to a job.',
    category: 'NextHire',
  },
  {
    type: 'application.stage_changed',
    name: 'Application Stage Changed',
    description: 'Starts when an application moves to a different pipeline stage.',
    category: 'NextHire',
  },
  {
    type: 'candidate.created',
    name: 'Candidate Created',
    description: 'Starts when a new candidate is created.',
    category: 'NextHire',
  },
  {
    type: 'sourcing.completed',
    name: 'Sourcing Completed',
    description: 'Starts when Aria finishes a sourcing run.',
    category: 'NextHire',
  },
  {
    type: 'screening.outreach',
    name: 'Screening Outreach',
    description: 'Starts when Kai launches screening outreach.',
    category: 'NextHire',
  },
  {
    type: 'email.received',
    name: 'Email Received',
    description: 'Starts on inbound email when no waiting step is expecting that reply.',
    category: 'NextHire',
  },
  {
    type: 'whatsapp.received',
    name: 'WhatsApp Received',
    description: 'Starts on inbound WhatsApp when no waiting step is expecting that reply.',
    category: 'NextHire',
  },
];

const triggerByType = new Map(TRIGGER_CATALOG.map((t) => [t.type, t]));

export function getTriggerDescriptor(type: string): TriggerDescriptor | undefined {
  return triggerByType.get(type);
}

export function getTriggerSelectOptions() {
  return TRIGGER_CATALOG.map((t) => ({
    value: t.type,
    label: t.name,
  }));
}

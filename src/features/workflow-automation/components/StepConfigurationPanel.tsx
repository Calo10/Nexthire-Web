import { useMemo } from 'react';
import TextField from '../../../components/TextField';
import SelectField from '../../../components/SelectField';
import Button from '../../../components/Button';
import {
  applyOutboundWaitConfiguration,
  EMAIL_REPLY_EVENT,
  getActivityDescriptor,
  isBranchActivity,
  WHATSAPP_REPLY_EVENT,
} from '../models/activityCatalog';
import {
  EMPTY_GUID,
  type WorkflowStepDefinition,
  type WorkflowTransitionDefinition,
} from '../models/workflowDefinition';
import { getAvailableVariablesForStep } from '../lib/workflowVariables';
import DynamicActivityForm from './DynamicActivityForm';

type Props = {
  step: WorkflowStepDefinition | null;
  allSteps: WorkflowStepDefinition[];
  isStart: boolean;
  readOnly: boolean;
  configErrors?: string[];
  onChange: (step: WorkflowStepDefinition) => void;
  onSetStart: (stepId: string) => void;
  onDelete: (stepId: string) => void;
};

function stepOptions(steps: WorkflowStepDefinition[], excludeId?: string) {
  return [
    { value: '', label: 'None' },
    ...steps
      .filter((s) => s.id !== excludeId)
      .map((s) => ({
        value: s.id,
        label: s.name || s.activityType,
      })),
  ];
}

export default function StepConfigurationPanel({
  step,
  allSteps,
  isStart,
  readOnly,
  configErrors = [],
  onChange,
  onSetStart,
  onDelete,
}: Props) {
  const availableVariables = useMemo(
    () => getAvailableVariablesForStep(allSteps, step?.id),
    [allSteps, step?.id],
  );

  if (!step) {
    return (
      <aside className="w-80 shrink-0 border-l border-gray-200 bg-white flex items-center justify-center px-6">
        <p className="text-sm text-gray-500 text-center">
          Select a step on the canvas to configure it.
        </p>
      </aside>
    );
  }

  const descriptor = getActivityDescriptor(step.activityType);
  const configuration = step.configuration ?? {};
  const isBranch = isBranchActivity(step.activityType);
  const fields = descriptor?.configurationFields ?? [];

  const updateConfig = (key: string, value: unknown) => {
    const next = { ...configuration };
    if (value === undefined) delete next[key];
    else next[key] = value;

    if (key === 'waitForReply') {
      if (value === true) {
        next.completionEventType =
          step.activityType === 'communication.sendWhatsApp'
            ? WHATSAPP_REPLY_EVENT
            : EMAIL_REPLY_EVENT;
      } else {
        delete next.completionEventType;
      }
    }

    if (key === 'eventType' && step.activityType === 'flow.waitForEvent') {
      const event = String(value ?? '');
      if (event.startsWith('whatsapp')) next.correlationKey = 'Candidate.Phone';
      else if (event.startsWith('email')) next.correlationKey = 'Candidate.Email';
    }

    if (key === 'channel' && step.activityType === 'conversation.askQuestions') {
      next.recipientVariable = value === 'whatsapp' ? 'Candidate.Phone' : 'Candidate.Email';
    }

    onChange({
      ...step,
      configuration: applyOutboundWaitConfiguration(step.activityType, next),
    });
  };

  const updateTransition = (index: number, patch: Partial<WorkflowTransitionDefinition>) => {
    const transitions = [...(step.transitions ?? [])];
    transitions[index] = { ...transitions[index], ...patch };
    onChange({ ...step, transitions });
  };

  const addTransition = () => {
    const transitions = [
      ...(step.transitions ?? []),
      {
        key: `path${(step.transitions?.length ?? 0) + 1}`,
        targetStepId: EMPTY_GUID,
        description: '',
      },
    ];
    onChange({ ...step, transitions });
  };

  const removeTransition = (index: number) => {
    const transitions = (step.transitions ?? []).filter((_, i) => i !== index);
    onChange({ ...step, transitions });
  };

  return (
    <aside className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-dark-text">Step configuration</h2>
        <p className="text-xs text-gray-500 mt-0.5">{descriptor?.name ?? step.activityType}</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-subtle p-4 space-y-4">
        {configErrors.length > 0 ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 space-y-1">
            {configErrors.map((err) => (
              <p key={err} className="text-xs text-red-700">
                {err}
              </p>
            ))}
          </div>
        ) : null}

        <TextField
          label="Step name"
          required
          disabled={readOnly}
          value={step.name}
          onChange={(e) => onChange({ ...step, name: e.target.value })}
        />

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Start step</p>
            <p className="text-xs text-gray-500">Workflow begins here</p>
          </div>
          {isStart ? (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
              Current start
            </span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={readOnly}
              onClick={() => onSetStart(step.id)}
            >
              Set as start
            </Button>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100 space-y-3">
          <p className="text-sm font-medium text-gray-700">Activity configuration</p>
          <DynamicActivityForm
            key={step.id}
            fields={fields}
            values={configuration}
            disabled={readOnly}
            availableVariables={availableVariables}
            onChange={updateConfig}
          />
        </div>

        {isBranch ? (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Transitions</p>
              {!readOnly ? (
                <button
                  type="button"
                  onClick={addTransition}
                  className="text-xs text-[#0077E6] hover:underline"
                >
                  Add
                </button>
              ) : null}
            </div>
            {(step.transitions ?? []).map((transition, index) => (
              <div key={`${transition.key}-${index}`} className="rounded-lg border border-gray-200 p-3 space-y-2">
                <TextField
                  label="Key"
                  required
                  disabled={readOnly}
                  value={transition.key}
                  onChange={(e) => updateTransition(index, { key: e.target.value })}
                />
                <TextField
                  label="Description"
                  disabled={readOnly}
                  value={transition.description ?? ''}
                  onChange={(e) => updateTransition(index, { description: e.target.value })}
                />
                <SelectField
                  label="Target step"
                  disabled={readOnly}
                  value={
                    transition.targetStepId === EMPTY_GUID ? '' : transition.targetStepId || ''
                  }
                  onChange={(e) =>
                    updateTransition(index, {
                      targetStepId: e.target.value || EMPTY_GUID,
                    })
                  }
                  options={stepOptions(allSteps, step.id)}
                />
                {!readOnly ? (
                  <button
                    type="button"
                    onClick={() => removeTransition(index)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove transition
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="space-y-3 pt-2 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700">Error & timeout paths</p>
          <SelectField
            label="Failure step"
            disabled={readOnly}
            value={step.failureStepId && step.failureStepId !== EMPTY_GUID ? step.failureStepId : ''}
            onChange={(e) =>
              onChange({ ...step, failureStepId: e.target.value || null })
            }
            options={stepOptions(allSteps, step.id)}
          />
          <SelectField
            label="Timeout step"
            disabled={readOnly}
            value={step.timeoutStepId && step.timeoutStepId !== EMPTY_GUID ? step.timeoutStepId : ''}
            onChange={(e) =>
              onChange({ ...step, timeoutStepId: e.target.value || null })
            }
            options={stepOptions(allSteps, step.id)}
          />
        </div>
      </div>

      {!readOnly ? (
        <div className="p-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => onDelete(step.id)}
          >
            Delete step
          </Button>
        </div>
      ) : null}
    </aside>
  );
}

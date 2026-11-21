import TextField from '../../../components/TextField';
import SelectField from '../../../components/SelectField';
import {
  getTriggerDescriptor,
  getTriggerSelectOptions,
} from '../models/triggerCatalog';
import type { WorkflowTriggerDefinition } from '../models/workflowDefinition';

type Props = {
  name: string;
  description: string;
  trigger: WorkflowTriggerDefinition;
  readOnly: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onTriggerChange: (trigger: WorkflowTriggerDefinition) => void;
};

export default function WorkflowPropertiesPanel({
  name,
  description,
  trigger,
  readOnly,
  onNameChange,
  onDescriptionChange,
  onTriggerChange,
}: Props) {
  const descriptor = getTriggerDescriptor(trigger.type);

  return (
    <section className="shrink-0 border-b border-gray-200 bg-white px-4 py-3">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-dark-text">Workflow</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Properties and trigger. The trigger is not part of the canvas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <TextField
          label="Name"
          required
          disabled={readOnly}
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Workflow name"
        />

        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            disabled={readOnly}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Optional description"
            className="w-full h-12 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <SelectField
          label="Trigger"
          required
          disabled={readOnly}
          value={trigger.type}
          onChange={(e) =>
            onTriggerChange({
              type: e.target.value,
              configuration: trigger.configuration ?? {},
            })
          }
          options={getTriggerSelectOptions()}
        />
      </div>

      {descriptor ? (
        <p className="text-xs text-gray-500 mt-2">{descriptor.description}</p>
      ) : null}
    </section>
  );
}

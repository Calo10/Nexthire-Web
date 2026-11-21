import { useMemo, useState } from 'react';
import Button from '../../../components/Button';
import TextField from '../../../components/TextField';
import ErrorMessage from '../../../components/ErrorMessage';
import { WORKFLOW_TEMPLATES } from '../data/workflowTemplates';
import { getTriggerDescriptor } from '../models/triggerCatalog';
import type {
  WorkflowTemplate,
  WorkflowTemplatePreviewNode,
} from '../models/workflowTemplate';
import {
  materializeWorkflowTemplate,
  validateWorkflowTemplate,
} from '../models/workflowTemplate';
import type { CreateWorkflowDefinitionRequest } from '../models/workflowDefinition';

type Phase = 'browse' | 'details';

type Props = {
  creating?: boolean;
  onBack: () => void;
  onCreate: (request: CreateWorkflowDefinitionRequest) => Promise<void>;
};

function triggerLabel(type: string): string {
  return getTriggerDescriptor(type)?.name ?? type;
}

function TemplatePreview({ nodes }: { nodes: WorkflowTemplatePreviewNode[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Preview
      </p>
      <ol className="space-y-0">
        {nodes.map((node, index) => {
          const key = `${node.kind}-${index}`;
          if (node.kind === 'trigger') {
            return (
              <li key={key} className="relative pl-0">
                <div className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  {node.label}
                </div>
                {index < nodes.length - 1 ? (
                  <div className="ml-4 h-4 border-l border-gray-300" />
                ) : null}
              </li>
            );
          }

          if (node.kind === 'branch') {
            return (
              <li key={key}>
                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-dark-text">
                  {node.label}
                </div>
                <div className="mt-2 ml-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                    <p className="text-[10px] font-semibold uppercase text-emerald-700 mb-1">
                      {node.trueLabel}
                    </p>
                    <p className="text-xs text-gray-600">
                      {node.truePath.join(' → ')}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                    <p className="text-[10px] font-semibold uppercase text-gray-500 mb-1">
                      {node.falseLabel}
                    </p>
                    <p className="text-xs text-gray-600">
                      {node.falsePath.join(' → ')}
                    </p>
                  </div>
                </div>
              </li>
            );
          }

          if (node.kind === 'end') {
            return (
              <li key={key}>
                <div className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700">
                  {node.label ?? 'End'}
                </div>
              </li>
            );
          }

          return (
            <li key={key}>
              <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-dark-text">
                {node.label}
              </div>
              {index < nodes.length - 1 && nodes[index + 1]?.kind !== 'branch' ? (
                <div className="ml-4 h-4 border-l border-gray-300" />
              ) : index < nodes.length - 1 ? (
                <div className="ml-4 h-4 border-l border-gray-300" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: WorkflowTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border p-4 transition-colors ${
        selected
          ? 'border-[#0077E6] bg-sky-50/60 ring-2 ring-[#00AAFF]/25'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-dark-text">{template.name}</p>
          <p className="text-xs text-gray-500 mt-1">{template.description}</p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
          {template.category}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>
          <dt className="text-gray-400">Steps</dt>
          <dd className="font-medium text-dark-text">{template.steps.length}</dd>
        </div>
        <div>
          <dt className="text-gray-400">Trigger</dt>
          <dd className="font-medium text-dark-text">{triggerLabel(template.trigger.type)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[11px] text-gray-500">
        {template.highlights.join(' • ')}
      </p>
    </button>
  );
}

export default function WorkflowTemplateSelector({ creating, onBack, onCreate }: Props) {
  const [phase, setPhase] = useState<Phase>('browse');
  const [selectedId, setSelectedId] = useState<string | null>(WORKFLOW_TEMPLATES[0]?.id ?? null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => WORKFLOW_TEMPLATES.find((t) => t.id === selectedId) ?? null,
    [selectedId],
  );

  const openDetails = () => {
    if (!selected) return;
    const validation = validateWorkflowTemplate(selected);
    if (!validation.valid) {
      setError(validation.errors[0] || 'This template is invalid.');
      return;
    }
    setError(null);
    setName(selected.name);
    setDescription('');
    setPhase('details');
  };

  const handleCreate = async () => {
    if (!selected || !name.trim()) return;
    const validation = validateWorkflowTemplate(selected);
    if (!validation.valid) {
      setError(validation.errors.join(' '));
      return;
    }

    try {
      setError(null);
      const request = materializeWorkflowTemplate(selected, name, description);
      await onCreate(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create from template.');
    }
  };

  if (phase === 'details' && selected) {
    return (
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        <button
          type="button"
          onClick={() => !creating && setPhase('browse')}
          className="text-xs text-gray-500 hover:text-dark-text"
        >
          ← Back to templates
        </button>
        <p className="text-sm text-gray-600">
          Creating from <span className="font-semibold text-dark-text">{selected.name}</span>
        </p>
        <TextField
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Miami Lead Qualification"
          autoFocus
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div className="flex justify-between gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" disabled={creating} onClick={onBack}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={creating || !name.trim()}
            onClick={() => void handleCreate()}
          >
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorMessage message={error} /> : null}
      <button
        type="button"
        onClick={() => !creating && onBack()}
        className="text-xs text-gray-500 hover:text-dark-text"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto scrollbar-subtle pr-1">
        {WORKFLOW_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            selected={template.id === selectedId}
            onSelect={() => {
              setSelectedId(template.id);
              setError(null);
            }}
          />
        ))}
      </div>

      {selected ? <TemplatePreview nodes={selected.preview} /> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={creating} onClick={onBack}>
          Cancel
        </Button>
        <Button type="button" size="sm" disabled={!selected || creating} onClick={openDetails}>
          Use Template
        </Button>
      </div>
    </div>
  );
}

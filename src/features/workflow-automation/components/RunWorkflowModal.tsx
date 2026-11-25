import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import TextField from '../../../components/TextField';
import SelectField from '../../../components/SelectField';
import ErrorMessage from '../../../components/ErrorMessage';
import type { ApiError } from '../../../lib/api';
import { dashboardApi } from '../../../lib/api';
import { candidatesApi } from '../../../api/candidatesApi';
import { applicationsApi } from '../../../api/applicationsApi';
import { workflowExecutionsApi } from '../api/workflowExecutionsApi';
import type { WorkflowDefinitionListItem } from '../models/workflowDefinition';
import { getTriggerDescriptor } from '../models/triggerCatalog';
import type { Candidate, CandidatesListResponse } from '../../../types/candidates';

type EntityPreset = 'Candidate' | 'Application' | 'Job' | 'Custom';

type VariableRow = {
  id: string;
  key: string;
  value: string;
};

type EntityOption = {
  id: string;
  label: string;
  variables?: Record<string, string>;
};

type Props = {
  open: boolean;
  workflow: WorkflowDefinitionListItem | null;
  triggerType?: string;
  onClose: () => void;
  onSuccess: (executionId: string) => void;
};

const ENTITY_OPTIONS = [
  { value: 'Candidate', label: 'Candidate' },
  { value: 'Application', label: 'Application' },
  { value: 'Job', label: 'Job' },
  { value: 'Custom', label: 'Custom' },
];

function newRow(): VariableRow {
  return { id: crypto.randomUUID(), key: '', value: '' };
}

function coerceVariableValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    if (Number.isFinite(n)) return n;
  }
  return raw;
}

function buildInitialVariables(rows: VariableRow[]): Record<string, unknown> | undefined {
  const vars: Record<string, unknown> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    vars[key] = coerceVariableValue(row.value);
  }
  return Object.keys(vars).length > 0 ? vars : undefined;
}

function normalizeCandidates(result: CandidatesListResponse | Candidate[]): Candidate[] {
  if (Array.isArray(result)) return result;
  return Array.isArray(result.items) ? result.items : [];
}

export default function RunWorkflowModal({ open, workflow, triggerType, onClose, onSuccess }: Props) {
  const [entityPreset, setEntityPreset] = useState<EntityPreset>('Candidate');
  const [customEntityType, setCustomEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [entityQuery, setEntityQuery] = useState('');
  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [variables, setVariables] = useState<VariableRow[]>([newRow()]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdExecutionId, setCreatedExecutionId] = useState<string | null>(null);
  const lockRef = useRef(false);
  const trigger = getTriggerDescriptor(triggerType ?? '');

  const entityType = useMemo(() => {
    if (entityPreset === 'Custom') return customEntityType.trim();
    return entityPreset;
  }, [entityPreset, customEntityType]);

  const canSubmit = !!workflow && !!entityType && !!entityId.trim() && !running;

  const resetForm = () => {
    setEntityPreset('Candidate');
    setCustomEntityType('');
    setEntityId('');
    setEntityQuery('');
    setEntityOptions([]);
    setVariables([newRow()]);
    setError(null);
    setCreatedExecutionId(null);
    setRunning(false);
    lockRef.current = false;
  };

  useEffect(() => {
    if (!open || entityPreset === 'Custom') {
      setEntityOptions([]);
      return;
    }

    const handle = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const search = entityQuery.trim();
          if (entityPreset === 'Candidate') {
            const page = await candidatesApi.list({ search: search || undefined, pageSize: 8 });
            setEntityOptions(
              normalizeCandidates(page).map((item) => {
                const name = `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || item.email;
                return {
                  id: item.id,
                  label: [name, item.email, item.phone].filter(Boolean).join(' · '),
                  variables: {
                    'Candidate.Id': item.id,
                    'Candidate.Email': item.email ?? '',
                    'Candidate.Phone': item.phone ?? '',
                    'Candidate.Name': name,
                    'Candidate.FirstName': item.firstName ?? '',
                    'Candidate.LastName': item.lastName ?? '',
                  },
                };
              }),
            );
          } else if (entityPreset === 'Application') {
            const items = await applicationsApi.list({ search: search || undefined, pageSize: 8 });
            setEntityOptions(
              items.map((item) => ({
                id: String(item.id),
                label: [item.candidateName, item.jobTitle].filter(Boolean).join(' · '),
                variables: {
                  'Application.Id': String(item.id),
                  'Candidate.Id': item.candidateId ? String(item.candidateId) : '',
                  'Candidate.Name': item.candidateName ?? '',
                  'Job.Id': item.jobId != null ? String(item.jobId) : '',
                  'Job.Title': item.jobTitle ?? '',
                },
              })),
            );
          } else {
            const jobs = await dashboardApi.getJobs();
            const filtered = (Array.isArray(jobs) ? jobs : [])
              .filter((job) => {
                if (!search) return true;
                const hay = `${job.title ?? ''} ${job.company ?? ''}`.toLowerCase();
                return hay.includes(search.toLowerCase());
              })
              .slice(0, 8);
            setEntityOptions(
              filtered.map((job) => ({
                id: String(job.id),
                label: [job.title, job.company, job.location].filter(Boolean).join(' · '),
                variables: {
                  'Job.Id': String(job.id),
                  'Job.Title': job.title ?? '',
                },
              })),
            );
          }
        } catch {
          setEntityOptions([]);
        } finally {
          setSearching(false);
        }
      })();
    }, 250);

    return () => window.clearTimeout(handle);
  }, [open, entityPreset, entityQuery]);

  const applyEntity = (option: EntityOption) => {
    setEntityId(option.id);
    setEntityQuery(option.label);
    if (option.variables) {
      const rows = Object.entries(option.variables)
        .filter(([, value]) => value.trim())
        .map(([key, value]) => ({ id: crypto.randomUUID(), key, value }));
      setVariables(rows.length > 0 ? rows : [newRow()]);
    }
  };

  const handleClose = () => {
    if (running) return;
    resetForm();
    onClose();
  };

  const updateVariable = (id: string, patch: Partial<VariableRow>) => {
    setVariables((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const handleRun = async () => {
    if (!workflow || !canSubmit || lockRef.current) return;

    lockRef.current = true;
    setRunning(true);
    setError(null);
    setCreatedExecutionId(null);

    try {
      const created = await workflowExecutionsApi.createWorkflowExecution({
        workflowDefinitionId: workflow.id,
        entityType,
        entityId: entityId.trim(),
        initialVariables: buildInitialVariables(variables),
      });

      setCreatedExecutionId(created.id);

      await workflowExecutionsApi.executeWorkflowExecution(created.id);

      resetForm();
      onSuccess(created.id);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Could not run workflow.');
    } finally {
      lockRef.current = false;
      setRunning(false);
    }
  };

  return (
    <Modal
      isOpen={open && !!workflow}
      onClose={handleClose}
      title="Run Workflow"
      subtitle={
        workflow
          ? trigger && trigger.type !== 'manual'
            ? `Start “${workflow.name}” now. It also runs automatically on ${trigger.name}.`
            : `Start an execution of “${workflow.name}”.`
          : undefined
      }
      width="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={running} onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={!canSubmit} onClick={() => void handleRun()}>
            {running ? 'Running…' : 'Run Workflow'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}

        {createdExecutionId && error ? (
          <button
            type="button"
            className="text-xs text-[#0077E6] hover:underline"
            onClick={() => onSuccess(createdExecutionId)}
          >
            Open created execution →
          </button>
        ) : null}

        <SelectField
          label="Entity Type"
          required
          disabled={running}
          value={entityPreset}
          onChange={(e) => {
            setEntityPreset(e.target.value as EntityPreset);
            setEntityId('');
            setEntityQuery('');
            setEntityOptions([]);
          }}
          options={ENTITY_OPTIONS}
        />

        {entityPreset === 'Custom' ? (
          <TextField
            label="Custom Entity Type"
            required
            disabled={running}
            value={customEntityType}
            onChange={(e) => setCustomEntityType(e.target.value)}
            placeholder="Candidate"
          />
        ) : null}

        {entityPreset === 'Custom' ? (
          <TextField
            label="Entity Id"
            required
            disabled={running}
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            placeholder="entity-id"
          />
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {entityPreset} <span className="text-red-500">*</span>
            </label>
            <input
              type="search"
              disabled={running}
              value={entityQuery}
              onChange={(e) => {
                setEntityQuery(e.target.value);
                setEntityId('');
              }}
              placeholder={`Search ${entityPreset.toLowerCase()}s…`}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6] disabled:bg-gray-50"
            />
            {searching ? (
              <p className="mt-1.5 text-[11px] text-gray-400">Searching…</p>
            ) : null}
            {entityOptions.length > 0 ? (
              <ul className="mt-1 max-h-40 overflow-auto border border-gray-100 rounded-lg divide-y divide-gray-50 bg-white">
                {entityOptions.map((option) => (
                  <li key={option.id}>
                    <button
                      type="button"
                      disabled={running}
                      onClick={() => applyEntity(option)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                        entityId === option.id ? 'bg-sky-50 text-[#0077E6]' : 'text-gray-700'
                      }`}
                    >
                      {option.label || option.id}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {entityId ? (
              <p className="mt-1.5 text-[11px] text-gray-400 font-mono">{entityId}</p>
            ) : (
              <p className="mt-1.5 text-[11px] text-gray-400">Pick a record or keep typing to search.</p>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">Initial Variables</label>
            <button
              type="button"
              disabled={running}
              onClick={() => setVariables((rows) => [...rows, newRow()])}
              className="text-xs text-[#0077E6] hover:underline disabled:opacity-50"
            >
              Add Variable
            </button>
          </div>

          <div className="space-y-2">
            {variables.map((row) => (
              <div key={row.id} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  disabled={running}
                  value={row.key}
                  onChange={(e) => updateVariable(row.id, { key: e.target.value })}
                  placeholder="Candidate.Email"
                  className="flex-1 h-10 px-3 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6] disabled:bg-gray-50"
                />
                <input
                  type="text"
                  disabled={running}
                  value={row.value}
                  onChange={(e) => updateVariable(row.id, { value: e.target.value })}
                  placeholder="test@example.com"
                  className="flex-1 h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6] disabled:bg-gray-50"
                />
                <button
                  type="button"
                  disabled={running || variables.length <= 1}
                  onClick={() =>
                    setVariables((rows) =>
                      rows.length <= 1 ? rows : rows.filter((r) => r.id !== row.id),
                    )
                  }
                  className="text-xs text-red-600 hover:underline disabled:opacity-40 shrink-0 px-1"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-gray-400">
            Optional. Empty keys are ignored. Numbers and true/false are coerced when possible.
          </p>
        </div>
      </div>
    </Modal>
  );
}

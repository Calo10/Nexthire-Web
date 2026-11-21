import { useCallback, useEffect, useState } from 'react';
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react';
import ErrorMessage from '../../../components/ErrorMessage';
import type { ApiError } from '../../../lib/api';
import { workflowDefinitionsApi } from '../api/workflowDefinitionsApi';
import {
  buildDefaultConfiguration,
  getDefaultTransitions,
  type ActivityDescriptor,
} from '../models/activityCatalog';
import {
  DESIGNER_POSITION_X,
  DESIGNER_POSITION_Y,
  EMPTY_GUID,
  isEditableStatus,
  resolveWorkflowTrigger,
  withStepPosition,
  type WorkflowDefinition,
  type WorkflowStepDefinition,
  type WorkflowTriggerDefinition,
} from '../models/workflowDefinition';
import {
  definitionToGraph,
  graphToDefinition,
  toUpdateRequest,
  validateWorkflowForSave,
  type WorkflowStepNodeData,
} from '../mappers/workflowGraphMapper';
import ActivitySelector from './ActivitySelector';
import StepConfigurationPanel from './StepConfigurationPanel';
import WorkflowCanvas from './WorkflowCanvas';
import WorkflowPropertiesPanel from './WorkflowPropertiesPanel';
import WorkflowToolbar from './WorkflowToolbar';
import ConfirmModal from '../../../components/ui/ConfirmModal';

type Props = {
  definition: WorkflowDefinition;
  onDefinitionChange: (definition: WorkflowDefinition) => void;
};

function cloneDefinition(definition: WorkflowDefinition): WorkflowDefinition {
  const cloned = JSON.parse(JSON.stringify(definition)) as WorkflowDefinition;
  return {
    ...cloned,
    trigger: resolveWorkflowTrigger(cloned.trigger),
  };
}

function rebuildGraph(
  definition: WorkflowDefinition,
  options: { readOnly: boolean; stepErrors: Record<string, string[]> },
  currentNodes: Node<WorkflowStepNodeData>[],
  selectedStepId?: string | null,
) {
  const g = definitionToGraph(definition, options);
  const positionById = new Map(currentNodes.map((n) => [n.id, n.position]));
  return {
    nodes: g.nodes.map((n) => ({
      ...n,
      position: positionById.get(n.id) ?? n.position,
      selected: selectedStepId != null && n.id === selectedStepId,
    })),
    edges: g.edges,
  };
}

export default function WorkflowDesigner({ definition, onDefinitionChange }: Props) {
  const readOnly = !isEditableStatus(definition.status);
  const [draft, setDraft] = useState<WorkflowDefinition>(() => cloneDefinition(definition));
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [stepErrors, setStepErrors] = useState<Record<string, string[]>>({});
  const [pendingDeleteStepId, setPendingDeleteStepId] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);

  const [nodes, setNodes] = useState<Node<WorkflowStepNodeData>[]>(() =>
    definitionToGraph(definition, { readOnly }).nodes,
  );
  const [edges, setEdges] = useState<Edge[]>(() =>
    definitionToGraph(definition, { readOnly }).edges,
  );

  // Sync from parent when a fresh definition is loaded (e.g. after save/publish)
  useEffect(() => {
    const next = cloneDefinition(definition);
    setDraft(next);
    setDirty(false);
    setValidationErrors([]);
    setStepErrors({});
    const g = definitionToGraph(next, { readOnly: !isEditableStatus(next.status) });
    setNodes(g.nodes);
    setEdges(g.edges);
  }, [definition]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<WorkflowStepNodeData>>[]) => {
      setNodes((current) => {
        const next = applyNodeChanges(changes, current);
        const removed = changes.some((c) => c.type === 'remove');
        if (removed && !readOnly) {
          const remainingIds = new Set(next.map((n) => n.id));
          setEdges((currentEdges) => {
            const filtered = currentEdges.filter(
              (e) => remainingIds.has(e.source) && remainingIds.has(e.target),
            );
            setDraft((prev) => {
              const steps = (prev.steps ?? []).filter((s) => remainingIds.has(s.id));
              let startStepId = prev.startStepId;
              if (!remainingIds.has(startStepId)) {
                startStepId = steps[0]?.id ?? EMPTY_GUID;
              }
              const base = { ...prev, steps, startStepId };
              return graphToDefinition(base, next, filtered);
            });
            setDirty(true);
            if (selectedStepId && !remainingIds.has(selectedStepId)) {
              setSelectedStepId(null);
            }
            return filtered;
          });
        }
        return next;
      });
    },
    [readOnly, selectedStepId],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) return;
      setEdges((current) => {
        const next = applyEdgeChanges(changes, current);
        if (changes.some((c) => c.type === 'remove' || c.type === 'add')) {
          setNodes((currentNodes) => {
            setDraft((prev) => graphToDefinition(prev, currentNodes, next));
            return currentNodes;
          });
          setDirty(true);
        }
        return next;
      });
    },
    [readOnly],
  );

  const onConnectEdges = useCallback((nextEdges: Edge[]) => {
    setEdges(nextEdges);
    setNodes((currentNodes) => {
      setDraft((prev) => graphToDefinition(prev, currentNodes, nextEdges));
      return currentNodes;
    });
    setDirty(true);
  }, []);

  const onCommitNodePosition = useCallback((nodeId: string, position: XYPosition) => {
    setNodes((current) =>
      current.map((n) => (n.id === nodeId ? { ...n, position } : n)),
    );
    setDraft((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === nodeId ? withStepPosition(s, position.x, position.y) : s,
      ),
    }));
    setDirty(true);
  }, []);

  const selectedStep =
    draft.steps.find((s) => s.id === selectedStepId) ?? null;

  const updateStep = (step: WorkflowStepDefinition) => {
    if (readOnly) return;
    const steps = draft.steps.map((s) => (s.id === step.id ? step : s));
    const updated = { ...draft, steps };
    const g = rebuildGraph(updated, { readOnly, stepErrors }, nodes, step.id);
    setDraft(updated);
    setNodes(g.nodes);
    setEdges(g.edges);
    setSelectedStepId(step.id);
    setDirty(true);
  };

  const addActivity = (descriptor: ActivityDescriptor) => {
    if (readOnly) return;
    const id = crypto.randomUUID();
    const index = draft.steps.length;
    const step: WorkflowStepDefinition = {
      id,
      name: descriptor.name,
      activityType: descriptor.type,
      configuration: buildDefaultConfiguration(descriptor.type),
      nextStepId: null,
      failureStepId: null,
      timeoutStepId: null,
      transitions: getDefaultTransitions(descriptor.type),
      maxAttempts: null,
      retryDelay: null,
      timeout: null,
      metadata: {
        [DESIGNER_POSITION_X]: 120 + (index % 4) * 260,
        [DESIGNER_POSITION_Y]: 100 + Math.floor(index / 4) * 160,
      },
    };

    const steps = [...draft.steps, step];
    const startStepId =
      !draft.startStepId ||
      draft.startStepId === EMPTY_GUID ||
      draft.steps.length === 0
        ? id
        : draft.startStepId;
    const updated = { ...draft, steps, startStepId };
    const g = rebuildGraph(updated, { readOnly: false, stepErrors }, nodes, id);
    setDraft(updated);
    setNodes(g.nodes);
    setEdges(g.edges);
    setSelectedStepId(id);
    setDirty(true);
  };

  const deleteStep = (stepId: string) => {
    if (readOnly) return;
    setPendingDeleteStepId(stepId);
  };

  const confirmDeleteStep = () => {
    const stepId = pendingDeleteStepId;
    if (!stepId || readOnly) return;
    const steps = draft.steps.filter((s) => s.id !== stepId);
    let startStepId = draft.startStepId;
    if (startStepId === stepId) {
      startStepId = steps[0]?.id ?? EMPTY_GUID;
    }
    const cleaned = steps.map((s) => ({
      ...s,
      nextStepId: s.nextStepId === stepId ? null : s.nextStepId,
      failureStepId: s.failureStepId === stepId ? null : s.failureStepId,
      timeoutStepId: s.timeoutStepId === stepId ? null : s.timeoutStepId,
      transitions: (s.transitions ?? []).map((t) =>
        t.targetStepId === stepId ? { ...t, targetStepId: EMPTY_GUID } : t,
      ),
    }));
    const nextSelected = selectedStepId === stepId ? null : selectedStepId;
    const updated = { ...draft, steps: cleaned, startStepId };
    const g = rebuildGraph(updated, { readOnly: false, stepErrors }, nodes, nextSelected);
    setDraft(updated);
    setNodes(g.nodes);
    setEdges(g.edges);
    setSelectedStepId(nextSelected);
    setDirty(true);
    setPendingDeleteStepId(null);
  };

  const handleSave = async () => {
    // Merge latest node positions into draft before validating
    const merged = graphToDefinition(draft, nodes, edges);
    const validation = validateWorkflowForSave(merged);
    setValidationErrors(validation.errors);
    setStepErrors(validation.stepErrors);
    if (!validation.valid) {
      setError(validation.errors[0] || 'Please fix validation errors before saving.');
      const g = definitionToGraph(merged, { readOnly, stepErrors: validation.stepErrors });
      setNodes(g.nodes);
      setEdges(g.edges);
      setDraft(merged);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = await workflowDefinitionsApi.updateWorkflowDefinition(
        merged.id,
        toUpdateRequest(merged),
      );
      setDirty(false);
      onDefinitionChange(saved);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Could not save workflow.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (dirty) {
      setError('Save your changes before publishing.');
      return;
    }
    const validation = validateWorkflowForSave(draft);
    setValidationErrors(validation.errors);
    setStepErrors(validation.stepErrors);
    if (!validation.valid) {
      setError(validation.errors[0] ?? 'Fix configuration errors before publishing.');
      return;
    }
    setPublishOpen(true);
  };

  const confirmPublish = async () => {
    setSaving(true);
    setError(null);
    try {
      const published = await workflowDefinitionsApi.publishWorkflowDefinition(draft.id);
      setPublishOpen(false);
      onDefinitionChange(published);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Could not publish workflow.');
      setPublishOpen(false);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <WorkflowToolbar
        name={draft.name}
        status={draft.status}
        dirty={dirty}
        saving={saving}
        readOnly={readOnly}
        onNameChange={(name) => {
          if (readOnly) return;
          setDraft((prev) => ({ ...prev, name }));
          setDirty(true);
        }}
        onSave={handleSave}
        onPublish={handlePublish}
      />

      {error ? (
        <div className="px-4 py-2 border-b border-red-100 bg-red-50">
          <ErrorMessage message={error} />
        </div>
      ) : null}

      {validationErrors.length > 1 ? (
        <div className="px-4 py-2 border-b border-amber-100 bg-amber-50 text-xs text-amber-800 space-y-0.5">
          {validationErrors.slice(0, 5).map((msg) => (
            <p key={msg}>{msg}</p>
          ))}
        </div>
      ) : null}

      <div className="flex-1 flex min-h-0">
        <ActivitySelector disabled={readOnly} onAdd={addActivity} />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <WorkflowPropertiesPanel
            name={draft.name}
            description={draft.description ?? ''}
            trigger={draft.trigger}
            readOnly={readOnly}
            onNameChange={(name) => {
              if (readOnly) return;
              setDraft((prev) => ({ ...prev, name }));
              setDirty(true);
            }}
            onDescriptionChange={(description) => {
              if (readOnly) return;
              setDraft((prev) => ({ ...prev, description }));
              setDirty(true);
            }}
            onTriggerChange={(trigger: WorkflowTriggerDefinition) => {
              if (readOnly) return;
              setDraft((prev) => ({ ...prev, trigger }));
              setDirty(true);
            }}
          />
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            readOnly={readOnly}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnectEdges={onConnectEdges}
            onCommitNodePosition={onCommitNodePosition}
            onSelectStep={setSelectedStepId}
          />
        </div>
        <StepConfigurationPanel
          step={selectedStep}
          allSteps={draft.steps}
          isStart={selectedStep?.id === draft.startStepId}
          readOnly={readOnly}
          configErrors={selectedStep ? stepErrors[selectedStep.id] : undefined}
          onChange={updateStep}
          onSetStart={(stepId) => {
            if (readOnly) return;
            setDraft((prev) => ({ ...prev, startStepId: stepId }));
            setDirty(true);
            setNodes((current) =>
              current.map((n) => ({
                ...n,
                data: { ...n.data, isStart: n.id === stepId },
              })),
            );
          }}
          onDelete={deleteStep}
        />
      </div>

      <ConfirmModal
        isOpen={!!pendingDeleteStepId}
        onClose={() => setPendingDeleteStepId(null)}
        onConfirm={confirmDeleteStep}
        title="Delete this step?"
        description="Connections to this step will be cleared. Save the workflow to keep the change."
        confirmLabel="Delete"
        tone="danger"
      />
      <ConfirmModal
        isOpen={publishOpen}
        onClose={() => {
          if (!saving) setPublishOpen(false);
        }}
        onConfirm={() => void confirmPublish()}
        title="Publish this workflow?"
        description="Published workflows become read-only."
        confirmLabel="Publish"
        busy={saving}
      />
    </div>
  );
}

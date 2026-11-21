import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import TextField from '../../../components/TextField';
import ErrorMessage from '../../../components/ErrorMessage';
import { workflowDefinitionsApi } from '../api/workflowDefinitionsApi';
import {
  createDefaultEndStep,
  createDefaultTrigger,
  isArchivedStatus,
  isDraftStatus,
  isPublishedStatus,
  resolveWorkflowTrigger,
  type CreateWorkflowDefinitionRequest,
  type WorkflowDefinitionListItem,
} from '../models/workflowDefinition';
import { toCreateRequest } from '../mappers/workflowGraphMapper';
import type { ApiError } from '../../../lib/api';
import WorkflowTemplateSelector from './WorkflowTemplateSelector';
import RunWorkflowModal from './RunWorkflowModal';
import ConfirmModal from '../../../components/ui/ConfirmModal';

type Props = {
  items: WorkflowDefinitionListItem[];
  onRefresh: () => Promise<void>;
};

type CreatePhase = 'entry' | 'scratch' | 'templates';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusTone(status: string): 'yellow' | 'green' | 'gray' | 'blue' {
  if (isDraftStatus(status)) return 'yellow';
  if (isPublishedStatus(status)) return 'green';
  if (isArchivedStatus(status)) return 'gray';
  return 'blue';
}

export default function WorkflowList({ items, onRefresh }: Props) {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [createPhase, setCreatePhase] = useState<CreatePhase>('entry');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  /** trigger.type by definition id — list API does not include trigger. */
  const [triggerById, setTriggerById] = useState<Record<string, string>>({});
  const [runWorkflow, setRunWorkflow] = useState<WorkflowDefinitionListItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'publish' | 'archive';
    item: WorkflowDefinitionListItem;
  } | null>(null);

  const openDesigner = (id: string) => navigate(`/app/workflow-automation/${id}`);

  useEffect(() => {
    const published = items.filter((item) => isPublishedStatus(item.status));
    if (published.length === 0) {
      setTriggerById({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        published.map(async (item) => {
          try {
            const def = await workflowDefinitionsApi.getWorkflowDefinition(item.id);
            const trigger = resolveWorkflowTrigger(def.trigger);
            return [item.id, trigger.type] as const;
          } catch {
            return [item.id, ''] as const;
          }
        }),
      );
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const [id, type] of entries) next[id] = type;
      setTriggerById(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  const canRun = (item: WorkflowDefinitionListItem): boolean => isPublishedStatus(item.status);

  const resetCreateState = () => {
    setCreatePhase('entry');
    setName('');
    setDescription('');
    setActionError(null);
  };

  const closeCreate = () => {
    if (creating) return;
    setCreateOpen(false);
    resetCreateState();
  };

  const createAndOpen = async (request: CreateWorkflowDefinitionRequest) => {
    setCreating(true);
    setActionError(null);
    try {
      const created = await workflowDefinitionsApi.createWorkflowDefinition(
        toCreateRequest(request),
      );
      setCreateOpen(false);
      resetCreateState();
      navigate(`/app/workflow-automation/${created.id}`);
    } catch (err) {
      setActionError((err as ApiError).message || 'Could not create workflow.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateScratch = async () => {
    if (!name.trim()) return;
    const stepId = crypto.randomUUID();
    await createAndOpen({
      name: name.trim(),
      description: description.trim() || null,
      startStepId: stepId,
      steps: [createDefaultEndStep(stepId)],
      trigger: createDefaultTrigger(),
      metadata: {},
    });
  };

  const handleDelete = (item: WorkflowDefinitionListItem) => {
    setActionError(null);
    setConfirmAction({ type: 'delete', item });
  };

  const handlePublish = (item: WorkflowDefinitionListItem) => {
    setActionError(null);
    setConfirmAction({ type: 'publish', item });
  };

  const handleArchive = (item: WorkflowDefinitionListItem) => {
    setActionError(null);
    setConfirmAction({ type: 'archive', item });
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, item } = confirmAction;
    setPendingId(item.id);
    setActionError(null);
    try {
      if (type === 'delete') {
        await workflowDefinitionsApi.deleteWorkflowDefinition(item.id);
      } else if (type === 'publish') {
        await workflowDefinitionsApi.publishWorkflowDefinition(item.id);
      } else {
        await workflowDefinitionsApi.archiveWorkflowDefinition(item.id);
      }
      setConfirmAction(null);
      await onRefresh();
    } catch (err) {
      const fallback =
        type === 'delete'
          ? 'Could not delete workflow.'
          : type === 'publish'
            ? 'Could not publish workflow.'
            : 'Could not archive workflow.';
      setActionError((err as ApiError).message || fallback);
      setConfirmAction(null);
    } finally {
      setPendingId(null);
    }
  };

  const confirmCopy =
    confirmAction?.type === 'delete'
      ? {
          title: `Delete “${confirmAction.item.name}”?`,
          description: 'This draft will be removed. This cannot be undone.',
          confirmLabel: 'Delete',
          tone: 'danger' as const,
        }
      : confirmAction?.type === 'publish'
        ? {
            title: `Publish “${confirmAction.item.name}”?`,
            description: 'Published workflows become read-only.',
            confirmLabel: 'Publish',
            tone: 'default' as const,
          }
        : confirmAction?.type === 'archive'
          ? {
              title: `Archive “${confirmAction.item.name}”?`,
              description: 'The workflow will no longer start new runs.',
              confirmLabel: 'Archive',
              tone: 'default' as const,
            }
          : null;

  const modalTitle =
    createPhase === 'entry'
      ? 'Create workflow'
      : createPhase === 'scratch'
        ? 'Start from scratch'
        : 'Choose a template';

  const modalSubtitle =
    createPhase === 'entry'
      ? 'Start blank or pick a ready-made flow.'
      : createPhase === 'scratch'
        ? 'Starts as a Draft with an End step you can edit in the designer.'
        : 'Select a template, preview the flow, then create a Draft.';

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          type="button"
          onClick={() => {
            resetCreateState();
            setCreateOpen(true);
          }}
        >
          Create Workflow
        </Button>
      </div>

      {actionSuccess && !createOpen && !runWorkflow ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {actionSuccess}
        </div>
      ) : null}

      {actionError && !createOpen && !runWorkflow ? (
        <div className="mb-4">
          <ErrorMessage message={actionError} />
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  No workflows yet. Create your first draft to open the designer.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const busy = pendingId === item.id;
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/40">
                    <td className="px-4 py-3 font-medium text-dark-text">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {item.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">v{item.version}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                        {isDraftStatus(item.status) ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => openDesigner(item.id)}
                              className="text-xs text-[#0077E6] hover:underline disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handlePublish(item)}
                              className="text-xs text-emerald-700 hover:underline disabled:opacity-50"
                            >
                              Publish
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDelete(item)}
                              className="text-xs text-red-600 hover:underline disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                        {isPublishedStatus(item.status) ? (
                          <>
                            {canRun(item) ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  setActionError(null);
                                  setActionSuccess(null);
                                  setRunWorkflow(item);
                                }}
                                className="text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                              >
                                Run
                              </button>
                            ) : null}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => openDesigner(item.id)}
                              className="text-xs text-[#0077E6] hover:underline disabled:opacity-50"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleArchive(item)}
                              className="text-xs text-gray-600 hover:underline disabled:opacity-50"
                            >
                              Archive
                            </button>
                          </>
                        ) : null}
                        {isArchivedStatus(item.status) ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openDesigner(item.id)}
                            className="text-xs text-[#0077E6] hover:underline disabled:opacity-50"
                          >
                            View
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={createOpen}
        onClose={closeCreate}
        title={modalTitle}
        subtitle={modalSubtitle}
        width={createPhase === 'templates' ? 'lg' : 'sm'}
        footer={
          createPhase === 'scratch' ? (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={creating}
                onClick={() => setCreatePhase('entry')}
              >
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={creating || !name.trim()}
                onClick={() => void handleCreateScratch()}
              >
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </div>
          ) : null
        }
      >
        {createPhase === 'entry' ? (
          <div className="space-y-3">
            {actionError ? <ErrorMessage message={actionError} /> : null}
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setCreatePhase('scratch');
              }}
              className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-[#0077E6] hover:bg-sky-50/40 transition-colors"
            >
              <p className="text-sm font-semibold text-dark-text">Start from Scratch</p>
              <p className="text-xs text-gray-500 mt-1">
                Create a blank Draft with a single End step and configure it yourself.
              </p>
            </button>
            <button
              type="button"
              onClick={() => {
                setActionError(null);
                setCreatePhase('templates');
              }}
              className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-[#0077E6] hover:bg-sky-50/40 transition-colors"
            >
              <p className="text-sm font-semibold text-dark-text">Choose Template</p>
              <p className="text-xs text-gray-500 mt-1">
                Start from a prebuilt Sales, Meetings, Documents, or Onboarding flow.
              </p>
            </button>
          </div>
        ) : null}

        {createPhase === 'scratch' ? (
          <div className="space-y-4">
            {actionError ? <ErrorMessage message={actionError} /> : null}
            <TextField
              label="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Outbound nurture"
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
          </div>
        ) : null}

        {createPhase === 'templates' ? (
          <div className="space-y-3">
            {actionError ? <ErrorMessage message={actionError} /> : null}
            <WorkflowTemplateSelector
              creating={creating}
              onBack={() => {
                if (!creating) {
                  setActionError(null);
                  setCreatePhase('entry');
                }
              }}
              onCreate={async (request) => {
                await createAndOpen(request);
              }}
            />
          </div>
        ) : null}
      </Modal>

      <RunWorkflowModal
        open={!!runWorkflow}
        workflow={runWorkflow}
        triggerType={runWorkflow ? triggerById[runWorkflow.id] : undefined}
        onClose={() => setRunWorkflow(null)}
        onSuccess={(executionId) => {
          setRunWorkflow(null);
          setActionSuccess('Workflow execution started successfully.');
          navigate(`/app/workflow-executions/${executionId}`);
        }}
      />

      <ConfirmModal
        isOpen={!!confirmCopy}
        onClose={() => {
          if (!pendingId) setConfirmAction(null);
        }}
        onConfirm={() => void runConfirmedAction()}
        title={confirmCopy?.title ?? ''}
        description={confirmCopy?.description}
        confirmLabel={confirmCopy?.confirmLabel}
        tone={confirmCopy?.tone}
        busy={!!pendingId}
      />
    </div>
  );
}

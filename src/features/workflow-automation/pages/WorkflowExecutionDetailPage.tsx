import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorMessage from '../../../components/ErrorMessage';
import Button from '../../../components/Button';
import DashboardLoading from '../../../components/dashboard/DashboardLoading';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import type { ApiError } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { workflowDefinitionsApi } from '../api/workflowDefinitionsApi';
import { workflowExecutionsApi } from '../api/workflowExecutionsApi';
import type { WorkflowDefinition } from '../models/workflowDefinition';
import type {
  WorkflowExecution,
  WorkflowExecutionEventReceipt,
  WorkflowExecutionHistoryItem,
  WorkflowExecutionStepItem,
} from '../models/workflowExecution';
import {
  canCancelExecution,
  canResumeExecution,
  canRetryExecution,
  isOutputsTabStep,
} from '../models/workflowExecution';
import {
  executionEndTimestamp,
  formatDateTime,
  formatDuration,
} from '../lib/executionFormat';
import ExecutionStatusBadge from '../components/executions/ExecutionStatusBadge';
import ExecutionOverviewTab from '../components/executions/ExecutionOverviewTab';
import VariableTreeViewer from '../components/executions/VariableTreeViewer';
import ExecutionTimeline from '../components/executions/ExecutionTimeline';
import ExecutionOutputsTab from '../components/executions/ExecutionOutputsTab';
import ExecutionEventsTab from '../components/executions/ExecutionEventsTab';
import TabAsyncState from '../components/executions/TabAsyncState';
import CopyableValue from '../components/executions/CopyableValue';
import { variableString } from '../lib/executionDisplay';

type TabId = 'overview' | 'variables' | 'history' | 'outputs' | 'events';
type ActionKind = 'cancel' | 'resume' | 'retry';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'variables', label: 'Variables' },
  { id: 'history', label: 'History' },
  { id: 'outputs', label: 'Outputs' },
  { id: 'events', label: 'Events' },
];

type LazyTabState<T> = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T | null;
  error: string | null;
};

function idleTabState<T>(): LazyTabState<T> {
  return { status: 'idle', data: null, error: null };
}

function sortHistoryAsc(items: WorkflowExecutionHistoryItem[]): WorkflowExecutionHistoryItem[] {
  return [...items].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );
}

function resumeConflictMessage(err: ApiError, execution: WorkflowExecution | null): string {
  const backend = err.message?.trim() || '';
  const resumeAt = execution?.resumeAt;
  const lower = backend.toLowerCase();
  const looksLikeEarlyDelay =
    err.status === 409 &&
    (lower.includes('resumeat') ||
      lower.includes('has not been reached') ||
      lower.includes('cannot be resumed yet'));

  const resumeAtFuture =
    !!resumeAt && !Number.isNaN(new Date(resumeAt).getTime()) && new Date(resumeAt).getTime() > Date.now();

  if ((looksLikeEarlyDelay || resumeAtFuture) && resumeAt) {
    return `This workflow cannot be resumed yet. It is scheduled to resume at ${formatDateTime(resumeAt)}.`;
  }

  return backend || 'Could not resume execution.';
}

export default function WorkflowExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { org } = useAuth();
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [definition, setDefinition] = useState<WorkflowDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('overview');
  const [actionPending, setActionPending] = useState<ActionKind | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [retryConfirmOpen, setRetryConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const [historyTab, setHistoryTab] = useState<LazyTabState<WorkflowExecutionHistoryItem[]>>(
    idleTabState,
  );
  const [stepsTab, setStepsTab] = useState<LazyTabState<WorkflowExecutionStepItem[]>>(idleTabState);
  const [eventsTab, setEventsTab] = useState<LazyTabState<WorkflowExecutionEventReceipt[]>>(
    idleTabState,
  );

  const historyFetchedRef = useRef(false);
  const stepsFetchedRef = useRef(false);
  const eventsFetchedRef = useRef(false);
  const actionLockRef = useRef(false);

  const loadDetail = useCallback(
    async (options?: { resetLazyTabs?: boolean; showPageLoading?: boolean }) => {
      if (!id) return null;
      const resetLazyTabs = options?.resetLazyTabs ?? false;
      const showPageLoading = options?.showPageLoading ?? false;

      if (showPageLoading) {
        setLoading(true);
        setError(null);
      }

      if (resetLazyTabs) {
        historyFetchedRef.current = false;
        stepsFetchedRef.current = false;
        eventsFetchedRef.current = false;
        setHistoryTab(idleTabState());
        setStepsTab(idleTabState());
        setEventsTab(idleTabState());
      }

      try {
        const exec = await workflowExecutionsApi.getWorkflowExecution(id);
        setExecution(exec);
        try {
          const def = await workflowDefinitionsApi.getWorkflowDefinition(exec.workflowDefinitionId);
          setDefinition(def);
        } catch {
          setDefinition(null);
        }
        return exec;
      } catch (err) {
        setError((err as ApiError).message || 'Could not load execution.');
        setExecution(null);
        return null;
      } finally {
        if (showPageLoading) setLoading(false);
      }
    },
    [id],
  );

  const refreshLoadedTabs = useCallback(async () => {
    if (!id) return;

    const tasks: Promise<void>[] = [];

    if (historyFetchedRef.current) {
      setHistoryTab((prev) => ({ ...prev, status: 'loading', error: null }));
      tasks.push(
        workflowExecutionsApi
          .getExecutionHistory(id)
          .then((items) => {
            setHistoryTab({ status: 'success', data: sortHistoryAsc(items), error: null });
          })
          .catch((err: ApiError) => {
            setHistoryTab({
              status: 'error',
              data: null,
              error: err.message || 'Could not load history.',
            });
          }),
      );
    }

    if (stepsFetchedRef.current) {
      setStepsTab((prev) => ({ ...prev, status: 'loading', error: null }));
      tasks.push(
        workflowExecutionsApi
          .getExecutionSteps(id)
          .then((items) => {
            setStepsTab({ status: 'success', data: items, error: null });
          })
          .catch((err: ApiError) => {
            setStepsTab({
              status: 'error',
              data: null,
              error: err.message || 'Could not load step outputs.',
            });
          }),
      );
    }

    if (eventsFetchedRef.current) {
      setEventsTab((prev) => ({ ...prev, status: 'loading', error: null }));
      tasks.push(
        workflowExecutionsApi
          .getExecutionEvents(id)
          .then((items) => {
            setEventsTab({ status: 'success', data: items, error: null });
          })
          .catch((err: ApiError) => {
            setEventsTab({
              status: 'error',
              data: null,
              error: err.message || 'Could not load events.',
            });
          }),
      );
    }

    await Promise.all(tasks);
  }, [id]);

  useEffect(() => {
    void loadDetail({ resetLazyTabs: true, showPageLoading: true });
  }, [loadDetail]);

  useEffect(() => {
    if (!id || tab !== 'history' || historyFetchedRef.current) return;
    historyFetchedRef.current = true;
    setHistoryTab({ status: 'loading', data: null, error: null });
    void workflowExecutionsApi
      .getExecutionHistory(id)
      .then((items) => {
        setHistoryTab({ status: 'success', data: sortHistoryAsc(items), error: null });
      })
      .catch((err: ApiError) => {
        setHistoryTab({
          status: 'error',
          data: null,
          error: err.message || 'Could not load history.',
        });
      });
  }, [id, tab]);

  useEffect(() => {
    if (!id || tab !== 'outputs' || stepsFetchedRef.current) return;
    stepsFetchedRef.current = true;
    setStepsTab({ status: 'loading', data: null, error: null });
    void workflowExecutionsApi
      .getExecutionSteps(id)
      .then((items) => {
        setStepsTab({ status: 'success', data: items, error: null });
      })
      .catch((err: ApiError) => {
        setStepsTab({
          status: 'error',
          data: null,
          error: err.message || 'Could not load step outputs.',
        });
      });
  }, [id, tab]);

  useEffect(() => {
    if (!id || tab !== 'events' || eventsFetchedRef.current) return;
    eventsFetchedRef.current = true;
    setEventsTab({ status: 'loading', data: null, error: null });
    void workflowExecutionsApi
      .getExecutionEvents(id)
      .then((items) => {
        setEventsTab({ status: 'success', data: items, error: null });
      })
      .catch((err: ApiError) => {
        setEventsTab({
          status: 'error',
          data: null,
          error: err.message || 'Could not load events.',
        });
      });
  }, [id, tab]);

  const currentStepName = useMemo(() => {
    if (!execution?.currentStepId) return '—';
    const step = definition?.steps?.find((s) => s.id === execution.currentStepId);
    return step?.name || execution.currentStepId;
  }, [execution, definition]);

  const stepNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const step of definition?.steps ?? []) {
      if (step.id && step.name) map[step.id] = step.name;
    }
    return map;
  }, [definition]);

  const leadName = variableString(execution?.variables, 'Candidate.Name');
  const leadCompany = variableString(execution?.variables, 'Job.Title');
  const leadTitle = variableString(execution?.variables, 'Job.Title');

  const duration = useMemo(() => {
    if (!execution) return '—';
    const start = execution.startedAt ?? execution.createdAt;
    const end = executionEndTimestamp(execution);
    const isTerminal = ['completed', 'failed', 'cancelled'].includes(
      execution.status.toLowerCase(),
    );
    return formatDuration(start, isTerminal ? end : null);
  }, [execution]);

  const outputSteps = useMemo(() => {
    const steps = stepsTab.data ?? [];
    return [...steps]
      .filter(isOutputsTabStep)
      .sort((a, b) => {
        const byStep = a.stepDefinitionId.localeCompare(b.stepDefinitionId);
        if (byStep !== 0) return byStep;
        return (a.attempt ?? 0) - (b.attempt ?? 0);
      });
  }, [stepsTab.data]);

  const showCancel = execution ? canCancelExecution(execution.status) : false;
  const showResume = execution ? canResumeExecution(execution.status) : false;
  const showRetry = execution ? canRetryExecution(execution.status) : false;
  const actionsBusy = actionPending !== null;

  const applyActionResult = async (
    updated: WorkflowExecution | null,
    successMessage: string,
  ) => {
    if (updated) {
      setExecution(updated);
    } else {
      await loadDetail({ resetLazyTabs: false, showPageLoading: false });
    }
    await refreshLoadedTabs();
    setActionSuccess(successMessage);
    setActionError(null);
  };

  const handleCancel = async () => {
    if (!id || !execution || actionLockRef.current) return;
    if (!canCancelExecution(execution.status)) return;

    actionLockRef.current = true;
    setCancelConfirmOpen(false);
    setActionPending('cancel');
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await workflowExecutionsApi.cancelExecution(id);
      await applyActionResult(updated, 'Execution cancelled successfully.');
    } catch (err) {
      const apiErr = err as ApiError;
      setActionError(apiErr.message || 'Could not cancel execution.');
      setActionSuccess(null);
      if (apiErr.status === 409) {
        await loadDetail({ resetLazyTabs: false, showPageLoading: false });
        await refreshLoadedTabs();
      }
    } finally {
      actionLockRef.current = false;
      setActionPending(null);
    }
  };

  const handleResume = async () => {
    if (!id || !execution || actionLockRef.current) return;
    if (!canResumeExecution(execution.status)) return;

    actionLockRef.current = true;
    setActionPending('resume');
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await workflowExecutionsApi.resumeExecution(id);
      await applyActionResult(updated, 'Execution resumed successfully.');
    } catch (err) {
      const apiErr = err as ApiError;
      setActionError(resumeConflictMessage(apiErr, execution));
      setActionSuccess(null);
      // Always refresh on conflict / failure so UI matches backend truth.
      if (apiErr.status === 409 || apiErr.status === 400) {
        await loadDetail({ resetLazyTabs: false, showPageLoading: false });
        await refreshLoadedTabs();
      }
    } finally {
      actionLockRef.current = false;
      setActionPending(null);
    }
  };

  const handleRetryConfirm = async () => {
    if (!id || !execution || actionLockRef.current) return;
    if (!canRetryExecution(execution.status)) return;

    actionLockRef.current = true;
    setRetryConfirmOpen(false);
    setActionPending('retry');
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await workflowExecutionsApi.retryExecution(id);
      await applyActionResult(updated, 'Failed step retry started successfully.');
    } catch (err) {
      const apiErr = err as ApiError;
      setActionError(apiErr.message || 'Could not retry execution.');
      setActionSuccess(null);
      if (apiErr.status === 409) {
        await loadDetail({ resetLazyTabs: false, showPageLoading: false });
        await refreshLoadedTabs();
      }
    } finally {
      actionLockRef.current = false;
      setActionPending(null);
    }
  };

  if (loading) return <DashboardLoading />;

  if (error || !execution) {
    return (
      <div className="p-6 lg:px-8">
        <ErrorMessage message={error || 'Execution not found.'} />
        <Link
          to="/app/workflow-executions"
          className="inline-block mt-4 text-sm text-[#0077E6] hover:underline"
        >
          ← Back to executions
        </Link>
      </div>
    );
  }

  const organizationName = org?.name || execution.organizationId;

  const leadSubtitle = [leadTitle && leadTitle !== leadName ? leadTitle : null, leadCompany]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="p-6 lg:px-8 lg:pb-8 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/app/workflow-executions"
            className="text-sm text-[#0077E6] hover:underline"
          >
            ← Workflow Executions
          </Link>
          <h1 className="text-2xl font-bold text-dark-text mt-2">
            {definition?.name || 'Workflow execution'}
          </h1>
          {leadName ? (
            <p className="text-sm text-gray-500 mt-1">
              {leadName}
              {leadSubtitle ? ` · ${leadSubtitle}` : ''}
            </p>
          ) : null}
          <div className="mt-2">
            <CopyableValue value={execution.id} />
          </div>
        </div>
        <div className="flex flex-col items-stretch sm:items-end gap-3">
          <ExecutionStatusBadge status={execution.status} />
          {showRetry || showResume || showCancel ? (
            <div className="flex flex-wrap gap-2 justify-end">
              {showRetry ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={actionsBusy}
                  onClick={() => {
                    setActionError(null);
                    setActionSuccess(null);
                    setRetryConfirmOpen(true);
                  }}
                >
                  {actionPending === 'retry' ? 'Retrying…' : 'Retry Execution'}
                </Button>
              ) : null}
              {showResume ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={actionsBusy}
                  onClick={() => void handleResume()}
                >
                  {actionPending === 'resume' ? 'Resuming…' : 'Resume Execution'}
                </Button>
              ) : null}
              {showCancel ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  disabled={actionsBusy}
                  onClick={() => {
                    setActionError(null);
                    setActionSuccess(null);
                    setCancelConfirmOpen(true);
                  }}
                >
                  {actionPending === 'cancel' ? 'Cancelling…' : 'Cancel Execution'}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {actionSuccess ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {actionSuccess}
        </div>
      ) : null}
      {actionError ? <ErrorMessage message={actionError} /> : null}

      <ConfirmModal
        isOpen={retryConfirmOpen}
        onClose={() => {
          if (!actionsBusy) setRetryConfirmOpen(false);
        }}
        onConfirm={() => void handleRetryConfirm()}
        title="Retry the failed step?"
        description="The workflow will retry only the failed step. Previous completed steps will not run again."
        confirmLabel={actionPending === 'retry' ? 'Retrying…' : 'Retry'}
        busy={actionsBusy}
      />
      <ConfirmModal
        isOpen={cancelConfirmOpen}
        onClose={() => {
          if (!actionsBusy) setCancelConfirmOpen(false);
        }}
        onConfirm={() => void handleCancel()}
        title="Cancel this execution?"
        description="The run will stop. Completed steps stay as they are."
        confirmLabel={actionPending === 'cancel' ? 'Cancelling…' : 'Cancel execution'}
        tone="danger"
        busy={actionsBusy}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Started', value: formatDateTime(execution.startedAt ?? execution.createdAt) },
          { label: 'Updated', value: formatDateTime(execution.updatedAt) },
          { label: 'Duration', value: duration },
          { label: 'Current step', value: currentStepName },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-gray-200 bg-white shadow-sm px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{card.label}</p>
            <p className="text-sm font-semibold text-dark-text mt-1 truncate">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === item.id
                  ? 'border-[#0077E6] text-[#0077E6]'
                  : 'border-transparent text-gray-500 hover:text-dark-text'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {tab === 'overview' ? (
          <ExecutionOverviewTab
            execution={execution}
            definition={definition}
            currentStepName={currentStepName}
            organizationName={organizationName}
          />
        ) : null}
        {tab === 'variables' ? (
          <VariableTreeViewer variables={execution.variables} />
        ) : null}
        {tab === 'history' ? (
          <TabAsyncState
            loading={historyTab.status === 'loading' || historyTab.status === 'idle'}
            error={historyTab.status === 'error' ? historyTab.error : null}
            empty={historyTab.status === 'success' && (historyTab.data?.length ?? 0) === 0}
            emptyTitle="No history yet"
            emptySubtitle="Step events will show up here as the workflow runs."
          >
            <ExecutionTimeline items={historyTab.data ?? []} />
          </TabAsyncState>
        ) : null}
        {tab === 'outputs' ? (
          <TabAsyncState
            loading={stepsTab.status === 'loading' || stepsTab.status === 'idle'}
            error={stepsTab.status === 'error' ? stepsTab.error : null}
            empty={stepsTab.status === 'success' && outputSteps.length === 0}
            emptyTitle="No outputs yet"
            emptySubtitle="Step results will appear here after a step finishes."
          >
            <ExecutionOutputsTab steps={outputSteps} stepNameById={stepNameById} />
          </TabAsyncState>
        ) : null}
        {tab === 'events' ? (
          <TabAsyncState
            loading={eventsTab.status === 'loading' || eventsTab.status === 'idle'}
            error={eventsTab.status === 'error' ? eventsTab.error : null}
            empty={eventsTab.status === 'success' && (eventsTab.data?.length ?? 0) === 0}
            emptyTitle="No inbound events"
            emptySubtitle="Replies, bookings, and signatures that resume this run will show here."
          >
            <ExecutionEventsTab events={eventsTab.data ?? []} />
          </TabAsyncState>
        ) : null}
      </div>
    </div>
  );
}

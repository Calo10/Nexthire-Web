import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatDateTime } from '../../lib/executionFormat';
import type { WorkflowExecution } from '../../models/workflowExecution';
import type { WorkflowDefinition } from '../../models/workflowDefinition';
import ExecutionStatusBadge from './ExecutionStatusBadge';
import PropertyGrid from './PropertyGrid';
import CopyableValue from './CopyableValue';

type Props = {
  execution: WorkflowExecution;
  definition: WorkflowDefinition | null;
  currentStepName: string;
  organizationName: string;
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-3 border-b border-gray-50 last:border-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</dt>
      <dd className="sm:col-span-2 text-sm font-medium text-dark-text break-words">{children}</dd>
    </div>
  );
}

export default function ExecutionOverviewTab({
  execution,
  definition,
  currentStepName,
  organizationName,
}: Props) {
  const metadata = execution.metadata ?? {};
  const hasMetadata = Object.keys(metadata).length > 0;
  const timestamps: { label: string; value: string | null | undefined }[] = [
    { label: 'Created', value: execution.createdAt },
    { label: 'Started', value: execution.startedAt },
    { label: 'Waiting since', value: execution.waitingSince },
    { label: 'Resume at', value: execution.resumeAt },
    { label: 'Updated', value: execution.updatedAt },
    { label: 'Completed', value: execution.completedAt },
    { label: 'Cancelled', value: execution.cancelledAt },
    { label: 'Failed', value: execution.failedAt },
  ].filter((row) => row.value);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h3 className="text-base font-semibold text-dark-text mb-1">Run</h3>
        <p className="text-sm text-gray-500 mb-4">Who this execution belongs to and where it is now.</p>
        <dl>
          <Row label="Workflow">
            {definition?.id ? (
              <Link
                to={`/app/workflow-automation/${definition.id}`}
                className="text-[#0077E6] hover:underline"
              >
                {definition.name}
              </Link>
            ) : (
              definition?.name ?? execution.workflowDefinitionId
            )}
            <span className="text-gray-400 font-normal"> · v{execution.workflowVersion}</span>
          </Row>
          <Row label="Execution">
            <CopyableValue value={execution.id} compact={false} />
          </Row>
          <Row label="Organization">{organizationName || execution.organizationId}</Row>
          <Row label="Status">
            <ExecutionStatusBadge status={execution.status} />
          </Row>
          <Row label="Current step">{currentStepName}</Row>
          <Row label="Entity">
            <span className="capitalize">{execution.entityType}</span>
            <span className="text-gray-400 font-normal"> · </span>
            <CopyableValue value={execution.entityId} />
          </Row>
          {execution.conversationId ? (
            <Row label="Conversation">
              <CopyableValue value={execution.conversationId} />
            </Row>
          ) : null}
          {execution.failureReason ? (
            <Row label="Failure reason">
              <span className="text-red-700">{execution.failureReason}</span>
            </Row>
          ) : null}
        </dl>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h3 className="text-base font-semibold text-dark-text mb-1">Timestamps</h3>
        <p className="text-sm text-gray-500 mb-4">When this run moved between states.</p>
        <dl>
          {timestamps.map((row) => (
            <Row key={row.label} label={row.label}>
              {formatDateTime(row.value)}
            </Row>
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
        <h3 className="text-base font-semibold text-dark-text mb-1">Metadata</h3>
        <p className="text-sm text-gray-500 mb-4">Extra context attached to this run.</p>
        {hasMetadata ? (
          <PropertyGrid value={metadata} />
        ) : (
          <p className="text-sm text-gray-400">No metadata for this execution.</p>
        )}
      </section>
    </div>
  );
}

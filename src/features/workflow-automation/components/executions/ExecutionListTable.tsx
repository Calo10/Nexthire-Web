import { Link } from 'react-router-dom';
import ExecutionStatusBadge from './ExecutionStatusBadge';
import {
  executionEndTimestamp,
  formatDateTime,
  formatDuration,
} from '../../lib/executionFormat';
import type { WorkflowExecutionListItem } from '../../models/workflowExecution';

export type ExecutionListRow = WorkflowExecutionListItem & {
  workflowName: string;
  organizationName: string;
  currentStepName: string;
  startedAtDisplay: string;
};

type Props = {
  rows: ExecutionListRow[];
  loading?: boolean;
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-gray-50">
          {Array.from({ length: 10 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-3 rounded bg-gray-100 animate-pulse w-20" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function ExecutionListTable({ rows, loading }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-[1100px]">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50/50">
            <th className="px-4 py-3 font-medium">Workflow</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Organization</th>
            <th className="px-4 py-3 font-medium">Started</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 font-medium">Duration</th>
            <th className="px-4 py-3 font-medium">Current Step</th>
            <th className="px-4 py-3 font-medium">Entity Type</th>
            <th className="px-4 py-3 font-medium">Entity Id</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                No workflow executions found.
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const started = row.startedAtDisplay;
              const end = executionEndTimestamp({
                status: row.status,
                updatedAt: row.updatedAt,
              });
              return (
                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/40">
                  <td className="px-4 py-3 font-medium text-dark-text max-w-[180px] truncate">
                    {row.workflowName}
                  </td>
                  <td className="px-4 py-3">
                    <ExecutionStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                    {row.organizationName}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDateTime(started)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDateTime(row.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {formatDuration(started, end)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                    {row.currentStepName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.entityType}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs max-w-[140px] truncate">
                    {row.entityId}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/app/workflow-executions/${row.id}`}
                      className="text-xs text-[#0077E6] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

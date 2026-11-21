import Badge from '../../../../components/ui/Badge';
import { formatDateTime } from '../../lib/executionFormat';
import { humanizeLabel } from '../../lib/executionDisplay';
import type { WorkflowExecutionEventReceipt } from '../../models/workflowExecution';
import CopyableValue from './CopyableValue';
import { SmartValue } from './PropertyGrid';

type Props = {
  events: WorkflowExecutionEventReceipt[];
};

export default function ExecutionEventsTab({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
        <p className="text-sm font-medium text-dark-text">No inbound events</p>
        <p className="text-sm text-gray-500 mt-1">
          Replies, bookings, and signatures that resume this run will show here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100 bg-gray-50/50">
              <th className="px-5 py-3 font-medium">Event</th>
              <th className="px-5 py-3 font-medium">Correlation</th>
              <th className="px-5 py-3 font-medium">Received</th>
              <th className="px-5 py-3 font-medium">Event ID</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.eventId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/40">
                <td className="px-5 py-3.5">
                  {event.eventType ? (
                    <Badge tone="blue">{humanizeLabel(event.eventType)}</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-gray-600 max-w-[240px]">
                  <SmartValue name="correlationId" value={event.correlationId} />
                </td>
                <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                  {formatDateTime(event.processedAt)}
                </td>
                <td className="px-5 py-3.5">
                  <CopyableValue value={event.eventId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

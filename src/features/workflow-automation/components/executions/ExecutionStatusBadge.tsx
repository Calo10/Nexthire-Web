import Badge from '../../../../components/ui/Badge';
import { normalizeExecutionStatus } from '../../models/workflowExecution';

function toneForStatus(status: string): 'gray' | 'blue' | 'yellow' | 'green' | 'red' | 'purple' {
  switch (normalizeExecutionStatus(status)) {
    case 'Pending':
      return 'gray';
    case 'Running':
      return 'blue';
    case 'Waiting':
      return 'yellow';
    case 'Completed':
      return 'green';
    case 'Failed':
      return 'red';
    case 'Cancelled':
      return 'purple';
    default:
      return 'gray';
  }
}

export default function ExecutionStatusBadge({ status }: { status: string }) {
  const label = normalizeExecutionStatus(status);
  return (
    <Badge tone={toneForStatus(status)} dot>
      {label}
    </Badge>
  );
}

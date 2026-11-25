import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import Badge from '../../../components/ui/Badge';
import {
  isDraftStatus,
  isPublishedStatus,
  type WorkflowDefinitionStatus,
} from '../models/workflowDefinition';

type Props = {
  name: string;
  status: WorkflowDefinitionStatus;
  dirty: boolean;
  saving: boolean;
  readOnly: boolean;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onPublish: () => void;
};

function statusTone(status: string): 'gray' | 'green' | 'yellow' | 'blue' {
  if (isDraftStatus(status)) return 'yellow';
  if (isPublishedStatus(status)) return 'green';
  return 'gray';
}

export default function WorkflowToolbar({
  name,
  status,
  dirty,
  saving,
  readOnly,
  onNameChange,
  onSave,
  onPublish,
}: Props) {
  return (
    <div className="h-14 shrink-0 border-b border-gray-200 bg-white px-4 flex items-center gap-3">
      <Link
        to="/app/workflow-automation"
        className="text-sm text-gray-500 hover:text-dark-text shrink-0"
      >
        ← Workflows
      </Link>
      <div className="w-px h-6 bg-gray-200 shrink-0" />
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        disabled={readOnly}
        className="flex-1 min-w-0 text-sm font-semibold text-dark-text bg-transparent border-0 focus:outline-none focus:ring-0 disabled:text-gray-500"
        placeholder="Workflow name"
      />
      <Badge tone={statusTone(status)}>{status}</Badge>
      {dirty ? (
        <span className="text-xs text-amber-600 font-medium shrink-0">Unsaved changes</span>
      ) : null}
      {!readOnly ? (
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {isDraftStatus(status) ? (
            <Button type="button" size="sm" onClick={onPublish} disabled={saving || dirty}>
              Publish
            </Button>
          ) : null}
        </>
      ) : (
        <span className="text-xs text-gray-500 shrink-0">Read-only</span>
      )}
    </div>
  );
}

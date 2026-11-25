import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorMessage from '../../../components/ErrorMessage';
import DashboardLoading from '../../../components/dashboard/DashboardLoading';
import type { ApiError } from '../../../lib/api';
import { workflowDefinitionsApi } from '../api/workflowDefinitionsApi';
import { applyOutboundWaitConfiguration } from '../models/activityCatalog';
import {
  normalizeConfiguration,
  normalizeDesignerMetadata,
  normalizeMetadata,
  resolveWorkflowTrigger,
  type WorkflowDefinition,
} from '../models/workflowDefinition';
import WorkflowDesigner from '../components/WorkflowDesigner';

function normalizeDefinition(definition: WorkflowDefinition): WorkflowDefinition {
  return {
    ...definition,
    trigger: resolveWorkflowTrigger(definition.trigger),
    metadata: normalizeDesignerMetadata(definition.metadata),
    steps: (definition.steps ?? []).map((step) => ({
      ...step,
      configuration: applyOutboundWaitConfiguration(
        step.activityType,
        normalizeConfiguration(step.configuration),
      ),
      metadata: normalizeMetadata(step.metadata),
      transitions: step.transitions ?? [],
    })),
  };
}

export default function WorkflowDesignerPage() {
  const { id } = useParams<{ id: string }>();
  const [definition, setDefinition] = useState<WorkflowDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await workflowDefinitionsApi.getWorkflowDefinition(id);
      setDefinition(normalizeDefinition(result));
    } catch (err) {
      setError((err as ApiError).message || 'Could not load workflow.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <DashboardLoading />;

  if (error || !definition) {
    return (
      <div className="p-6 lg:px-8">
        <ErrorMessage message={error || 'Workflow not found.'} />
        <Link
          to="/app/workflow-automation"
          className="inline-block mt-4 text-sm text-[#0077E6] hover:underline"
        >
          ← Back to workflows
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <WorkflowDesigner
        definition={definition}
        onDefinitionChange={(next) => setDefinition(normalizeDefinition(next))}
      />
    </div>
  );
}

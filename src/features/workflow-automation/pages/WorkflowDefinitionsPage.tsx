import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/ui/PageHeader';
import ErrorMessage from '../../../components/ErrorMessage';
import DashboardLoading from '../../../components/dashboard/DashboardLoading';
import type { ApiError } from '../../../lib/api';
import { workflowDefinitionsApi } from '../api/workflowDefinitionsApi';
import type { WorkflowDefinitionListItem } from '../models/workflowDefinition';
import WorkflowList from '../components/WorkflowList';

export default function WorkflowDefinitionsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<WorkflowDefinitionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await workflowDefinitionsApi.listWorkflowDefinitions();
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      setError((err as ApiError).message || 'Could not load workflows.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <DashboardLoading />;

  return (
    <div className="p-6 lg:px-8 lg:pb-8">
      <PageHeader
        title="Workflow Automation"
        subtitle="Design, publish, and manage automated workflow definitions."
      />
      {import.meta.env.PROD ? (
        <p className="mb-6 -mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-2xl">
          {t('workflows.underConstruction.automationMessage')}
        </p>
      ) : null}
      {error ? (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      ) : null}
      <WorkflowList items={items} onRefresh={load} />
    </div>
  );
}

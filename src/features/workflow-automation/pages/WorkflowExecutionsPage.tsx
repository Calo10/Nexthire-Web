import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/ui/PageHeader';
import ErrorMessage from '../../../components/ErrorMessage';
import type { ApiError } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { workflowDefinitionsApi } from '../api/workflowDefinitionsApi';
import { workflowExecutionsApi } from '../api/workflowExecutionsApi';
import type { WorkflowDefinition, WorkflowDefinitionListItem } from '../models/workflowDefinition';
import type { WorkflowExecutionListItem } from '../models/workflowExecution';
import { EXECUTION_STATUSES } from '../models/workflowExecution';
import ExecutionListTable, {
  type ExecutionListRow,
} from '../components/executions/ExecutionListTable';

const REFRESH_MS = 30_000;

export default function WorkflowExecutionsPage() {
  const { t } = useTranslation();
  const { org } = useAuth();
  const [items, setItems] = useState<WorkflowExecutionListItem[]>([]);
  const [definitions, setDefinitions] = useState<WorkflowDefinitionListItem[]>([]);
  const [definitionDetails, setDefinitionDetails] = useState<Record<string, WorkflowDefinition>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workflowFilter, setWorkflowFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');

  const organizationName = org?.name || 'Current organization';

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [executions, defs] = await Promise.all([
        workflowExecutionsApi.listWorkflowExecutions(),
        workflowDefinitionsApi.listWorkflowDefinitions(),
      ]);
      const list = Array.isArray(executions) ? executions : [];
      const defList = Array.isArray(defs) ? defs : [];
      setItems(list);
      setDefinitions(defList);

      const uniqueDefIds = [...new Set(list.map((e) => e.workflowDefinitionId).filter(Boolean))];
      const fetched = await Promise.all(
        uniqueDefIds.map(async (defId) => {
          try {
            return await workflowDefinitionsApi.getWorkflowDefinition(defId);
          } catch {
            return null;
          }
        }),
      );
      const nextDetails: Record<string, WorkflowDefinition> = {};
      for (const def of fetched) {
        if (def) nextDetails[def.id] = def;
      }
      setDefinitionDetails(nextDetails);
    } catch (err) {
      setError((err as ApiError).message || 'Could not load workflow executions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load({ silent: true });
    }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const definitionNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of definitions) map.set(d.id, d.name);
    for (const d of Object.values(definitionDetails)) map.set(d.id, d.name);
    return map;
  }, [definitions, definitionDetails]);

  const rows: ExecutionListRow[] = useMemo(() => {
    const mapped = items.map((item) => {
      const detail = definitionDetails[item.workflowDefinitionId];
      const step = detail?.steps?.find((s) => s.id === item.currentStepId);
      return {
        ...item,
        workflowName: definitionNameById.get(item.workflowDefinitionId) || item.workflowDefinitionId,
        organizationName,
        currentStepName: step?.name || (item.currentStepId ? item.currentStepId.slice(0, 8) + '…' : '—'),
        startedAtDisplay: item.createdAt,
      };
    });

    mapped.sort(
      (a, b) => new Date(b.startedAtDisplay).getTime() - new Date(a.startedAtDisplay).getTime(),
    );

    return mapped.filter((row) => {
      if (statusFilter !== 'all' && row.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (workflowFilter !== 'all' && row.workflowDefinitionId !== workflowFilter) {
        return false;
      }
      if (organizationFilter !== 'all' && organizationFilter !== 'current') {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const haystack = [
          row.workflowName,
          row.status,
          row.organizationName,
          row.entityType,
          row.entityId,
          row.currentStepName,
          row.id,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [
    items,
    definitionDetails,
    definitionNameById,
    organizationName,
    statusFilter,
    workflowFilter,
    organizationFilter,
    query,
  ]);

  return (
    <div className="p-6 lg:px-8 lg:pb-8">
      <PageHeader
        title="Workflow Executions"
        subtitle="Monitor workflow runs for support, debugging, and operations."
      >
        <span className="text-xs text-gray-400">
          {refreshing ? 'Refreshing…' : 'Auto-refresh 30s'}
        </span>
      </PageHeader>
      {import.meta.env.PROD ? (
        <p className="mb-6 -mt-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-2xl">
          {t('workflows.underConstruction.executionsMessage')}
        </p>
      ) : null}

      {error ? (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      ) : null}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Search</label>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Workflow, entity, status…"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6]"
            >
              <option value="all">All statuses</option>
              {EXECUTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Workflow</label>
            <select
              value={workflowFilter}
              onChange={(e) => setWorkflowFilter(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6]"
            >
              <option value="all">All workflows</option>
              {definitions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Organization</label>
            <select
              value={organizationFilter}
              onChange={(e) => setOrganizationFilter(e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0077E6]/20 focus:border-[#0077E6]"
            >
              <option value="all">All</option>
              <option value="current">{organizationName}</option>
            </select>
          </div>
        </div>
      </div>

      <ExecutionListTable rows={rows} loading={loading} />
    </div>
  );
}

import { apiClient } from '../../../lib/api';
import type {
  CreateWorkflowExecutionRequest,
  WorkflowExecution,
  WorkflowExecutionEventReceipt,
  WorkflowExecutionHistoryItem,
  WorkflowExecutionListItem,
  WorkflowExecutionStepItem,
} from '../models/workflowExecution';

const BASE = '/workflow-executions';

export const workflowExecutionsApi = {
  listWorkflowExecutions: () =>
    apiClient.get<WorkflowExecutionListItem[]>(BASE),

  getWorkflowExecution: (id: string) =>
    apiClient.get<WorkflowExecution>(`${BASE}/${id}`),

  createWorkflowExecution: (request: CreateWorkflowExecutionRequest) =>
    apiClient.post<WorkflowExecution>(BASE, request),

  executeWorkflowExecution: (id: string) =>
    apiClient.post<WorkflowExecution>(`${BASE}/${id}/execute`),

  getExecutionHistory: (id: string) =>
    apiClient.get<WorkflowExecutionHistoryItem[]>(`${BASE}/${id}/history`),

  getExecutionSteps: (id: string) =>
    apiClient.get<WorkflowExecutionStepItem[]>(`${BASE}/${id}/steps`),

  getExecutionEvents: (id: string) =>
    apiClient.get<WorkflowExecutionEventReceipt[]>(`${BASE}/${id}/events`),

  cancelExecution: (id: string) =>
    apiClient.post<WorkflowExecution>(`${BASE}/${id}/cancel`),

  resumeExecution: (id: string) =>
    apiClient.post<WorkflowExecution>(`${BASE}/${id}/resume`),

  retryExecution: (id: string) =>
    apiClient.post<WorkflowExecution>(`${BASE}/${id}/retry`),
};

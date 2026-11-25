import { apiClient } from '../../../lib/api';
import type {
  CreateWorkflowDefinitionRequest,
  UpdateWorkflowDefinitionRequest,
  WorkflowDefinition,
  WorkflowDefinitionListItem,
} from '../models/workflowDefinition';

const BASE = '/workflow-definitions';

export const workflowDefinitionsApi = {
  listWorkflowDefinitions: () =>
    apiClient.get<WorkflowDefinitionListItem[]>(BASE),

  getWorkflowDefinition: (id: string) =>
    apiClient.get<WorkflowDefinition>(`${BASE}/${id}`),

  createWorkflowDefinition: (request: CreateWorkflowDefinitionRequest) =>
    apiClient.post<WorkflowDefinition>(BASE, request),

  updateWorkflowDefinition: (id: string, request: UpdateWorkflowDefinitionRequest) =>
    apiClient.put<WorkflowDefinition>(`${BASE}/${id}`, request),

  deleteWorkflowDefinition: (id: string) =>
    apiClient.delete<void>(`${BASE}/${id}`),

  publishWorkflowDefinition: (id: string) =>
    apiClient.post<WorkflowDefinition>(`${BASE}/${id}/publish`),

  archiveWorkflowDefinition: (id: string) =>
    apiClient.post<WorkflowDefinition>(`${BASE}/${id}/archive`),
};

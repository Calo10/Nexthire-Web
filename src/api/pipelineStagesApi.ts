import { apiClient } from '../lib/api';
import type { PipelineStageSettings } from '../types/pipelineStages';

export const pipelineStagesApi = {
  list: (): Promise<PipelineStageSettings[]> => {
    return apiClient.get<PipelineStageSettings[]>('/org/settings/pipeline-stages');
  },

  create: (name: string): Promise<PipelineStageSettings[]> => {
    return apiClient.post<PipelineStageSettings[]>('/org/settings/pipeline-stages', { name });
  },

  rename: (id: string, name: string): Promise<PipelineStageSettings[]> => {
    return apiClient.patch<PipelineStageSettings[]>(`/org/settings/pipeline-stages/${id}`, { name });
  },

  reorder: (stageIds: string[]): Promise<PipelineStageSettings[]> => {
    return apiClient.put<PipelineStageSettings[]>('/org/settings/pipeline-stages/order', { stageIds });
  },

  remove: (id: string): Promise<PipelineStageSettings[]> => {
    return apiClient.delete<PipelineStageSettings[]>(`/org/settings/pipeline-stages/${id}`);
  },
};

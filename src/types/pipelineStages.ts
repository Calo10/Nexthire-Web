export interface PipelineStageSettings {
  id: string;
  name: string;
  sortOrder: number;
  isSystem: boolean;
  applicationCount: number;
  historyCount: number;
  canDelete: boolean;
  deleteBlockedReason: 'in_use' | 'history' | 'last_stage' | null;
}

export interface PipelineStageNameRequest {
  name: string;
}

export interface ReorderPipelineStagesRequest {
  stageIds: string[];
}

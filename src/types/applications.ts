export interface ApplicationListItem {
  id: string;
  candidateId?: string | null;
  jobId?: string | null;
  candidateName?: string | null;
  jobTitle?: string | null;
  createdAt?: string | null;
}

export interface ApplicationsListResponse {
  items: ApplicationListItem[];
  page?: number;
  pageSize?: number;
  total?: number;
}

export interface ListApplicationsParams {
  search?: string;
  page?: number;
  pageSize?: number;
  jobId?: string;
  candidateId?: string;
}

// -----------------------
// Pipeline / Kanban types
// -----------------------

export interface KanbanStage {
  id: string;
  name: string;
  order?: number;
}

export interface KanbanApplicationCard {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string | null;
  candidatePhone?: string | null;
  jobId: string | number;
  jobTitle?: string | null;
  stageId: string;
  status?: string | null;
  createdAt?: string | null;
  fitScore?: number | null;
}

export interface KanbanColumn {
  stageId: string;
  stageName: string;
  items: KanbanApplicationCard[];
}

export interface ApplicationsKanbanResponse {
  stages: KanbanStage[];
  columns: KanbanColumn[];
}

export interface CreateApplicationPayload {
  candidateId: string;
  jobId: string | number;
}

// -----------------------
// Pipeline Inspector types
// -----------------------

export interface ApplicationStageHistoryItem {
  id: string;
  at: string; // ISO string
  fromStageId?: string | null;
  fromStageName?: string | null;
  toStageId?: string | null;
  toStageName?: string | null;
  by?: string | null;
}

export interface ApplicationNote {
  id: string;
  applicationId: string;
  body: string;
  createdByUserId?: string | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}



export interface DashboardSummary {
  openJobs: number;
  newCandidates: number;
  newApplications: number;
  upcomingInterviews: number;
  offersSent: number;
  avgTimeToHireDays: number;
}

export interface RecentActivity {
  id: string;
  type: 'candidate' | 'job' | 'interview' | 'hire';
  title: string;
  createdAt: string;
}

export interface Candidate {
  candidateId: string;
  fullName: string;
  email: string;
  currentStageName: string;
  updatedAt: string;
}

export interface ApplicationsByStage {
  stageId: string;
  stageName: string;
  count: number;
}

export interface ActivityTrend {
  date: string;
  applications: number;
  candidates: number;
}

export interface Job {
  id: string | number;
  title: string;
  description?: string;
  company?: string;
  location?: string;
  salary?: number;
  // Backend may evolve; keep flexible while UI normalizes values.
  status: string;
  department?: string;
  applicantsCount?: number;
  applicationsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  taskId: string;
  title: string;
  dueAt: string;
  status: 'open' | 'completed' | 'closed';
  relatedJobId?: string;
  relatedCandidateId?: string;
}

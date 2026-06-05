import { apiClient } from '../lib/api';
import type {
  CreateJobBotQuestionRequest,
  JobBotQuestion,
  UpdateJobBotQuestionRequest,
} from '../types/jobBotQuestions';

function basePath(jobId: string) {
  return `/jobs/${encodeURIComponent(jobId)}/bot-questions`;
}

export const jobBotQuestionsService = {
  list: async (jobId: string, includeInactive = false): Promise<JobBotQuestion[]> => {
    const query = includeInactive ? '?includeInactive=true' : '';
    return apiClient.get<JobBotQuestion[]>(`${basePath(jobId)}${query}`);
  },

  get: async (jobId: string, questionId: string): Promise<JobBotQuestion> => {
    return apiClient.get<JobBotQuestion>(`${basePath(jobId)}/${encodeURIComponent(questionId)}`);
  },

  create: async (jobId: string, payload: CreateJobBotQuestionRequest): Promise<JobBotQuestion> => {
    return apiClient.post<JobBotQuestion>(basePath(jobId), payload);
  },

  update: async (
    jobId: string,
    questionId: string,
    payload: UpdateJobBotQuestionRequest
  ): Promise<JobBotQuestion> => {
    return apiClient.put<JobBotQuestion>(`${basePath(jobId)}/${encodeURIComponent(questionId)}`, payload);
  },

  remove: async (jobId: string, questionId: string): Promise<void> => {
    await apiClient.delete(`${basePath(jobId)}/${encodeURIComponent(questionId)}`);
  },
};

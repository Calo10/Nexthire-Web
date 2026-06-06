export type JobBotAnswerType = 'text' | 'number' | 'yes_no' | 'file';

export interface JobBotQuestion {
  id: string;
  jobId: string;
  questionKey: string;
  questionText: string;
  answerType: JobBotAnswerType;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobBotQuestionRequest {
  questionKey: string;
  questionText: string;
  answerType: JobBotAnswerType;
  sortOrder?: number;
  isRequired?: boolean;
  isActive?: boolean;
}

export interface UpdateJobBotQuestionRequest {
  questionText: string;
  answerType: JobBotAnswerType;
  sortOrder?: number;
  isRequired?: boolean;
  isActive?: boolean;
}

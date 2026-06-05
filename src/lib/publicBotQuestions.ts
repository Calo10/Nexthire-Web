import type { JobBotAnswerType, JobBotQuestion } from '../types/jobBotQuestions';

export function sortActiveBotQuestions(questions: JobBotQuestion[] | undefined | null): JobBotQuestion[] {
  if (!questions?.length) return [];
  return [...questions]
    .filter((q) => q.isActive !== false)
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

export function normalizePublicBotQuestions(raw: unknown): JobBotQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ''),
      jobId: String(item.jobId ?? ''),
      questionKey: String(item.questionKey ?? ''),
      questionText: String(item.questionText ?? ''),
      answerType: String(item.answerType ?? 'text') as JobBotAnswerType,
      sortOrder: Number(item.sortOrder ?? 0),
      isRequired: item.isRequired !== false,
      isActive: item.isActive !== false,
      createdAt: String(item.createdAt ?? ''),
      updatedAt: String(item.updatedAt ?? ''),
    }))
    .filter((q) => q.id && q.questionKey && q.questionText);
}

export interface PublicApplyDynamicAnswer {
  questionId: string;
  key: string;
  label: string;
  value: string;
  answeredAtUtc: string;
}

export interface DynamicAnswersPayload {
  version: 1;
  answers: PublicApplyDynamicAnswer[];
}

export function buildDynamicAnswersPayload(
  questions: JobBotQuestion[],
  values: Record<string, string>,
  fileIds: Record<string, string> = {},
  options?: { omitFileQuestions?: boolean }
): DynamicAnswersPayload {
  const list = options?.omitFileQuestions ? questions.filter((q) => q.answerType !== 'file') : questions;

  const answers: PublicApplyDynamicAnswer[] = list.map((q) => ({
    questionId: q.id,
    key: q.questionKey,
    label: q.questionText,
    value:
      q.answerType === 'file'
        ? String(fileIds[q.id] ?? '').trim()
        : String(values[q.id] ?? '').trim(),
    answeredAtUtc: new Date().toISOString(),
  }));

  return { version: 1, answers };
}

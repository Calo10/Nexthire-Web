import { buildDynamicAnswersPayload, sortActiveBotQuestions } from './publicBotQuestions';
import type { JobBotQuestion } from '../types/jobBotQuestions';

function appendFormField(form: FormData, name: string, value: string) {
  form.append(name, value);
}

function appendJsonPart(form: FormData, name: string, payload: unknown) {
  form.append(name, JSON.stringify(payload));
}

export interface LeadApplyFormInput {
  jobId: string | number;
  sourceTypeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  botQuestions: JobBotQuestion[];
  dynamicValues: Record<string, string>;
  dynamicFiles: Record<string, File | null | undefined>;
}

/** Multipart body aligned with public job apply — used for manual sourcing leads. */
export function buildLeadApplyFormData(input: LeadApplyFormInput): FormData {
  const questions = sortActiveBotQuestions(input.botQuestions);
  const values: Record<string, string> = {};
  const files: Record<string, File> = {};

  for (const q of questions) {
    if (q.answerType === 'file') {
      const file = input.dynamicFiles[q.id];
      if (file) files[q.id] = file;
    } else {
      values[q.id] = String(input.dynamicValues[q.id] ?? '').trim();
    }
  }

  const dynamicAnswersJson = buildDynamicAnswersPayload(questions, values, {});
  const form = new FormData();
  const jobIdStr = String(input.jobId);
  const firstName = String(input.firstName || '').trim();
  const lastName = String(input.lastName || '').trim();
  const email = String(input.email || '').trim();
  const phone = input.phone ? String(input.phone).trim() : '';
  const sourceTypeCode = String(input.sourceTypeCode || 'manual_entry');

  appendFormField(form, 'jobId', jobIdStr);
  appendFormField(form, 'JobId', jobIdStr);
  appendFormField(form, 'sourceTypeCode', sourceTypeCode);
  appendFormField(form, 'SourceTypeCode', sourceTypeCode);
  appendFormField(form, 'firstName', firstName);
  appendFormField(form, 'FirstName', firstName);
  appendFormField(form, 'lastName', lastName);
  appendFormField(form, 'LastName', lastName);
  appendFormField(form, 'email', email);
  appendFormField(form, 'Email', email);
  appendFormField(form, 'phone', phone);
  appendFormField(form, 'Phone', phone);
  appendJsonPart(form, 'dynamicAnswersJson', dynamicAnswersJson);

  for (const q of questions) {
    if (q.answerType !== 'file') continue;
    const file = files[q.id];
    if (!file) continue;
    form.append(`AnswerFile_${q.questionKey}`, file);
    form.append(`AnswerFile_${q.id}`, file);
    form.append(`answerFile_${q.questionKey}`, file);
    form.append(`answerFile_${q.id}`, file);
  }

  return form;
}

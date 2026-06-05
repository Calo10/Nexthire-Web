import { useTranslation } from 'react-i18next';
import TextField from '../TextField';
import TextareaField from '../TextareaField';
import SelectField from '../SelectField';
import type { JobBotQuestion } from '../../types/jobBotQuestions';

interface PublicBotQuestionFieldsProps {
  questions: JobBotQuestion[];
  values: Record<string, string>;
  files: Record<string, File | null>;
  errors: Record<string, string>;
  onValueChange: (questionId: string, value: string) => void;
  onFileChange: (questionId: string, file: File | null) => void;
}

export default function PublicBotQuestionFields({
  questions,
  values,
  files,
  errors,
  onValueChange,
  onFileChange,
}: PublicBotQuestionFieldsProps) {
  const { t } = useTranslation();

  const yesNoOptions = [
    { value: '', label: t('publicJobs.apply.options.select') },
    { value: 'yes', label: t('publicJobs.apply.options.yes') },
    { value: 'no', label: t('publicJobs.apply.options.no') },
  ];

  if (questions.length === 0) return null;

  return (
    <div className="space-y-6 border-t border-gray-200 pt-6">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {t('publicJobs.apply.botQuestionsSection')}
      </h3>
      {questions.map((question) => {
        const label = question.questionText;
        const required = question.isRequired;
        const error = errors[question.id];

        if (question.answerType === 'yes_no') {
          return (
            <SelectField
              key={question.id}
              label={label}
              required={required}
              value={values[question.id] ?? ''}
              onChange={(e) => onValueChange(question.id, e.target.value)}
              options={yesNoOptions}
              error={error}
            />
          );
        }

        if (question.answerType === 'number') {
          return (
            <TextField
              key={question.id}
              label={label}
              required={required}
              type="number"
              min={0}
              value={values[question.id] ?? ''}
              onChange={(e) => onValueChange(question.id, e.target.value)}
              error={error}
            />
          );
        }

        if (question.answerType === 'file') {
          const file = files[question.id];
          return (
            <div key={question.id} className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
                {required ? <span className="text-red-500 ml-1">*</span> : null}
              </label>
              <div
                className={`rounded-lg border bg-white px-4 py-3 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => onFileChange(question.id, e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {file ? <p className="mt-2 text-xs text-gray-500">{file.name}</p> : null}
              </div>
              {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
            </div>
          );
        }

        return (
          <TextareaField
            key={question.id}
            label={label}
            required={required}
            rows={3}
            value={values[question.id] ?? ''}
            onChange={(e) => onValueChange(question.id, e.target.value)}
            error={error}
          />
        );
      })}
    </div>
  );
}

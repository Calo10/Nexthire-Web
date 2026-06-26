import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import TextField from '../TextField';
import TextareaField from '../TextareaField';
import SelectField from '../SelectField';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import type { ApiError } from '../../lib/api';
import { jobBotQuestionsService } from '../../services/jobBotQuestionsService';
import type { JobBotAnswerType, JobBotQuestion } from '../../types/jobBotQuestions';

type FormMode = 'idle' | 'create' | 'edit';

interface FormState {
  questionText: string;
  answerType: JobBotAnswerType;
  sortOrder: string;
  isRequired: boolean;
  isActive: boolean;
}

const emptyForm: FormState = {
  questionText: '',
  answerType: 'text',
  sortOrder: '',
  isRequired: true,
  isActive: true,
};

function slugifyQuestionKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 80);
}

function buildQuestionKey(questionText: string, existingKeys: Iterable<string>): string {
  const taken = new Set(Array.from(existingKeys).map((key) => key.toLowerCase()));
  let base = slugifyQuestionKey(questionText.trim());
  if (base.length < 2) base = 'question';

  if (!taken.has(base)) return base;

  for (let i = 2; i <= 999; i++) {
    const suffix = `_${i}`;
    const candidate = `${base.slice(0, Math.max(2, 80 - suffix.length))}${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }

  return `${base.slice(0, 70)}_${Date.now().toString(36)}`;
}

function sortQuestions(questions: JobBotQuestion[]): JobBotQuestion[] {
  return [...questions].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function answerTypeBadgeClass(type: JobBotAnswerType): string {
  switch (type) {
    case 'text':
      return 'bg-blue-100 text-blue-700';
    case 'number':
      return 'bg-emerald-100 text-emerald-700';
    case 'yes_no':
      return 'bg-amber-100 text-amber-700';
    case 'file':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

interface JobBotQuestionsModalProps {
  isOpen: boolean;
  jobId: string | null;
  jobTitle: string;
  onClose: () => void;
}

export default function JobBotQuestionsModal({ isOpen, jobId, jobTitle, onClose }: JobBotQuestionsModalProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);

  const [questions, setQuestions] = useState<JobBotQuestion[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode>('idle');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const answerTypeOptions = useMemo(
    () => [
      { value: 'text', label: t('jobs.botQuestions.answerTypes.text') },
      { value: 'number', label: t('jobs.botQuestions.answerTypes.number') },
      { value: 'yes_no', label: t('jobs.botQuestions.answerTypes.yes_no') },
      { value: 'file', label: t('jobs.botQuestions.answerTypes.file') },
    ],
    [t]
  );

  const resetForm = () => {
    setFormMode('idle');
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormError(null);
  };

  const closeModal = () => {
    resetForm();
    setQuestions([]);
    setIncludeInactive(false);
    setLoadError(null);
    setSuccessMessage(null);
    onClose();
  };

  const getErrorMessage = (err: unknown, fallback: string): string | null => {
    const apiErr = err as ApiError;
    if (apiErr?.status === 404) {
      closeModal();
      return null;
    }
    return err && typeof err === 'object' && 'message' in err ? String((err as ApiError).message) : fallback;
  };

  const loadQuestions = useCallback(async () => {
    if (!jobId) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await jobBotQuestionsService.list(jobId, includeInactive);
      setQuestions(sortQuestions(Array.isArray(data) ? data : []));
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr?.status === 404) {
        closeModal();
        return;
      }
      setLoadError(getErrorMessage(err, t('jobs.botQuestions.errors.load')) ?? t('jobs.botQuestions.errors.load'));
    } finally {
      setIsLoading(false);
    }
  }, [jobId, includeInactive, t]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen || !jobId) return;
    resetForm();
    setSuccessMessage(null);
    void loadQuestions();
  }, [isOpen, jobId, includeInactive, loadQuestions]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const openCreateForm = () => {
    setFormMode('create');
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormError(null);
  };

  const openEditForm = (question: JobBotQuestion) => {
    setFormMode('edit');
    setEditingId(question.id);
    setForm({
      questionText: question.questionText,
      answerType: question.answerType,
      sortOrder: String(question.sortOrder),
      isRequired: question.isRequired,
      isActive: question.isActive,
    });
    setFormErrors({});
    setFormError(null);
  };

  const existingQuestionKeys = useMemo(
    () => questions.map((question) => question.questionKey),
    [questions]
  );

  const hasExistingFileQuestion = useMemo(
    () => questions.some((question) => question.answerType === 'file' && question.id !== editingId),
    [questions, editingId]
  );

  const availableAnswerTypeOptions = useMemo(() => {
    if (!hasExistingFileQuestion) return answerTypeOptions;
    return answerTypeOptions.filter((option) => option.value !== 'file');
  }, [answerTypeOptions, hasExistingFileQuestion]);

  const generatedQuestionKey = useMemo(() => {
    if (formMode !== 'create') return '';
    return buildQuestionKey(form.questionText, existingQuestionKeys);
  }, [formMode, form.questionText, existingQuestionKeys]);

  const editingQuestionKey = useMemo(() => {
    if (!editingId) return '';
    return questions.find((question) => question.id === editingId)?.questionKey ?? '';
  }, [editingId, questions]);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormState, string>> = {};

    const text = form.questionText.trim();
    if (!text) {
      errors.questionText = t('jobs.botQuestions.validation.questionTextRequired');
    } else if (text.length < 2 || text.length > 2000) {
      errors.questionText = t('jobs.botQuestions.validation.questionTextLength');
    }

    if (!form.answerType) {
      errors.answerType = t('jobs.botQuestions.validation.answerTypeRequired');
    } else if (form.answerType === 'file' && hasExistingFileQuestion) {
      errors.answerType = t('jobs.botQuestions.validation.fileQuestionLimit');
    }

    if (form.sortOrder.trim() !== '') {
      const parsed = Number(form.sortOrder);
      if (!Number.isInteger(parsed) || parsed < 0) {
        errors.sortOrder = t('jobs.botQuestions.validation.sortOrderInvalid');
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!jobId || formMode === 'idle') return;
    setFormError(null);
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const sortOrder =
        form.sortOrder.trim() === '' ? undefined : Number.parseInt(form.sortOrder.trim(), 10);

      if (formMode === 'create') {
        await jobBotQuestionsService.create(jobId, {
          questionKey: buildQuestionKey(form.questionText, existingQuestionKeys),
          questionText: form.questionText.trim(),
          answerType: form.answerType,
          sortOrder,
          isRequired: form.isRequired,
          isActive: form.isActive,
        });
      } else if (formMode === 'edit' && editingId) {
        await jobBotQuestionsService.update(jobId, editingId, {
          questionText: form.questionText.trim(),
          answerType: form.answerType,
          sortOrder,
          isRequired: form.isRequired,
          isActive: form.isActive,
        });
      }

      setSuccessMessage(t('jobs.botQuestions.toast.saved'));
      resetForm();
      await loadQuestions();
    } catch (err) {
      const message = getErrorMessage(err, t('jobs.botQuestions.errors.save'));
      if (message) setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (question: JobBotQuestion) => {
    if (!jobId) return;
    const ok = window.confirm(t('jobs.botQuestions.confirmDelete'));
    if (!ok) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await jobBotQuestionsService.remove(jobId, question.id);
      setSuccessMessage(t('jobs.botQuestions.toast.deleted'));
      if (editingId === question.id) resetForm();
      await loadQuestions();
    } catch (err) {
      const message = getErrorMessage(err, t('jobs.botQuestions.errors.delete'));
      if (message) setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedQuestions = useMemo(() => sortQuestions(questions), [questions]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={t('jobs.botQuestions.title', { jobTitle })}
      subtitle={t('jobs.botQuestions.subtitle')}
      width="xl"
      titleIcon={
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-primary">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
      }
    >
      <div className="space-y-6">
        {successMessage ? <SuccessMessage message={successMessage} /> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">{t('jobs.botQuestions.showInactive')}</span>
          </label>
          <Button variant="primary" size="sm" onClick={openCreateForm} disabled={!jobId || isSubmitting}>
            {t('jobs.botQuestions.addQuestion')}
          </Button>
        </div>

        {formMode !== 'idle' ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
              {formMode === 'create'
                ? t('jobs.botQuestions.form.createTitle')
                : t('jobs.botQuestions.form.editTitle')}
            </h3>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {formError ? <ErrorMessage message={formError} /> : null}

              <TextareaField
                label={t('jobs.botQuestions.fields.questionText')}
                required
                value={form.questionText}
                onChange={(e) => setForm({ ...form, questionText: e.target.value })}
                error={formErrors.questionText}
                placeholder={t('jobs.botQuestions.placeholders.questionText')}
              />

              {formMode === 'create' ? (
                <p className="-mt-2 text-xs text-gray-500">
                  {t('jobs.botQuestions.fields.questionKeyAuto')}{' '}
                  <code
                    className="rounded bg-gray-200/80 px-1.5 py-0.5 font-mono text-gray-700"
                    title={t('jobs.botQuestions.fields.questionKeyTooltip')}
                  >
                    {generatedQuestionKey}
                  </code>
                </p>
              ) : (
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    {t('jobs.botQuestions.fields.questionKey')}
                    <span
                      className="cursor-help text-gray-400"
                      title={t('jobs.botQuestions.fields.questionKeyTooltip')}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </span>
                  </label>
                  <input
                    value={editingQuestionKey}
                    readOnly
                    disabled
                    className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 font-mono text-sm text-gray-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <SelectField
                  label={t('jobs.botQuestions.fields.answerType')}
                  value={form.answerType}
                  onChange={(e) => setForm({ ...form, answerType: e.target.value as JobBotAnswerType })}
                  options={availableAnswerTypeOptions}
                  error={formErrors.answerType}
                />
                <TextField
                  label={t('jobs.botQuestions.fields.sortOrder')}
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  error={formErrors.sortOrder}
                  placeholder={t('jobs.botQuestions.placeholders.sortOrder')}
                />
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isRequired}
                    onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {t('jobs.botQuestions.fields.isRequired')}
                  </span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">{t('jobs.botQuestions.fields.isActive')}</span>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {formMode === 'edit' && editingId ? (
                  <Button
                    variant="outline"
                    type="button"
                    className="mr-auto border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      const q = questions.find((item) => item.id === editingId);
                      if (q) void handleDelete(q);
                    }}
                    disabled={isSubmitting}
                  >
                    {t('common.actions.delete')}
                  </Button>
                ) : null}
                <Button variant="secondary" type="button" onClick={resetForm} disabled={isSubmitting}>
                  {t('common.actions.cancel')}
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('common.actions.saving') : t('jobs.botQuestions.form.save')}
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        {loadError ? (
          <div className="space-y-3">
            <ErrorMessage message={loadError} />
            <Button variant="outline" size="sm" onClick={() => void loadQuestions()}>
              {t('jobs.botQuestions.retry')}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="divide-y divide-gray-200">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-4">
                  <div className="h-4 w-8 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ) : sortedQuestions.length === 0 ? (
          formMode === 'idle' ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
              <p className="text-sm text-gray-600">{t('jobs.botQuestions.empty')}</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={openCreateForm}>
                {t('jobs.botQuestions.addFirst')}
              </Button>
            </div>
          ) : null
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('jobs.botQuestions.table.order')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('jobs.botQuestions.table.question')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('jobs.botQuestions.table.key')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('jobs.botQuestions.table.type')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('jobs.botQuestions.table.required')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('jobs.botQuestions.table.active')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {t('jobs.botQuestions.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedQuestions.map((question) => (
                  <tr
                    key={question.id}
                    className={!question.isActive ? 'bg-gray-50/80 text-gray-500' : undefined}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{question.sortOrder}</td>
                    <td className="max-w-xs px-4 py-3 text-sm text-dark-text">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="line-clamp-2">{question.questionText}</span>
                        {!question.isActive ? (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {t('jobs.botQuestions.inactiveBadge')}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">
                      {question.questionKey}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${answerTypeBadgeClass(question.answerType)}`}
                      >
                        {t(`jobs.botQuestions.answerTypes.${question.answerType}`)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {question.isRequired
                        ? t('jobs.botQuestions.yes')
                        : t('jobs.botQuestions.no')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                      {question.isActive ? t('jobs.botQuestions.yes') : t('jobs.botQuestions.no')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          className="text-sm font-medium text-primary hover:text-primary/80"
                          onClick={() => openEditForm(question)}
                          disabled={isSubmitting}
                        >
                          {t('common.actions.edit')}
                        </button>
                        <span className="text-gray-300">·</span>
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                          onClick={() => void handleDelete(question)}
                          disabled={isSubmitting}
                        >
                          {t('common.actions.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}

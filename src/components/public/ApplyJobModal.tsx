import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import TextField from '../TextField';
import SelectField from '../SelectField';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import PublicBotQuestionFields from './PublicBotQuestionFields';
import { useApplyJob } from '../../hooks/public/useApplyJob';
import { sortActiveBotQuestions } from '../../lib/publicBotQuestions';
import { getCountryCallingCodeOptions, onlyDigits, toE164Phone } from '../../lib/phone';
import type { JobBotQuestion } from '../../types/jobBotQuestions';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ApplyJobModal({
  isOpen,
  onClose,
  orgSlug,
  jobId,
  jobTitle,
  botQuestions = [],
  alreadyApplied,
  onApplied,
}: {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  jobId: string;
  jobTitle: string;
  botQuestions?: JobBotQuestion[];
  alreadyApplied: boolean;
  onApplied: () => void;
}) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);

  const activeQuestions = useMemo(() => sortActiveBotQuestions(botQuestions), [botQuestions]);

  const { submit, isSubmitting, error, success } = useApplyJob(orgSlug, jobId, activeQuestions);

  const countryOptions = useMemo(() => getCountryCallingCodeOptions(), []);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '506',
    phoneNationalNumber: '',
  });
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>({});
  const [dynamicFiles, setDynamicFiles] = useState<Record<string, File | null>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '506',
      phoneNationalNumber: '',
    });
    setDynamicValues({});
    setDynamicFiles({});
    setFieldErrors({});
    setLocalError(null);
  }, [isOpen, jobId]);

  const validateDynamicFields = (): boolean => {
    const errors: Record<string, string> = {};
    for (const q of activeQuestions) {
      if (!q.isRequired) continue;
      if (q.answerType === 'file') {
        if (!dynamicFiles[q.id]) {
          errors[q.id] = t('publicJobs.apply.validation.requiredField');
        }
      } else if (!String(dynamicValues[q.id] ?? '').trim()) {
        errors[q.id] = t('publicJobs.apply.validation.requiredField');
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const canSubmit = useMemo(() => {
    if (alreadyApplied || isSubmitting) return false;
    if (!form.firstName.trim() || !form.lastName.trim() || !isValidEmail(form.email)) return false;
    for (const q of activeQuestions) {
      if (!q.isRequired) continue;
      if (q.answerType === 'file') {
        if (!dynamicFiles[q.id]) return false;
      } else if (!String(dynamicValues[q.id] ?? '').trim()) {
        return false;
      }
    }
    return true;
  }, [activeQuestions, alreadyApplied, dynamicFiles, dynamicValues, form, isSubmitting]);

  const handleClose = () => {
    setLocalError(null);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setLocalError(t('publicJobs.apply.validation.name'));
      return;
    }
    if (!isValidEmail(form.email)) {
      setLocalError(t('publicJobs.apply.validation.email'));
      return;
    }
    if (!validateDynamicFields()) return;
    if (alreadyApplied) return;

    try {
      const phoneE164 = toE164Phone(form.phoneCountryCode, form.phoneNationalNumber);
      const botAnswers = activeQuestions.map((q) => {
        if (q.answerType === 'file') {
          return { questionId: q.id, value: '', file: dynamicFiles[q.id] ?? null };
        }
        return { questionId: q.id, value: String(dynamicValues[q.id] ?? '').trim(), file: null };
      });

      await submit({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: phoneE164 || null,
        botAnswers,
      });
      onApplied();
      setTimeout(() => handleClose(), 1200);
    } catch {
      // handled by hook error
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('publicJobs.apply.title')}
      subtitle={t('publicJobs.apply.subtitle', { title: jobTitle })}
      width="md"
      footer={
        alreadyApplied ? (
          <Button variant="secondary" onClick={handleClose}>
            {t('common.actions.close')}
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              {t('common.actions.close')}
            </Button>
            <Button variant="primary" onClick={() => formRef.current?.requestSubmit()} disabled={!canSubmit}>
              {isSubmitting ? t('common.actions.saving') : t('publicJobs.apply.submit')}
            </Button>
          </>
        )
      }
    >
      {alreadyApplied ? <SuccessMessage message={t('publicJobs.apply.alreadyApplied')} /> : null}
      {localError ? <ErrorMessage message={localError} /> : null}
      {error ? <ErrorMessage message={error.message || t('publicJobs.apply.error')} /> : null}
      {success && !alreadyApplied ? <SuccessMessage message={t('publicJobs.apply.success')} /> : null}

      {!alreadyApplied ? (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label={t('publicJobs.apply.fields.firstName')}
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <TextField
              label={t('publicJobs.apply.fields.lastName')}
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <TextField
            label={t('publicJobs.apply.fields.email')}
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-2">
              <SelectField
                label={t('publicJobs.apply.fields.phoneCountry')}
                value={form.phoneCountryCode}
                onChange={(e) => setForm({ ...form, phoneCountryCode: e.target.value })}
                options={countryOptions}
              />
            </div>
            <div className="col-span-3">
              <TextField
                label={t('publicJobs.apply.fields.phoneNumber')}
                value={form.phoneNationalNumber}
                onChange={(e) => setForm({ ...form, phoneNationalNumber: onlyDigits(e.target.value) })}
                placeholder={t('publicJobs.apply.placeholders.phoneNumber')}
              />
            </div>
          </div>

          <PublicBotQuestionFields
            questions={activeQuestions}
            values={dynamicValues}
            files={dynamicFiles}
            errors={fieldErrors}
            onValueChange={(questionId, value) => {
              setDynamicValues((prev) => ({ ...prev, [questionId]: value }));
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[questionId];
                return next;
              });
            }}
            onFileChange={(questionId, file) => {
              setDynamicFiles((prev) => ({ ...prev, [questionId]: file }));
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next[questionId];
                return next;
              });
            }}
          />
        </form>
      ) : null}
    </Modal>
  );
}

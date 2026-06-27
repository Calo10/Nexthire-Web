import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import TextField from '../TextField';
import SelectField from '../SelectField';
import ErrorMessage from '../ErrorMessage';
import PublicBotQuestionFields from '../public/PublicBotQuestionFields';
import { createSourcingLead } from '../../api/sourcingApi';
import { buildLeadApplyFormData } from '../../lib/buildLeadApplyFormData';
import { sortActiveBotQuestions } from '../../lib/publicBotQuestions';
import { getCountryCallingCodeOptions, onlyDigits, toE164Phone } from '../../lib/phone';
import { jobBotQuestionsService } from '../../services/jobBotQuestionsService';
import type { Job } from '../../types/dashboard';
import type { JobBotQuestion } from '../../types/jobBotQuestions';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobs: Job[];
  jobsLoading?: boolean;
}

export default function LeadModal({ isOpen, onClose, onSuccess, jobs, jobsLoading = false }: Props) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [jobId, setJobId] = useState('');
  const [botQuestions, setBotQuestions] = useState<JobBotQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

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

  const countryOptions = useMemo(() => getCountryCallingCodeOptions(), []);
  const jobOptions = useMemo(
    () => [
      { value: '', label: t('sourcing.leadForm.selectJob') },
      ...jobs.map((job) => ({ value: String(job.id), label: job.title })),
    ],
    [jobs, t]
  );
  const selectedJob = useMemo(() => jobs.find((j) => String(j.id) === jobId) ?? null, [jobs, jobId]);
  const activeQuestions = useMemo(() => sortActiveBotQuestions(botQuestions), [botQuestions]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setJobId('');
    setBotQuestions([]);
    setQuestionsError(null);
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !jobId) {
      setBotQuestions([]);
      setQuestionsLoading(false);
      setQuestionsError(null);
      setDynamicValues({});
      setDynamicFiles({});
      setFieldErrors({});
      return;
    }

    let cancelled = false;
    setQuestionsLoading(true);
    setQuestionsError(null);
    setDynamicValues({});
    setDynamicFiles({});
    setFieldErrors({});

    jobBotQuestionsService
      .list(jobId)
      .then((list) => {
        if (cancelled) return;
        setBotQuestions(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setBotQuestions([]);
        setQuestionsError(
          err && typeof err === 'object' && 'message' in err
            ? String((err as { message: string }).message)
            : t('sourcing.leadForm.questionsLoadFailed')
        );
      })
      .finally(() => {
        if (!cancelled) setQuestionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, jobId, t]);

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
    if (saving || !jobId) return false;
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
  }, [activeQuestions, dynamicFiles, dynamicValues, form, jobId, saving]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!jobId) {
      setError(t('sourcing.leadForm.jobRequired'));
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError(t('publicJobs.apply.validation.name'));
      return;
    }
    if (!isValidEmail(form.email)) {
      setError(t('publicJobs.apply.validation.email'));
      return;
    }
    if (!validateDynamicFields()) return;

    setSaving(true);
    try {
      const phoneE164 = toE164Phone(form.phoneCountryCode, form.phoneNationalNumber);
      const payload = buildLeadApplyFormData({
        jobId,
        sourceTypeCode: 'manual_entry',
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: phoneE164 || undefined,
        botQuestions: activeQuestions,
        dynamicValues,
        dynamicFiles,
      });
      await createSourcingLead(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : t('sourcing.errors.saveLead')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sourcing.leadForm.title')}
      subtitle={
        selectedJob
          ? t('sourcing.leadForm.subtitleForJob', { title: selectedJob.title })
          : t('sourcing.leadForm.subtitle')
      }
      width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={!canSubmit}
          >
            {saving ? t('common.actions.creating') : t('sourcing.leadForm.submit')}
          </Button>
        </div>
      }
    >
      {error ? <ErrorMessage message={error} className="mb-4" /> : null}
      {questionsError ? <ErrorMessage message={questionsError} className="mb-4" /> : null}

      <form ref={formRef} id="new-lead-form" onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        <SelectField
          label={t('sourcing.leadForm.job')}
          required
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          options={jobOptions}
          disabled={jobsLoading}
        />
        {jobsLoading ? <p className="text-xs text-gray-500">{t('common.loading')}</p> : null}
        {questionsLoading ? <p className="text-xs text-gray-500">{t('sourcing.leadForm.loadingQuestions')}</p> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label={t('sourcing.leadForm.firstName')}
            required
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <TextField
            label={t('sourcing.leadForm.lastName')}
            required
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>

        <TextField
          label={t('sourcing.leadForm.email')}
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

        {jobId && !questionsLoading ? (
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
        ) : null}
      </form>
    </Modal>
  );
}

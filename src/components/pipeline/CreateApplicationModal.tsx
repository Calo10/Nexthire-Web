import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import TextField from '../TextField';
import SelectField from '../SelectField';
import ErrorMessage from '../ErrorMessage';
import PublicBotQuestionFields from '../public/PublicBotQuestionFields';
import type { Candidate } from '../../types/candidates';
import type { Job } from '../../types/dashboard';
import type { JobBotQuestion } from '../../types/jobBotQuestions';
import type { KanbanApplicationCard } from '../../types/applications';
import { candidatesApi } from '../../api/candidatesApi';
import { applicationsApi } from '../../api/applicationsApi';
import { jobBotQuestionsService } from '../../services/jobBotQuestionsService';
import { buildLeadApplyFormData } from '../../lib/buildLeadApplyFormData';
import { sortActiveBotQuestions } from '../../lib/publicBotQuestions';
import { getCountryCallingCodeOptions, onlyDigits, toE164Phone } from '../../lib/phone';
import type { ApiError } from '../../lib/api';

type Mode = 'existing' | 'new';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function candidateLabel(candidate: Candidate) {
  const name = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
  return name || candidate.email;
}

export default function CreateApplicationModal({
  isOpen,
  jobs,
  job,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  jobs: Job[];
  job: Job | null;
  onClose: () => void;
  onCreated: (card: KanbanApplicationCard) => void;
}) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<Mode>('existing');
  const [jobQuery, setJobQuery] = useState('');
  const [jobMenuOpen, setJobMenuOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [candidateQuery, setCandidateQuery] = useState('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [questions, setQuestions] = useState<JobBotQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countryOptions = useMemo(() => getCountryCallingCodeOptions(), []);
  const activeQuestions = useMemo(() => sortActiveBotQuestions(questions), [questions]);
  const selectedJob = useMemo(
    () => jobs.find((item) => String(item.id) === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  const jobMatches = useMemo(() => {
    const query = jobQuery.trim().toLowerCase();
    if (selectedJob && query === selectedJob.title.trim().toLowerCase()) return jobs;
    if (!query) return jobs;
    return jobs.filter((item) => item.title.toLowerCase().includes(query));
  }, [jobQuery, jobs, selectedJob]);

  useEffect(() => {
    if (!isOpen) return;
    const initial = job ? String(job.id) : '';
    setMode('existing');
    setSelectedJobId(initial);
    setJobQuery(job?.title ?? '');
    setJobMenuOpen(false);
    setCandidateQuery('');
    setCandidates([]);
    setQuestions([]);
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
    setError(null);
    setIsLoading(false);
  }, [isOpen, job]);

  useEffect(() => {
    if (!isOpen || !selectedJobId) {
      setQuestions([]);
      return;
    }
    let cancelled = false;
    setQuestionsLoading(true);
    setQuestions([]);
    setDynamicValues({});
    setDynamicFiles({});
    setFieldErrors({});
    jobBotQuestionsService
      .list(selectedJobId)
      .then((items) => {
        if (!cancelled) setQuestions(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setError(t('pipeline.errors.create'));
      })
      .finally(() => {
        if (!cancelled) setQuestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedJobId, t]);

  useEffect(() => {
    if (!isOpen || !selectedJobId || mode !== 'existing') return;
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setCandidatesLoading(true);
      candidatesApi
        .list({ search: candidateQuery.trim() || undefined, page: 1, pageSize: 20 })
        .then((res) => {
          const items = Array.isArray(res) ? res : res.items || [];
          if (!cancelled) setCandidates(items);
        })
        .catch(() => {
          if (!cancelled) setError(t('candidates.errors.loadCandidates'));
        })
        .finally(() => {
          if (!cancelled) setCandidatesLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [isOpen, selectedJobId, mode, candidateQuery, t]);

  const canSubmitNew = useMemo(() => {
    if (isLoading || questionsLoading || !selectedJob) return false;
    if (!form.firstName.trim() || !form.lastName.trim() || !isValidEmail(form.email)) return false;
    for (const question of activeQuestions) {
      if (!question.isRequired) continue;
      if (question.answerType === 'file') {
        if (!dynamicFiles[question.id]) return false;
      } else if (!String(dynamicValues[question.id] ?? '').trim()) {
        return false;
      }
    }
    return true;
  }, [activeQuestions, dynamicFiles, dynamicValues, form, isLoading, questionsLoading, selectedJob]);

  const handleClose = () => {
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const selectJob = (next: Job) => {
    setSelectedJobId(String(next.id));
    setJobQuery(next.title);
    setJobMenuOpen(false);
    setError(null);
  };

  const createForCandidate = async (candidate: Candidate) => {
    if (!selectedJob || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const created = await applicationsApi.create({
        candidateId: candidate.id,
        jobId: selectedJob.id,
      });
      onCreated({
        ...created,
        candidateName: created.candidateName || candidateLabel(candidate),
        candidateEmail: created.candidateEmail || candidate.email,
        jobTitle: created.jobTitle || selectedJob.title,
        jobId: created.jobId || selectedJob.id,
      });
      handleClose();
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 409) setError(err.message || t('pipeline.errors.duplicate'));
      else setError(err?.message || t('pipeline.errors.create'));
    } finally {
      setIsLoading(false);
    }
  };

  const validateDynamicFields = () => {
    const errors: Record<string, string> = {};
    for (const question of activeQuestions) {
      if (!question.isRequired) continue;
      if (question.answerType === 'file') {
        if (!dynamicFiles[question.id]) errors[question.id] = t('publicJobs.apply.validation.requiredField');
      } else if (!String(dynamicValues[question.id] ?? '').trim()) {
        errors[question.id] = t('publicJobs.apply.validation.requiredField');
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitNew = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedJob) return;
    setError(null);
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError(t('publicJobs.apply.validation.name'));
      return;
    }
    if (!isValidEmail(form.email)) {
      setError(t('publicJobs.apply.validation.email'));
      return;
    }
    if (!validateDynamicFields()) return;

    setIsLoading(true);
    try {
      const phoneE164 = toE164Phone(form.phoneCountryCode, form.phoneNationalNumber);
      const body = buildLeadApplyFormData({
        jobId: selectedJob.id,
        sourceTypeCode: 'panel_apply',
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: phoneE164 || undefined,
        botQuestions: activeQuestions,
        dynamicValues,
        dynamicFiles,
      });
      const created = await applicationsApi.createFromApplyForm(body);
      const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      onCreated({
        ...created,
        candidateName: created.candidateName || name,
        candidateEmail: created.candidateEmail || form.email.trim(),
        jobTitle: created.jobTitle || selectedJob.title,
        jobId: created.jobId || selectedJob.id,
      });
      handleClose();
    } catch (e) {
      const err = e as ApiError;
      if (err?.status === 409) setError(t('pipeline.modal.emailExists'));
      else setError(err?.message || t('pipeline.errors.create'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('pipeline.modal.title')}
      subtitle={t('pipeline.modal.subtitle')}
      width="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isLoading}>
            {t('common.actions.cancel')}
          </Button>
          {mode === 'new' ? (
            <Button
              variant="primary"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={!canSubmitNew}
            >
              {isLoading ? t('common.actions.creating') : t('pipeline.modal.create')}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="space-y-6">
        {error ? <ErrorMessage message={error} /> : null}

        <div>
          <TextField
            label={t('pipeline.modal.searchJob')}
            required
            value={jobQuery}
            placeholder={t('pipeline.modal.searchJobPlaceholder')}
            onFocus={() => setJobMenuOpen(true)}
            onChange={(e) => {
              const next = e.target.value;
              setJobQuery(next);
              setJobMenuOpen(true);
              if (selectedJob && next.trim().toLowerCase() !== selectedJob.title.trim().toLowerCase()) {
                setSelectedJobId('');
              }
            }}
          />
          {jobMenuOpen ? (
            <ul className="mt-2 max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white">
              {jobMatches.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-500">{t('pipeline.modal.noJobs')}</li>
              ) : (
                jobMatches.map((item) => (
                  <li key={String(item.id)}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm text-dark-text hover:bg-gray-50"
                      onClick={() => selectJob(item)}
                    >
                      {item.title}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

        {!selectedJob ? (
          <p className="text-sm text-gray-500">{t('pipeline.modal.pickJob')}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-1">
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  mode === 'existing' ? 'bg-white text-dark-text shadow-sm' : 'text-gray-500'
                }`}
                onClick={() => {
                  setMode('existing');
                  setError(null);
                }}
              >
                {t('pipeline.modal.existing')}
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  mode === 'new' ? 'bg-white text-dark-text shadow-sm' : 'text-gray-500'
                }`}
                onClick={() => {
                  setMode('new');
                  setError(null);
                }}
              >
                {t('pipeline.modal.newCandidate')}
              </button>
            </div>

            {mode === 'existing' ? (
              <div>
                <TextField
                  label={t('pipeline.modal.searchCandidate')}
                  value={candidateQuery}
                  placeholder={t('pipeline.modal.searchCandidatePlaceholder')}
                  onChange={(e) => setCandidateQuery(e.target.value)}
                />
                <p className="mt-2 text-sm text-gray-500">{t('pipeline.modal.pickCandidateHint')}</p>
                <ul className="mt-2 max-h-56 overflow-auto rounded-xl border border-gray-200 bg-white">
                    {candidatesLoading ? (
                      <li className="px-3 py-2 text-sm text-gray-500">{t('common.loading')}</li>
                    ) : candidates.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-gray-500">{t('pipeline.modal.noCandidates')}</li>
                    ) : (
                      candidates.map((candidate) => (
                        <li key={candidate.id}>
                          <button
                            type="button"
                            disabled={isLoading}
                            className="w-full px-3 py-2 text-left hover:bg-gray-50 disabled:opacity-60"
                            onClick={() => createForCandidate(candidate)}
                          >
                            <span className="block text-sm font-medium text-dark-text">{candidateLabel(candidate)}</span>
                            <span className="block text-xs text-gray-500">{candidate.email}</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmitNew} className="space-y-6">
                {questionsLoading ? (
                  <p className="text-sm text-gray-500">{t('pipeline.modal.loadingQuestions')}</p>
                ) : null}
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
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import TextField from '../TextField';
import SelectField from '../SelectField';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import { publicJobsApi } from '../../api/publicJobsApi';
import { useApplyJob } from '../../hooks/public/useApplyJob';
import { FALLBACK_PUBLIC_APPLY_SOURCE_TYPES } from '../../lib/publicApplySourceTypes';
import { getCountryCallingCodeOptions, onlyDigits, toE164Phone } from '../../lib/phone';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

function availabilityOptions(t: (k: string) => string) {
  return [
    { value: '', label: t('publicJobs.apply.options.select') },
    { value: 'immediate', label: t('publicJobs.apply.options.availability.immediate') },
    { value: '1_week', label: t('publicJobs.apply.options.availability.oneWeek') },
    { value: '2_weeks', label: t('publicJobs.apply.options.availability.twoWeeks') },
    { value: '1_month', label: t('publicJobs.apply.options.availability.oneMonth') },
  ];
}

function experienceYearsOptions(t: (k: string, opts?: { count: number }) => string) {
  const opts = [{ value: '', label: t('publicJobs.apply.options.select') }];
  for (let i = 0; i <= 20; i += 1) {
    opts.push({ value: String(i), label: t('publicJobs.apply.options.years', { count: i }) });
  }
  opts.push({ value: '20+', label: t('publicJobs.apply.options.yearsPlus', { count: 20 }) });
  return opts;
}

function cefrLevelOptions(t: (k: string) => string) {
  return [
    { value: '', label: t('publicJobs.apply.options.select') },
    ...CEFR_LEVELS.map((level) => ({ value: level, label: level })),
  ];
}

export default function ApplyJobModal({
  isOpen,
  onClose,
  orgSlug,
  jobId,
  jobTitle,
  alreadyApplied,
  onApplied,
}: {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
  jobId: string;
  jobTitle: string;
  alreadyApplied: boolean;
  onApplied: () => void;
}) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);

  const { submit, isSubmitting, error, success } = useApplyJob(orgSlug, jobId);

  const countryOptions = useMemo(() => getCountryCallingCodeOptions(), []);

  const [sourceTypeRows, setSourceTypeRows] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    if (!isOpen || !orgSlug) return;
    let cancelled = false;
    (async () => {
      const fromApi = await publicJobsApi.getSourceTypesForApply(orgSlug);
      if (cancelled) return;
      if (fromApi.length > 0) {
        setSourceTypeRows(fromApi);
        return;
      }
      setSourceTypeRows(
        FALLBACK_PUBLIC_APPLY_SOURCE_TYPES.map((row) => ({
          code: row.code,
          name: t(row.labelKey),
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, orgSlug, t]);

  const sourceOptions = useMemo(() => {
    const opts = sourceTypeRows.map((row) => ({ value: row.code, label: row.name }));
    return [{ value: '', label: t('publicJobs.apply.sources.select') }, ...opts];
  }, [sourceTypeRows, t]);

  const availOptions = useMemo(() => availabilityOptions(t), [t]);
  const experienceOptions = useMemo(() => experienceYearsOptions(t), [t]);
  const languageLevelOptions = useMemo(() => cefrLevelOptions(t), [t]);

  const [form, setForm] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phoneCountryCode: string;
    phoneNationalNumber: string;
    availability: string;
    experienceYears: string;
    englishLevel: string;
    spanishLevel: string;
    source: string;
    resume: File | null;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '506',
    phoneNationalNumber: '',
    availability: '',
    experienceYears: '',
    englishLevel: '',
    spanishLevel: '',
    source: '',
    resume: null,
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (alreadyApplied) return false;
    return (
      !!form.firstName.trim() &&
      !!form.lastName.trim() &&
      isValidEmail(form.email) &&
      !!form.source?.trim() &&
      !isSubmitting
    );
  }, [alreadyApplied, form.email, form.firstName, form.lastName, form.source, isSubmitting]);

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
    if (!form.resume) {
      setLocalError(t('publicJobs.apply.validation.resume'));
      return;
    }
    if (!form.source?.trim()) {
      setLocalError(t('publicJobs.apply.validation.source'));
      return;
    }
    if (alreadyApplied) return;

    try {
      const phoneE164 = toE164Phone(form.phoneCountryCode, form.phoneNationalNumber);
      await submit({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: phoneE164 || null,
        source: form.source?.trim() || null,
        availability: form.availability?.trim() || null,
        experienceYears: form.experienceYears.trim() || null,
        englishLevel: form.englishLevel?.trim() || null,
        spanishLevel: form.spanishLevel?.trim() || null,
        resume: form.resume,
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
          <SelectField
            label={t('publicJobs.apply.fields.availability')}
            value={form.availability ?? ''}
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
            options={availOptions}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SelectField
              label={t('publicJobs.apply.fields.experienceYears')}
              value={form.experienceYears ?? ''}
              onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
              options={experienceOptions}
            />
            <SelectField
              label={t('publicJobs.apply.fields.englishLevel')}
              value={form.englishLevel ?? ''}
              onChange={(e) => setForm({ ...form, englishLevel: e.target.value })}
              options={languageLevelOptions}
            />
            <SelectField
              label={t('publicJobs.apply.fields.spanishLevel')}
              value={form.spanishLevel ?? ''}
              onChange={(e) => setForm({ ...form, spanishLevel: e.target.value })}
              options={languageLevelOptions}
            />
          </div>
          <SelectField
            label={t('publicJobs.apply.fields.source')}
            required
            value={String(form.source || '')}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            options={sourceOptions}
          />
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('publicJobs.apply.fields.resume')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="rounded-lg border border-gray-300 bg-white px-4 py-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setForm({ ...form, resume: e.target.files?.[0] || null })}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {form.resume ? <p className="mt-2 text-xs text-gray-500">{form.resume.name}</p> : null}
            </div>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}

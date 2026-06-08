import { FormEvent, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import TextField from '../TextField';
import SelectField from '../SelectField';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import { candidatesApi } from '../../api/candidatesApi';
import type { Candidate } from '../../types/candidates';
import { candidateSourceSelectOptions } from '../../lib/candidateSources';
import { getCountryCallingCodeOptions, onlyDigits, toE164Phone } from '../../lib/phone';

interface NewCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (candidate: Candidate) => void;
}

interface NewCandidateFormState {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNationalNumber: string;
  source: string;
  resume: File | null;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function NewCandidateModal({ isOpen, onClose, onCreated }: NewCandidateModalProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<NewCandidateFormState>({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '506',
    phoneNationalNumber: '',
    source: '',
    resume: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [resumeFileKey, setResumeFileKey] = useState(0);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!formData.firstName.trim()) next.firstName = t('candidates.validation.firstNameRequired');
    if (!formData.lastName.trim()) next.lastName = t('candidates.validation.lastNameRequired');
    if (!formData.email.trim()) next.email = t('candidates.validation.emailRequired');
    else if (!isValidEmail(formData.email)) next.email = t('candidates.validation.emailInvalid');

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const reset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneCountryCode: '506',
      phoneNationalNumber: '',
      source: '',
      resume: null,
    });
    setResumeFileKey((k) => k + 1);
    setErrors({});
    setSubmitError(null);
    setIsSubmitting(false);
    setShowSuccess(false);
    setCreatedName(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const phoneE164 = toE164Phone(formData.phoneCountryCode, formData.phoneNationalNumber);
      const created = formData.resume
        ? await candidatesApi.createFromApplyForm({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: phoneE164 || '',
            source: formData.source.trim() || '',
            resume: formData.resume,
          })
        : await candidatesApi.create({
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: phoneE164 || undefined,
            source: formData.source.trim() || undefined,
          });
      setCreatedName(`${created.firstName || ''} ${created.lastName || ''}`.trim() || created.email);
      setShowSuccess(true);

      // Reset form fields (keep success state visible)
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneCountryCode: '506',
        phoneNationalNumber: '',
        source: '',
        resume: null,
      });
      setResumeFileKey((k) => k + 1);
      setErrors({});
      setSubmitError(null);

      // Close after confirming success (match Jobs behavior)
      setTimeout(() => {
        setShowSuccess(false);
        setCreatedName(null);
        onCreated(created);
        onClose();
      }, 1500);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err ? String((err as any).message) : t('candidates.errors.createCandidate');
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sourceOptions = useMemo(
    () => [{ value: '', label: t('candidates.filters.sourceAll') }, ...candidateSourceSelectOptions(t)],
    [t]
  );

  const countryOptions = getCountryCallingCodeOptions();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('candidates.modal.title')}
      subtitle={t('candidates.modal.subtitle')}
      width="md"
      footer={
        !showSuccess && (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="primary" onClick={() => formRef.current?.requestSubmit()} disabled={isSubmitting}>
              {isSubmitting ? t('common.actions.creating') : t('candidates.modal.create')}
            </Button>
          </>
        )
      }
    >
      {showSuccess ? (
        <div className="py-8">
          <SuccessMessage
            message={
              createdName
                ? t('candidates.modal.createdWithName', { name: createdName })
                : t('candidates.modal.created')
            }
          />
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {submitError && <ErrorMessage message={submitError} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label={t('candidates.fields.firstName')}
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              error={errors.firstName}
            />
            <TextField
              label={t('candidates.fields.lastName')}
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              error={errors.lastName}
            />
          </div>

          <TextField
            label={t('candidates.fields.email')}
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={t('candidates.placeholders.email')}
            error={errors.email}
          />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              <div className="grid grid-cols-5 gap-3">
                <div className="col-span-2">
                  <SelectField
                    label={t('candidates.fields.phoneCountry')}
                    value={formData.phoneCountryCode}
                    onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                    options={countryOptions}
                  />
                </div>
                <div className="col-span-3">
                  <TextField
                    label={t('candidates.fields.phoneNumber')}
                    value={formData.phoneNationalNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNationalNumber: onlyDigits(e.target.value) })
                    }
                    placeholder={t('candidates.placeholders.phone')}
                  />
                </div>
              </div>
            </div>
            <div className="md:col-span-4">
              <SelectField
                label={t('candidates.fields.source')}
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                options={sourceOptions}
              />
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('candidates.fields.resume')}</label>
            <p className="text-xs text-gray-500 mb-2">{t('candidates.modal.resumeUploadHint')}</p>
            <div className="rounded-lg border border-gray-300 bg-white px-4 py-3">
              <input
                key={resumeFileKey}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFormData({ ...formData, resume: e.target.files?.[0] || null })}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              {formData.resume ? <p className="mt-2 text-xs text-gray-500">{formData.resume.name}</p> : null}
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}


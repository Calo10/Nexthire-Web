import { useRef, useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import TextField from './TextField';
import TextareaField from './TextareaField';
import Button from './Button';
import ErrorMessage from './ErrorMessage';
import { jobsApi } from '../lib/api';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  description: string;
  company: string;
  location: string;
  salary: string; // keep as string for input control; convert on submit
}

interface FormErrors {
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  salary?: string;
}

export default function NewJobModal({ isOpen, onClose, onSuccess }: NewJobModalProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    company: '',
    location: '',
    salary: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdJobTitle, setCreatedJobTitle] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('jobs.validation.titleRequired');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('jobs.validation.descriptionRequired');
    }

    if (!formData.company.trim()) {
      newErrors.company = t('jobs.validation.companyRequired');
    }

    if (!formData.location.trim()) {
      newErrors.location = t('jobs.validation.locationRequired');
    }

    if (!formData.salary.trim()) {
      newErrors.salary = t('jobs.validation.salaryRequired');
    } else {
      const salary = Number(formData.salary);
      if (Number.isNaN(salary) || salary < 0) {
        newErrors.salary = t('jobs.validation.salaryInvalid');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setSubmitError(null);
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await jobsApi.createJob({
        title: formData.title.trim(),
        description: formData.description.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        salary: Number(formData.salary),
      });

      setCreatedJobTitle(created.title);
      setShowSuccess(true);

      // Reset form
      setFormData({
        title: '',
        description: '',
        company: '',
        location: '',
        salary: '',
      });
      setErrors({});

      // Close modal after showing success message
      setTimeout(() => {
        setShowSuccess(false);
        setCreatedJobTitle(null);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as any).message)
          : t('jobs.errors.createJob');
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      title: '',
      description: '',
      company: '',
      location: '',
      salary: '',
    });
    setErrors({});
    setSubmitError(null);
    setShowSuccess(false);
    setCreatedJobTitle(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('jobs.modal.title')}
      subtitle={t('jobs.modal.subtitle')}
      width="md"
      footer={
        !showSuccess && (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              {t('common.actions.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('common.actions.creating')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('jobs.modal.create')}
                </span>
              )}
            </Button>
          </>
        )
      }
    >
      {showSuccess ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-dark-text mb-2">{t('jobs.modal.createdTitle')}</h3>
          <p className="text-sm text-gray-600">
            {createdJobTitle
              ? t('jobs.modal.createdWithTitle', { title: createdJobTitle })
              : t('jobs.modal.created')}
          </p>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {submitError && <ErrorMessage message={submitError} />}

          {/* Job Title */}
          <TextField
            label={t('jobs.fields.title')}
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t('jobs.placeholders.title')}
            error={errors.title}
          />

          {/* Company and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label={t('jobs.fields.company')}
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder={t('jobs.placeholders.company')}
              error={errors.company}
            />

            <TextField
              label={t('jobs.fields.location')}
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t('jobs.placeholders.location')}
              error={errors.location}
            />
          </div>

          {/* Salary */}
          <TextField
            label={t('jobs.fields.salary')}
            required
            type="number"
            min="0"
            step="1"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            placeholder={t('jobs.placeholders.salary')}
            error={errors.salary}
          />

          {/* Description */}
          <TextareaField
            label={t('jobs.fields.description')}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('jobs.placeholders.description')}
            error={errors.description}
          />
        </form>
      )}
    </Modal>
  );
}

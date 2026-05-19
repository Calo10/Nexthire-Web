import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import TextField from '../TextField';
import SelectField from '../SelectField';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import { createTask } from '../../api/tasks';
import type { TaskStatus } from '../../types/task';
import { applicationsApi } from '../../api/applicationsApi';
import type { ApplicationListItem } from '../../types/applications';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  applicationId: string;
  dueAt: string;
  status: TaskStatus;
}

interface FormErrors {
  title?: string;
  applicationId?: string;
}

export default function NewTaskModal({ isOpen, onClose, onSuccess }: NewTaskModalProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const appPickerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    applicationId: '',
    dueAt: '',
    status: 'todo',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTaskTitle, setCreatedTaskTitle] = useState<string | null>(null);

  const [appOpen, setAppOpen] = useState(false);
  const [appInput, setAppInput] = useState(''); // what user sees/types (candidate + job)
  const [apps, setApps] = useState<ApplicationListItem[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'todo', label: t('tasks.kanban.todo') },
    { value: 'in_progress', label: t('tasks.kanban.inProgress') },
    { value: 'blocked', label: t('tasks.kanban.blocked') },
    { value: 'done', label: t('tasks.kanban.done') },
  ];

  const appSearch = useMemo(() => (appInput ?? '').trim(), [appInput]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!formData.title.trim()) next.title = t('tasks.validation.titleRequired');
    if (!formData.applicationId.trim()) next.applicationId = t('tasks.validation.applicationRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Load applications list for picker (debounced search).
  useEffect(() => {
    if (!isOpen || showSuccess) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setAppsLoading(true);
      setAppsError(null);
      try {
        const items = await applicationsApi.list({
          search: appSearch || undefined,
          page: 1,
          pageSize: 25,
        });
        if (!cancelled) setApps(items);
      } catch (e) {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as any).message)
            : t('tasks.errors.loadApplications');
        if (!cancelled) {
          setApps([]);
          setAppsError(msg);
        }
      } finally {
        if (!cancelled) setAppsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [isOpen, showSuccess, appSearch]);

  // Close picker on outside click
  useEffect(() => {
    if (!isOpen || !appOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = appPickerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setAppOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen, appOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createTask({
        title: formData.title.trim(),
        applicationId: formData.applicationId.trim(),
        dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
        status: formData.status || 'todo',
      });

      setCreatedTaskTitle(formData.title.trim());
      setShowSuccess(true);

      // Reset form
      setFormData({
        title: '',
        applicationId: '',
        dueAt: '',
        status: 'todo',
      });
      setErrors({});

      // Close modal after showing success message
      setTimeout(() => {
        setShowSuccess(false);
        setCreatedTaskTitle(null);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as any).message)
          : t('tasks.errors.save');
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      applicationId: '',
      dueAt: '',
      status: 'todo',
    });
    setAppInput('');
    setErrors({});
    setSubmitError(null);
    setShowSuccess(false);
    setCreatedTaskTitle(null);
    setAppOpen(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('tasks.modal.newTitle')}
      subtitle={t('tasks.modal.newSubtitle')}
      width="md"
      footer={
        !showSuccess && (
          <>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="primary" onClick={() => formRef.current?.requestSubmit()} disabled={isSubmitting}>
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
                  {t('tasks.modal.create')}
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
          <h3 className="text-xl font-semibold text-dark-text mb-2">{t('tasks.modal.createdTitle')}</h3>
          <p className="text-sm text-gray-600">
            {createdTaskTitle ? t('tasks.modal.createdWithTitle', { title: createdTaskTitle }) : t('tasks.modal.created')}
          </p>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {submitError && <ErrorMessage message={submitError} />}

          <TextField
            label={t('tasks.fields.title')}
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            placeholder={t('tasks.placeholders.title')}
          />

          <div className="w-full" ref={appPickerRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('tasks.fields.applicationId')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  errors.applicationId ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder={t('tasks.placeholders.applicationSearch')}
                value={appInput}
                onChange={(e) => {
                  const next = e.target.value;
                  setAppInput(next);
                  // When typing, clear the selected id until the user picks an option.
                  setFormData((prev) => ({ ...prev, applicationId: '' }));
                  if (errors.applicationId) setErrors((prev) => ({ ...prev, applicationId: undefined }));
                  if (!appOpen) setAppOpen(true);
                }}
                onFocus={() => setAppOpen(true)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {appOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                  <div className="max-h-64 overflow-y-auto py-1">
                    {appsLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-600">{t('common.loading')}</div>
                    ) : appsError ? (
                      <div className="px-4 py-3 text-sm text-red-700">{appsError}</div>
                    ) : apps.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-600">{t('tasks.applications.empty')}</div>
                    ) : (
                      apps.map((app, idx) => {
                        const main = [app.candidateName || null, app.jobTitle || null].filter(Boolean).join(' • ');
                        return (
                          <button
                            key={`${String(app.id || 'app')}-${idx}`}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-50"
                            onClick={() => {
                              const id = String(app.id || '');
                              const display = main || t('tasks.applications.unknown');
                              setFormData((prev) => ({ ...prev, applicationId: id }));
                              setAppInput(display);
                              setErrors((prev) => ({ ...prev, applicationId: undefined }));
                              setAppOpen(false);
                            }}
                          >
                            <div className="text-sm font-medium text-dark-text">{main || t('tasks.applications.unknown')}</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.applicationId && <p className="mt-1 text-sm text-red-600">{errors.applicationId}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label={t('tasks.fields.dueDate')}
              type="date"
              value={formData.dueAt}
              onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
            />
            <SelectField
              label={t('tasks.fields.status')}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              options={statusOptions}
            />
          </div>
        </form>
      )}
    </Modal>
  );
}


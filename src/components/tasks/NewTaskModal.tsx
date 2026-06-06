import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import TextField from '../TextField';
import SelectField from '../SelectField';
import SearchableSelect from '../SearchableSelect';
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
  applicationLabel: string;
  dueAt: string;
  status: TaskStatus;
}

interface FormErrors {
  title?: string;
  applicationId?: string;
}

function applicationLabel(app: ApplicationListItem, fallback: string): string {
  const main = [app.candidateName || null, app.jobTitle || null].filter(Boolean).join(' • ');
  return main || fallback;
}

const FILTER_CONTROL_CLASS = 'h-12 min-h-12 max-h-12 box-border py-2.5 text-sm min-w-0 w-full';

export default function NewTaskModal({ isOpen, onClose, onSuccess }: NewTaskModalProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    applicationId: '',
    applicationLabel: '',
    dueAt: '',
    status: 'todo',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTaskTitle, setCreatedTaskTitle] = useState<string | null>(null);

  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [apps, setApps] = useState<ApplicationListItem[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  const statusOptions = [
    { value: 'todo', label: t('tasks.kanban.todo') },
    { value: 'in_progress', label: t('tasks.kanban.inProgress') },
    { value: 'blocked', label: t('tasks.kanban.blocked') },
    { value: 'done', label: t('tasks.kanban.done') },
  ];

  const unknownAppLabel = t('tasks.applications.unknown');

  const applicationOptions = useMemo(() => {
    const fromApi = apps.map((app) => ({
      value: String(app.id || ''),
      label: applicationLabel(app, unknownAppLabel),
    }));

    if (formData.applicationId && !fromApi.some((o) => o.value === formData.applicationId)) {
      return [
        { value: formData.applicationId, label: formData.applicationLabel || unknownAppLabel },
        ...fromApi,
      ];
    }

    return fromApi;
  }, [apps, formData.applicationId, formData.applicationLabel, unknownAppLabel]);

  useEffect(() => {
    if (!isOpen || showSuccess) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setAppsLoading(true);
      setAppsError(null);
      try {
        const items = await applicationsApi.list({
          search: appSearchQuery || undefined,
          page: 1,
          pageSize: 50,
        });
        if (!cancelled) setApps(items);
      } catch (e) {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
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
  }, [isOpen, showSuccess, appSearchQuery, t]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!formData.title.trim()) next.title = t('tasks.validation.titleRequired');
    if (!formData.applicationId.trim()) next.applicationId = t('tasks.validation.applicationRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

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

      setFormData({
        title: '',
        applicationId: '',
        applicationLabel: '',
        dueAt: '',
        status: 'todo',
      });
      setErrors({});

      setTimeout(() => {
        setShowSuccess(false);
        setCreatedTaskTitle(null);
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
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
      applicationLabel: '',
      dueAt: '',
      status: 'todo',
    });
    setAppSearchQuery('');
    setErrors({});
    setSubmitError(null);
    setShowSuccess(false);
    setCreatedTaskTitle(null);
    onClose();
  };

  const applicationEmptyText = appsError || t('tasks.applications.empty');

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

          <SearchableSelect
            label={t('tasks.fields.applicationId')}
            required
            value={formData.applicationId}
            onChange={(id, option) => {
              setFormData((prev) => ({
                ...prev,
                applicationId: id,
                applicationLabel: option.label,
              }));
              if (errors.applicationId) setErrors((prev) => ({ ...prev, applicationId: undefined }));
            }}
            options={applicationOptions}
            placeholder={t('tasks.placeholders.applicationSelect')}
            searchPlaceholder={t('tasks.placeholders.applicationSearch')}
            loading={appsLoading}
            loadingText={t('common.loading')}
            emptyText={applicationEmptyText}
            error={errors.applicationId}
            onSearchQueryChange={setAppSearchQuery}
          />

          <div className="grid w-full grid-cols-1 sm:grid-cols-[repeat(2,minmax(0,1fr))] gap-6 items-end">
            <TextField
              label={t('tasks.fields.dueDate')}
              type="date"
              value={formData.dueAt}
              onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
              className={FILTER_CONTROL_CLASS}
            />
            <SelectField
              label={t('tasks.fields.status')}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
              options={statusOptions}
              className={FILTER_CONTROL_CLASS}
            />
          </div>
        </form>
      )}
    </Modal>
  );
}

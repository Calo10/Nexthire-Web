import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import TextField from '../TextField';
import TextareaField from '../TextareaField';
import SelectField from '../SelectField';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import { candidatesApi } from '../../api/candidatesApi';
import { dashboardApi } from '../../lib/api';
import { usersApi } from '../../api/usersApi';
import { tasksApi } from '../../api/tasksApi';
import type { Candidate } from '../../types/candidates';
import type { Job } from '../../types/dashboard';
import type { UserOption } from '../../types/users';
import type { Task } from '../../types/tasks';

interface TaskModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialTask?: Task | null;
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  title: string;
  candidateId: string;
  jobId: string;
  dueAt: string;
  assignedToId: string;
  status: string;
  notes: string;
}

interface FormErrors {
  title?: string;
}

export default function TaskModal({ isOpen, mode, initialTask, onClose, onSuccess }: TaskModalProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    candidateId: '',
    jobId: '',
    dueAt: '',
    assignedToId: '',
    status: 'Open',
    notes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // prefill for edit
    if (mode === 'edit' && initialTask) {
      setFormData({
        title: initialTask.title || '',
        candidateId: (initialTask.candidateId as string) || '',
        jobId: initialTask.jobId != null ? String(initialTask.jobId) : '',
        dueAt: initialTask.dueAt ? String(initialTask.dueAt).substring(0, 10) : '',
        assignedToId: initialTask.assignedToId || '',
        status: initialTask.status || 'Open',
        notes: (initialTask.notes as string) || '',
      });
    } else {
      setFormData({
        title: '',
        candidateId: '',
        jobId: '',
        dueAt: '',
        assignedToId: '',
        status: 'Open',
        notes: '',
      });
    }

    setErrors({});
    setSubmitError(null);
    setShowSuccess(false);
    setIsSubmitting(false);
  }, [isOpen, mode, initialTask]);

  useEffect(() => {
    if (!isOpen) return;
    // Load dropdown data best-effort
    (async () => {
      try {
        const candRes = await candidatesApi.list({ page: 1, pageSize: 50 });
        const items = Array.isArray((candRes as any)?.items) ? (candRes as any).items : Array.isArray(candRes) ? candRes : [];
        setCandidates(items);
      } catch {
        setCandidates([]);
      }
      try {
        const jobRes = await dashboardApi.getJobs();
        setJobs(jobRes || []);
      } catch {
        setJobs([]);
      }
      try {
        const usersRes = await usersApi.list();
        setUsers(usersRes || []);
      } catch {
        setUsers([]);
      }
    })();
  }, [isOpen]);

  const candidateOptions = useMemo(
    () => [
      { value: '', label: t('tasks.fields.none') },
      ...candidates.map((c) => ({
        value: c.id,
        label: `${c.firstName} ${c.lastName}`.trim() || c.email,
      })),
    ],
    [candidates, t]
  );

  const jobOptions = useMemo(
    () => [
      { value: '', label: t('tasks.fields.none') },
      ...jobs.map((j) => ({ value: String(j.id), label: j.title || String(j.id) })),
    ],
    [jobs, t]
  );

  const userOptions = useMemo(
    () => [
      { value: '', label: t('tasks.fields.unassigned') },
      ...users.map((u) => ({ value: u.id, label: u.displayName })),
    ],
    [users, t]
  );

  const statusOptions = useMemo(
    () => [
      { value: 'Open', label: t('tasks.status.open') },
      { value: 'In Progress', label: t('tasks.status.inProgress') },
      { value: 'Done', label: t('tasks.status.done') },
      { value: 'Overdue', label: t('tasks.status.overdue') },
    ],
    [t]
  );

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!formData.title.trim()) next.title = t('tasks.validation.titleRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await tasksApi.create({
          title: formData.title.trim(),
          candidateId: formData.candidateId || null,
          jobId: formData.jobId ? formData.jobId : null,
          dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
          assignedToId: formData.assignedToId || null,
          status: formData.status || 'Open',
          notes: formData.notes.trim() || null,
        });
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onSuccess?.();
          onClose();
        }, 1200);
      } else {
        if (!initialTask?.id) return;
        await tasksApi.update(initialTask.id, {
          title: formData.title.trim(),
          candidateId: formData.candidateId || null,
          jobId: formData.jobId ? formData.jobId : null,
          dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
          assignedToId: formData.assignedToId || null,
          status: formData.status || 'Open',
          notes: formData.notes.trim() || null,
        });
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          onSuccess?.();
          onClose();
        }, 1200);
      }
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err ? String((err as any).message) : t('tasks.errors.save');
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? t('tasks.modal.newTitle') : t('tasks.modal.editTitle')}
      subtitle={mode === 'create' ? t('tasks.modal.newSubtitle') : t('tasks.modal.editSubtitle')}
      width="md"
      footer={
        !showSuccess && (
          <>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="primary" onClick={() => formRef.current?.requestSubmit()} disabled={isSubmitting}>
              {isSubmitting ? t('common.actions.saving') : t('common.actions.saveChanges')}
            </Button>
          </>
        )
      }
    >
      {showSuccess ? (
        <div className="py-8">
          <SuccessMessage message={t('tasks.modal.saved')} />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SelectField
              label={t('tasks.fields.candidate')}
              value={formData.candidateId}
              onChange={(e) => setFormData({ ...formData, candidateId: e.target.value })}
              options={candidateOptions}
            />
            <SelectField
              label={t('tasks.fields.job')}
              value={formData.jobId}
              onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
              options={jobOptions}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextField
              label={t('tasks.fields.dueDate')}
              type="date"
              value={formData.dueAt}
              onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
            />
            <SelectField
              label={t('tasks.fields.assignTo')}
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              options={userOptions}
            />
          </div>

          <SelectField
            label={t('tasks.fields.status')}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={statusOptions}
          />

          <TextareaField
            label={t('tasks.fields.notes')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={t('tasks.placeholders.notes')}
          />
        </form>
      )}
    </Modal>
  );
}


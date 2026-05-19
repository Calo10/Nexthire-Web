import { useMemo, useRef, useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import SelectField from '../SelectField';
import TextField from '../TextField';
import ErrorMessage from '../ErrorMessage';
import type { Task, TaskStatus } from '../../types/task';

interface TaskDetailsModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export default function TaskDetailsModal({ isOpen, task, onClose, onUpdateStatus, onDelete }: TaskDetailsModalProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueAt, setDueAt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state when opening
  useMemo(() => {
    if (!isOpen || !task) return;
    setStatus(task.status);
    setDueAt(task.dueAt ? String(task.dueAt).substring(0, 10) : '');
    setError(null);
  }, [isOpen, task]);

  const statusOptions = [
    { value: 'todo', label: t('tasks.kanban.todo') },
    { value: 'in_progress', label: t('tasks.kanban.inProgress') },
    { value: 'blocked', label: t('tasks.kanban.blocked') },
    { value: 'done', label: t('tasks.kanban.done') },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (status !== task.status) {
        await onUpdateStatus(task.id, status);
      }
      onClose();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as any).message) : t('tasks.errors.save');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    const ok = window.confirm(t('tasks.details.confirmDelete'));
    if (!ok) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onDelete(task.id);
      onClose();
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String((err as any).message) : t('tasks.errors.delete');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('tasks.details.title')}
      subtitle={task ? task.title : undefined}
      width="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleDelete} disabled={!task || isSubmitting}>
            {t('common.actions.delete')}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t('common.actions.close')}
          </Button>
          <Button variant="primary" onClick={() => formRef.current?.requestSubmit()} disabled={!task || isSubmitting}>
            {isSubmitting ? t('common.actions.saving') : t('common.actions.saveChanges')}
          </Button>
        </>
      }
    >
      {!task ? (
        <div className="text-sm text-gray-600">{t('tasks.details.noSelection')}</div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {error && <ErrorMessage message={error} />}

          <TextField
            label={t('tasks.details.applicationId')}
            value={
              [task.candidateName || null, task.jobTitle || null].filter(Boolean).join(' - ') ||
              task.applicationId
            }
            readOnly
          />

          <SelectField
            label={t('tasks.details.status')}
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            options={statusOptions}
          />

          {/* API does not expose update dueAt in this iteration; show picker UI but disable save for it */}
          <TextField
            label={t('tasks.details.dueDate')}
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            disabled
          />
        </form>
      )}
    </Modal>
  );
}


import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/Button';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
import { offboardingsApi } from '../../api/offboardingsApi';
import type { OffboardingLookups } from '../../hooks/useOffboardingLookups';
import {
  OFFBOARDING_TASK_CATEGORIES,
  type OffboardingDetail,
  type OffboardingTask,
} from '../../models/offboarding';
import { apiErrorMessage, daysUntil, formatDate } from '../../utils/employeeFormat';
import { taskStatusTone } from '../../utils/offboardingFormat';
import ReasonModal from '../onboarding/ReasonModal';

type Props = {
  detail: OffboardingDetail;
  lookups: OffboardingLookups;
  locale: string;
  canManageTasks: boolean;
  canApprove: boolean;
  /** Called after any mutation so the parent can reload the detail + board. */
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
};

export default function OffboardingChecklistPanel({
  detail,
  lookups,
  locale,
  canManageTasks,
  canApprove,
  onChanged,
  onError,
}: Props) {
  const { t } = useTranslation();
  const [busyTask, setBusyTask] = useState<string | null>(null);
  const [rejectTask, setRejectTask] = useState<OffboardingTask | null>(null);
  const [removeTask, setRemoveTask] = useState<OffboardingTask | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Other');
  const [newDue, setNewDue] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [saving, setSaving] = useState(false);

  const isOpen = detail.status !== 'Completed' && detail.status !== 'Cancelled';
  const editable = canManageTasks && isOpen;

  const tasks = useMemo(
    () => [...detail.tasks].sort((a, b) => a.displayOrder - b.displayOrder),
    [detail.tasks],
  );
  const titleById = useMemo(() => new Map(tasks.map((x) => [x.id, x.title])), [tasks]);

  const run = async (task: OffboardingTask, fn: () => Promise<unknown>, fallback: string) => {
    setBusyTask(task.id);
    try {
      await fn();
      await onChanged();
    } catch (err) {
      onError(apiErrorMessage(err, fallback));
    } finally {
      setBusyTask(null);
    }
  };

  const toggle = (task: OffboardingTask) =>
    run(
      task,
      () =>
        task.status === 'Completed'
          ? offboardingsApi.reopenTask(detail.id, task.id)
          : offboardingsApi.completeTask(detail.id, task.id),
      t('coreHr.offboarding.checklist.updateError'),
    );

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await offboardingsApi.addTask(detail.id, {
        title: newTitle.trim(),
        category: newCategory,
        assignmentType: newAssignee ? 'SpecificUser' : 'HR',
        assignedUserId: newAssignee || null,
        dueDate: newDue || null,
        isRequired: true,
      });
      setNewTitle('');
      setNewDue('');
      setNewAssignee('');
      setNewCategory('Other');
      setAdding(false);
      await onChanged();
    } catch (err) {
      onError(apiErrorMessage(err, t('coreHr.offboarding.checklist.addError')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {detail.completionBlockers.length > 0 && isOpen ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">{t('coreHr.offboarding.checklist.blockers')}</p>
          <ul className="mt-1 list-inside list-disc text-xs">
            {detail.completionBlockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
          {t('coreHr.offboarding.checklist.empty')}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
          {tasks.map((task) => {
            const done = task.status === 'Completed';
            const cancelled = task.status === 'Cancelled';
            const days = daysUntil(task.dueDate);
            const overdue = task.isOverdue || (!done && !cancelled && days != null && days < 0);
            const pendingApproval = task.requiresApproval && done && task.approvalStatus === 'Pending';
            const busy = busyTask === task.id;
            return (
              <li key={task.id} className={`flex items-start gap-3 px-4 py-3 ${cancelled || task.isWaived ? 'opacity-60' : ''}`}>
                <input
                  type="checkbox"
                  checked={done}
                  disabled={!editable || busy || cancelled}
                  onChange={() => void toggle(task)}
                  aria-label={task.title}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${done ? 'text-gray-500 line-through' : 'text-dark-text'}`}>{task.title}</p>
                  {task.description ? <p className="mt-0.5 text-xs text-gray-500">{task.description}</p> : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge tone="gray">{t(`coreHr.offboarding.category.${task.category}`, { defaultValue: task.category })}</Badge>
                    <Badge tone={taskStatusTone(task.status)}>
                      {t(`coreHr.offboarding.taskStatus.${task.status}`, { defaultValue: task.status })}
                    </Badge>
                    {task.isRequired ? null : <Badge tone="gray">{t('coreHr.offboarding.checklist.optional')}</Badge>}
                    {task.isWaived ? <Badge tone="gray">{t('coreHr.offboarding.checklist.waived')}</Badge> : null}
                    {task.requiresDocument ? <Badge tone="blue">{t('coreHr.offboarding.checklist.document')}</Badge> : null}
                    {task.requiresApproval ? (
                      <Badge tone={task.approvalStatus === 'Approved' ? 'green' : task.approvalStatus === 'Rejected' ? 'red' : 'yellow'}>
                        {t(`coreHr.offboarding.approval.${task.approvalStatus || 'Pending'}`, {
                          defaultValue: task.approvalStatus || 'Pending',
                        })}
                      </Badge>
                    ) : null}
                    {task.assignedUserName ? <span className="text-gray-500">{task.assignedUserName}</span> : null}
                    {task.assignmentType && !task.assignedUserName ? (
                      <span className="text-gray-500">
                        {t(`coreHr.offboarding.assignment.${task.assignmentType}`, { defaultValue: task.assignmentType })}
                      </span>
                    ) : null}
                    {task.dueDate ? (
                      <span className={overdue ? 'font-medium text-red-600' : 'text-gray-500'}>
                        {overdue ? `${t('coreHr.offboarding.checklist.overdue')} · ` : ''}
                        {t('coreHr.offboarding.checklist.due', { date: formatDate(task.dueDate, locale) })}
                      </span>
                    ) : null}
                    {task.dependsOnTaskId && titleById.get(task.dependsOnTaskId) ? (
                      <span className="text-gray-400">
                        {t('coreHr.offboarding.checklist.dependsOn', { title: titleById.get(task.dependsOnTaskId) })}
                      </span>
                    ) : null}
                  </div>
                  {pendingApproval && canApprove && isOpen ? (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        className="!px-3 !py-1"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            task,
                            () => offboardingsApi.approveTask(detail.id, task.id),
                            t('coreHr.offboarding.checklist.approveError'),
                          )
                        }
                      >
                        {t('coreHr.offboarding.checklist.approve')}
                      </Button>
                      <Button variant="outline" size="sm" className="!px-3 !py-1" disabled={busy} onClick={() => setRejectTask(task)}>
                        {t('coreHr.offboarding.checklist.reject')}
                      </Button>
                    </div>
                  ) : null}
                </div>
                {editable && !done && !cancelled ? (
                  <button
                    type="button"
                    onClick={() => setRemoveTask(task)}
                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                    aria-label={t('coreHr.offboarding.checklist.remove')}
                    title={t('coreHr.offboarding.checklist.remove')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {editable ? (
        adding ? (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <TextField
              label={t('coreHr.offboarding.checklist.taskTitle')}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              maxLength={200}
              required
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SelectField
                label={t('coreHr.offboarding.checklist.category')}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                options={OFFBOARDING_TASK_CATEGORIES.map((c) => ({ value: c, label: t(`coreHr.offboarding.category.${c}`) }))}
              />
              <SelectField
                label={t('coreHr.offboarding.checklist.assignee')}
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                options={[
                  { value: '', label: t('coreHr.offboarding.checklist.unassigned') },
                  ...lookups.owners.map((o) => ({ value: o.id, label: o.name })),
                ]}
              />
              <TextField
                type="date"
                label={t('coreHr.offboarding.checklist.dueDate')}
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" disabled={saving} onClick={() => setAdding(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button size="sm" disabled={saving || !newTitle.trim()} onClick={() => void addTask()}>
                {saving ? t('common.loading') : t('coreHr.offboarding.checklist.addTask')}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="text-sm font-medium text-teal-700 hover:text-teal-900"
          >
            + {t('coreHr.offboarding.checklist.addTask')}
          </button>
        )
      ) : null}

      <ReasonModal
        isOpen={!!rejectTask}
        title={t('coreHr.offboarding.checklist.rejectTitle')}
        description={rejectTask?.title}
        label={t('coreHr.offboarding.checklist.rejectReason')}
        confirmLabel={t('coreHr.offboarding.checklist.reject')}
        busy={!!rejectTask && busyTask === rejectTask.id}
        onClose={() => setRejectTask(null)}
        onConfirm={(reason) => {
          const task = rejectTask;
          if (!task) return;
          void run(task, () => offboardingsApi.rejectTask(detail.id, task.id, reason), t('coreHr.offboarding.checklist.rejectError')).then(
            () => setRejectTask(null),
          );
        }}
      />

      <ConfirmModal
        isOpen={!!removeTask}
        onClose={() => setRemoveTask(null)}
        onConfirm={() => {
          const task = removeTask;
          if (!task) return;
          void run(task, () => offboardingsApi.cancelTask(detail.id, task.id), t('coreHr.offboarding.checklist.removeError')).then(
            () => setRemoveTask(null),
          );
        }}
        tone="danger"
        busy={!!removeTask && busyTask === removeTask.id}
        title={t('coreHr.offboarding.checklist.removeTitle')}
        description={t('coreHr.offboarding.checklist.removeDescription', { title: removeTask?.title ?? '' })}
        confirmLabel={t('coreHr.offboarding.checklist.remove')}
      />
    </div>
  );
}

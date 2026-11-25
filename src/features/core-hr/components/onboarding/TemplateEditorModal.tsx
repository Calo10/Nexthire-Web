import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import TextareaField from '../../../../components/TextareaField';
import { onboardingTemplatesApi } from '../../api/onboardingTemplatesApi';
import type { HrLookupsState } from '../../hooks/useHrLookups';
import type { OnboardingLookups } from '../../hooks/useOnboardingLookups';
import {
  ONBOARDING_ASSIGNMENT_TYPES,
  ONBOARDING_TASK_CATEGORIES,
  type OnboardingTemplateDetail,
} from '../../models/onboarding';
import {
  blankTask,
  fromDetail,
  sanitizeDependencies,
  toRequest,
  type FormState,
  type TaskDraft,
} from '../../models/onboardingTemplateForm';
import { apiErrorMessage } from '../../utils/employeeFormat';

type Props = {
  isOpen: boolean;
  /** Template to edit; `null` creates a new one. */
  template: OnboardingTemplateDetail | null;
  hrLookups: HrLookupsState;
  lookups: OnboardingLookups;
  onClose: () => void;
  onSaved: (template: OnboardingTemplateDetail, mode: 'created' | 'updated') => void;
};

const checkbox = 'h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500';

export default function TemplateEditorModal({ isOpen, template, hrLookups, lookups, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(() => fromDetail(template));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(fromDetail(template));
    setError(null);
    setTouched(false);
    setSaving(false);
  }, [isOpen, template]);

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));
  const patchTask = (key: string, p: Partial<TaskDraft>) =>
    setForm((f) => ({ ...f, tasks: f.tasks.map((task) => (task.key === key ? { ...task, ...p } : task)) }));
  const moveTask = (index: number, delta: -1 | 1) =>
    setForm((f) => {
      const target = index + delta;
      if (target < 0 || target >= f.tasks.length) return f;
      const next = [...f.tasks];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, tasks: sanitizeDependencies(next) };
    });
  const removeTask = (key: string) =>
    setForm((f) => ({ ...f, tasks: sanitizeDependencies(f.tasks.filter((task) => task.key !== key)) }));

  const nameError = touched && !form.name.trim() ? t('coreHr.onboarding.templates.editor.nameRequired') : undefined;
  const durationError =
    form.estimatedDurationDays && (!/^\d+$/.test(form.estimatedDurationDays) || Number(form.estimatedDurationDays) < 1)
      ? t('coreHr.onboarding.templates.editor.durationInvalid')
      : undefined;
  const tasksInvalid = useMemo(
    () => form.tasks.some((task) => !task.title.trim() || (task.dueOffsetDays !== '' && !/^-?\d+$/.test(task.dueOffsetDays))),
    [form.tasks],
  );

  const save = async () => {
    setTouched(true);
    if (!form.name.trim() || durationError || tasksInvalid) return;
    setSaving(true);
    setError(null);
    try {
      const body = toRequest(form);
      const saved = template
        ? await onboardingTemplatesApi.update(template.id, body)
        : await onboardingTemplatesApi.create(body);
      onSaved(saved, template ? 'updated' : 'created');
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.onboarding.templates.editor.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const activeOpts = (list: { id: string; name: string; isActive: boolean }[], selected: string) => [
    { value: '', label: t('coreHr.onboarding.templates.editor.any') },
    ...list.filter((o) => o.isActive || o.id === selected).map((o) => ({ value: o.id, label: o.name })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!saving) onClose();
      }}
      title={template ? t('coreHr.onboarding.templates.editor.editTitle') : t('coreHr.onboarding.templates.editor.createTitle')}
      width="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={saving} onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? t('common.actions.saving') : t('common.actions.saveChanges')}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {error ? <ErrorMessage message={error} /> : null}
        {template ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
            {t('coreHr.onboarding.templates.editor.versionNotice', { version: template.version })}
          </p>
        ) : null}

        <section className="space-y-4">
          <TextField
            label={t('coreHr.onboarding.templates.editor.name')}
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            maxLength={150}
            required
            error={nameError}
          />
          <TextareaField
            label={t('coreHr.onboarding.templates.editor.description')}
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            rows={2}
            maxLength={1000}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label={t('coreHr.onboarding.templates.editor.department')}
              value={form.departmentId}
              onChange={(e) => patch({ departmentId: e.target.value })}
              options={activeOpts(hrLookups.departments, form.departmentId)}
            />
            <SelectField
              label={t('coreHr.onboarding.templates.editor.jobTitle')}
              value={form.jobTitleId}
              onChange={(e) => patch({ jobTitleId: e.target.value })}
              options={activeOpts(hrLookups.jobTitles, form.jobTitleId)}
            />
            <SelectField
              label={t('coreHr.onboarding.templates.editor.employmentType')}
              value={form.employmentTypeId}
              onChange={(e) => patch({ employmentTypeId: e.target.value })}
              options={activeOpts(hrLookups.employmentTypes, form.employmentTypeId)}
            />
            <TextField
              type="number"
              min={1}
              label={t('coreHr.onboarding.templates.editor.duration')}
              value={form.estimatedDurationDays}
              onChange={(e) => patch({ estimatedDurationDays: e.target.value })}
              error={durationError}
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className={checkbox} checked={form.isActive} onChange={(e) => patch({ isActive: e.target.checked })} />
              {t('coreHr.onboarding.templates.editor.active')}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" className={checkbox} checked={form.isDefault} onChange={(e) => patch({ isDefault: e.target.checked })} />
              {t('coreHr.onboarding.templates.editor.default')}
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              {t('coreHr.onboarding.templates.editor.tasks')} ({form.tasks.length})
            </h3>
            <button
              type="button"
              onClick={() => patch({ tasks: [...form.tasks, blankTask()] })}
              className="text-sm font-medium text-teal-700 hover:text-teal-900"
            >
              + {t('coreHr.onboarding.templates.editor.addTask')}
            </button>
          </div>

          {form.tasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
              {t('coreHr.onboarding.templates.editor.noTasks')}
            </p>
          ) : null}

          {form.tasks.map((task, index) => {
            const titleMissing = touched && !task.title.trim();
            const offsetInvalid = task.dueOffsetDays !== '' && !/^-?\d+$/.test(task.dueOffsetDays);
            return (
              <div key={task.key} className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start gap-2">
                  <span className="mt-3 w-6 shrink-0 text-center text-xs font-semibold text-gray-400">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <TextField
                      label={t('coreHr.onboarding.templates.editor.taskTitle')}
                      value={task.title}
                      onChange={(e) => patchTask(task.key, { title: e.target.value })}
                      maxLength={200}
                      required
                      error={titleMissing ? t('coreHr.onboarding.templates.editor.taskTitleRequired') : undefined}
                    />
                  </div>
                  <div className="mt-7 flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveTask(index, -1)}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                      aria-label={t('coreHr.onboarding.templates.editor.moveUp')}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === form.tasks.length - 1}
                      onClick={() => moveTask(index, 1)}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30"
                      aria-label={t('coreHr.onboarding.templates.editor.moveDown')}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTask(task.key)}
                      className="rounded p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600"
                      aria-label={t('coreHr.onboarding.templates.editor.removeTask')}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pl-8 sm:grid-cols-2">
                  <SelectField
                    label={t('coreHr.onboarding.checklist.category')}
                    value={task.category}
                    onChange={(e) => patchTask(task.key, { category: e.target.value })}
                    options={ONBOARDING_TASK_CATEGORIES.map((c) => ({ value: c, label: t(`coreHr.onboarding.category.${c}`) }))}
                  />
                  <SelectField
                    label={t('coreHr.onboarding.templates.editor.assignment')}
                    value={task.assignmentType}
                    onChange={(e) => patchTask(task.key, { assignmentType: e.target.value })}
                    options={ONBOARDING_ASSIGNMENT_TYPES.map((a) => ({ value: a, label: t(`coreHr.onboarding.assignment.${a}`) }))}
                  />
                  {task.assignmentType === 'SpecificUser' ? (
                    <SelectField
                      label={t('coreHr.onboarding.templates.editor.assignee')}
                      value={task.defaultAssigneeUserId}
                      onChange={(e) => patchTask(task.key, { defaultAssigneeUserId: e.target.value })}
                      options={[
                        { value: '', label: t('coreHr.onboarding.checklist.unassigned') },
                        ...lookups.owners.map((o) => ({ value: o.id, label: o.name })),
                      ]}
                    />
                  ) : null}
                  <TextField
                    type="number"
                    label={t('coreHr.onboarding.templates.editor.dueOffset')}
                    value={task.dueOffsetDays}
                    onChange={(e) => patchTask(task.key, { dueOffsetDays: e.target.value })}
                    error={offsetInvalid ? t('coreHr.onboarding.templates.editor.dueOffsetInvalid') : undefined}
                  />
                  <SelectField
                    label={t('coreHr.onboarding.templates.editor.dependsOn')}
                    value={task.dependsOnKey}
                    onChange={(e) => patchTask(task.key, { dependsOnKey: e.target.value })}
                    options={[
                      { value: '', label: t('coreHr.onboarding.templates.editor.noDependency') },
                      ...form.tasks
                        .slice(0, index)
                        .map((x, i) => ({ value: x.key, label: `${i + 1}. ${x.title || t('coreHr.onboarding.templates.editor.untitled')}` })),
                    ]}
                  />
                  {task.requiresDocument ? (
                    <TextField
                      label={t('coreHr.onboarding.templates.editor.documentCategory')}
                      value={task.documentCategory}
                      onChange={(e) => patchTask(task.key, { documentCategory: e.target.value })}
                      maxLength={100}
                    />
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-5 pl-8">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className={checkbox}
                      checked={task.isRequired}
                      onChange={(e) => patchTask(task.key, { isRequired: e.target.checked })}
                    />
                    {t('coreHr.onboarding.templates.editor.required')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className={checkbox}
                      checked={task.requiresDocument}
                      onChange={(e) => patchTask(task.key, { requiresDocument: e.target.checked })}
                    />
                    {t('coreHr.onboarding.templates.editor.requiresDocument')}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className={checkbox}
                      checked={task.requiresApproval}
                      onChange={(e) => patchTask(task.key, { requiresApproval: e.target.checked })}
                    />
                    {t('coreHr.onboarding.templates.editor.requiresApproval')}
                  </label>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </Modal>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import TextareaField from '../../../../components/TextareaField';
import { employeesApi } from '../../api/employeesApi';
import { onboardingsApi } from '../../api/onboardingsApi';
import { onboardingTemplatesApi } from '../../api/onboardingTemplatesApi';
import type { OnboardingLookups } from '../../hooks/useOnboardingLookups';
import type { EmployeeListItem } from '../../models/employee';
import type {
  OnboardingDetail,
  OnboardingTemplateDetail,
  OnboardingTemplateListItem,
} from '../../models/onboarding';
import { apiErrorMessage, employeeName, formatDate } from '../../utils/employeeFormat';
import { addDaysInput, todayInput } from '../../utils/onboardingFormat';
import EmployeeAvatar from '../EmployeeAvatar';

const STEPS = ['employee', 'template', 'configure', 'checklist', 'confirm'] as const;
type Step = (typeof STEPS)[number];

export type WizardEmployee = Pick<EmployeeListItem, 'id' | 'jobTitleId' | 'departmentId'> & {
  name: string;
  jobTitle?: string | null;
  department?: string | null;
  profilePictureUrl?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  lookups: OnboardingLookups;
  /** When set the "select employee" step is skipped. */
  preselectedEmployee?: WizardEmployee | null;
  /** Can the user drop template tasks / add extras (Onboarding.ManageTasks)? */
  canManageTasks: boolean;
  onCreated: (onboarding: OnboardingDetail) => void;
};

function bestTemplate(templates: OnboardingTemplateListItem[], emp: WizardEmployee | null): string {
  const usable = templates.filter((tpl) => tpl.isActive && !tpl.isArchived);
  if (usable.length === 0) return '';
  const byJob = emp?.jobTitleId ? usable.find((tpl) => tpl.jobTitleId && tpl.jobTitleId === emp.jobTitleId) : undefined;
  const byDept = emp?.departmentId
    ? usable.find((tpl) => !tpl.jobTitleId && tpl.departmentId && tpl.departmentId === emp.departmentId)
    : undefined;
  const byDefault = usable.find((tpl) => tpl.isDefault);
  return (byJob ?? byDept ?? byDefault ?? usable[0]).id;
}

function toWizardEmployee(e: EmployeeListItem): WizardEmployee {
  return {
    id: e.id,
    name: employeeName(e),
    jobTitle: e.jobTitle,
    jobTitleId: e.jobTitleId,
    department: e.department,
    departmentId: e.departmentId,
    profilePictureUrl: e.profilePictureUrl,
  };
}

export default function NewOnboardingWizard({
  isOpen,
  onClose,
  lookups,
  preselectedEmployee,
  canManageTasks,
  onCreated,
}: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const steps = useMemo<Step[]>(
    () => (preselectedEmployee ? STEPS.filter((s) => s !== 'employee') : [...STEPS]),
    [preselectedEmployee],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex];

  // Employee step
  const [employee, setEmployee] = useState<WizardEmployee | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [activeEmployeeIds, setActiveEmployeeIds] = useState<Set<string>>(new Set());
  const reqId = useRef(0);

  // Template / configure
  const [templateId, setTemplateId] = useState('');
  const [startDate, setStartDate] = useState(todayInput());
  const [expected, setExpected] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [notes, setNotes] = useState('');
  const [startImmediately, setStartImmediately] = useState(false);

  // Checklist
  const [templateDetail, setTemplateDetail] = useState<OnboardingTemplateDetail | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const usableTemplates = useMemo(
    () => lookups.templates.filter((tpl) => tpl.isActive && !tpl.isArchived),
    [lookups.templates],
  );

  // Reset whenever the wizard opens.
  useEffect(() => {
    if (!isOpen) return;
    setStepIndex(0);
    setEmployee(preselectedEmployee ?? null);
    setSearchInput('');
    setEmployees([]);
    setEmployeesError(null);
    setTemplateId('');
    setStartDate(todayInput());
    setExpected('');
    setOwnerUserId('');
    setNotes('');
    setStartImmediately(false);
    setTemplateDetail(null);
    setTemplateError(null);
    setExcluded(new Set());
    setSubmitError(null);
    setSubmitting(false);
  }, [isOpen, preselectedEmployee]);

  // Employees that already have an active onboarding cannot be selected again.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    onboardingsApi
      .pipeline({})
      .then((p) => {
        if (cancelled) return;
        const ids = new Set<string>();
        for (const col of p.columns) {
          if (col.status === 'Completed') continue;
          for (const card of col.cards) ids.add(card.employeeId);
        }
        setActiveEmployeeIds(ids);
      })
      .catch(() => {
        if (!cancelled) setActiveEmployeeIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Debounced employee search.
  const searchEmployees = useCallback(
    async (query: string) => {
      const id = ++reqId.current;
      setEmployeesLoading(true);
      setEmployeesError(null);
      try {
        const res = await employeesApi.list({ search: query || undefined, pageSize: 25, sort: 'name', dir: 'asc' });
        if (id === reqId.current) setEmployees(res.items);
      } catch (err) {
        if (id === reqId.current) setEmployeesError(apiErrorMessage(err, t('coreHr.onboarding.wizard.employeeLoadError')));
      } finally {
        if (id === reqId.current) setEmployeesLoading(false);
      }
    },
    [t],
  );
  useEffect(() => {
    if (!isOpen || step !== 'employee') return;
    const timer = window.setTimeout(() => void searchEmployees(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [isOpen, step, searchInput, searchEmployees]);

  // Preselect the best matching template when entering the template step.
  useEffect(() => {
    if (!isOpen || step !== 'template' || templateId) return;
    setTemplateId(bestTemplate(lookups.templates, employee));
  }, [isOpen, step, templateId, lookups.templates, employee]);

  // Load the template tasks for the checklist review.
  useEffect(() => {
    if (!isOpen || (step !== 'checklist' && step !== 'confirm') || !templateId) return;
    if (templateDetail?.id === templateId) return;
    let cancelled = false;
    setTemplateLoading(true);
    setTemplateError(null);
    onboardingTemplatesApi
      .get(templateId)
      .then((d) => {
        if (!cancelled) setTemplateDetail(d);
      })
      .catch((err) => {
        if (!cancelled) setTemplateError(apiErrorMessage(err, t('coreHr.onboarding.wizard.templateLoadError')));
      })
      .finally(() => {
        if (!cancelled) setTemplateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, step, templateId, templateDetail?.id, t]);

  const selectedTemplate = usableTemplates.find((tpl) => tpl.id === templateId) ?? null;
  const dateError = startDate && expected && expected < startDate ? t('coreHr.onboarding.form.dateOrderError') : undefined;
  const ownerName = lookups.owners.find((o) => o.id === ownerUserId)?.name;

  const canNext = (() => {
    switch (step) {
      case 'employee':
        return !!employee && !activeEmployeeIds.has(employee.id);
      case 'template':
        return !!templateId;
      case 'configure':
        return !!startDate && !dateError;
      case 'checklist':
        return !templateLoading && !!templateDetail && !templateError;
      default:
        return true;
    }
  })();

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    setExcluded(new Set());
    setTemplateDetail(null);
    // Suggest an expected completion date from the template's estimated duration.
    const tpl = usableTemplates.find((x) => x.id === id);
    if (tpl?.estimatedDurationDays && startDate) setExpected(addDaysInput(startDate, tpl.estimatedDurationDays));
  };

  const submit = async () => {
    if (!employee || !templateId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await onboardingsApi.create({
        employeeId: employee.id,
        templateId,
        ownerUserId: ownerUserId || null,
        startDate: startDate || null,
        expectedCompletionDate: expected || null,
        notes: notes.trim() || null,
        startImmediately,
        excludedTemplateTaskIds: canManageTasks && excluded.size > 0 ? Array.from(excluded) : undefined,
      });
      onCreated(created);
    } catch (err) {
      setSubmitError(apiErrorMessage(err, t('coreHr.onboarding.wizard.createError')));
    } finally {
      setSubmitting(false);
    }
  };

  const includedTasks = (templateDetail?.tasks ?? []).filter((task) => !excluded.has(task.id));
  const blocked = !!employee && activeEmployeeIds.has(employee.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title={t('coreHr.onboarding.wizard.title')}
      subtitle={t('coreHr.onboarding.wizard.stepOf', { current: stepIndex + 1, total: steps.length })}
      width="md"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={submitting} onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          {stepIndex > 0 ? (
            <Button variant="outline" size="sm" disabled={submitting} onClick={() => setStepIndex((i) => i - 1)}>
              {t('coreHr.onboarding.wizard.back')}
            </Button>
          ) : null}
          {step === 'confirm' ? (
            <Button size="sm" disabled={submitting || blocked} onClick={() => void submit()}>
              {submitting ? t('common.actions.creating') : t('coreHr.onboarding.wizard.create')}
            </Button>
          ) : (
            <Button size="sm" disabled={!canNext} onClick={() => setStepIndex((i) => i + 1)}>
              {t('coreHr.onboarding.wizard.next')}
            </Button>
          )}
        </>
      }
    >
      {/* Stepper */}
      <ol className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`rounded-full px-3 py-1 ${
              i === stepIndex
                ? 'bg-teal-600 text-white'
                : i < stepIndex
                  ? 'bg-teal-50 text-teal-800'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {i + 1}. {t(`coreHr.onboarding.wizard.steps.${s}`)}
          </li>
        ))}
      </ol>

      {step === 'employee' ? (
        <div className="space-y-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('coreHr.onboarding.wizard.searchEmployee')}
            aria-label={t('coreHr.onboarding.wizard.searchEmployee')}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {employeesError ? <ErrorMessage message={employeesError} /> : null}
          <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200">
            {employeesLoading && employees.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">{t('common.loading')}</li>
            ) : employees.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">{t('coreHr.onboarding.wizard.noEmployees')}</li>
            ) : (
              employees.map((e) => {
                const hasActive = activeEmployeeIds.has(e.id);
                const selected = employee?.id === e.id;
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      disabled={hasActive}
                      onClick={() => setEmployee(toWizardEmployee(e))}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                        selected ? 'bg-teal-50' : 'hover:bg-gray-50'
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <EmployeeAvatar name={employeeName(e)} seed={e.id} url={e.profilePictureUrl} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-dark-text">{employeeName(e)}</span>
                        <span className="block truncate text-xs text-gray-500">
                          {[e.jobTitle, e.department].filter(Boolean).join(' · ') || e.employeeNumber}
                        </span>
                      </span>
                      {hasActive ? (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                          {t('coreHr.onboarding.wizard.hasActive')}
                        </span>
                      ) : selected ? (
                        <span className="shrink-0 text-teal-700" aria-hidden>
                          ✓
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}

      {step === 'template' ? (
        usableTemplates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            {t('coreHr.onboarding.wizard.noTemplates')}
          </p>
        ) : (
          <ul className="space-y-2">
            {usableTemplates.map((tpl) => (
              <li key={tpl.id}>
                <button
                  type="button"
                  onClick={() => pickTemplate(tpl.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    templateId === tpl.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-dark-text">{tpl.name}</span>
                    {tpl.isDefault ? (
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-800">
                        {t('coreHr.onboarding.templates.default')}
                      </span>
                    ) : null}
                  </div>
                  {tpl.description ? <p className="mt-1 text-xs text-gray-500">{tpl.description}</p> : null}
                  <p className="mt-2 text-xs text-gray-500">
                    {t('coreHr.onboarding.templates.taskCount', { count: tpl.taskCount })}
                    {tpl.estimatedDurationDays
                      ? ` · ${t('coreHr.onboarding.templates.durationDays', { count: tpl.estimatedDurationDays })}`
                      : ''}
                    {tpl.jobTitle ? ` · ${tpl.jobTitle}` : tpl.department ? ` · ${tpl.department}` : ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {step === 'configure' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              type="date"
              label={t('coreHr.onboarding.form.startDate')}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <TextField
              type="date"
              label={t('coreHr.onboarding.form.expectedCompletion')}
              value={expected}
              min={startDate || undefined}
              onChange={(e) => setExpected(e.target.value)}
              error={dateError}
            />
          </div>
          <SelectField
            label={t('coreHr.onboarding.form.owner')}
            value={ownerUserId}
            onChange={(e) => setOwnerUserId(e.target.value)}
            options={[
              { value: '', label: t('coreHr.onboarding.form.noOwner') },
              ...lookups.owners.map((o) => ({ value: o.id, label: o.name })),
            ]}
          />
          <TextareaField
            label={t('coreHr.onboarding.form.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={startImmediately}
              onChange={(e) => setStartImmediately(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            {t('coreHr.onboarding.wizard.startImmediately')}
          </label>
        </div>
      ) : null}

      {step === 'checklist' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {canManageTasks ? t('coreHr.onboarding.wizard.checklistHint') : t('coreHr.onboarding.wizard.checklistReadOnly')}
          </p>
          {templateError ? <ErrorMessage message={templateError} /> : null}
          {templateLoading && !templateDetail ? (
            <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ) : (
            <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200">
              {(templateDetail?.tasks ?? []).map((task) => {
                const off = excluded.has(task.id);
                return (
                  <li key={task.id} className="flex items-start gap-3 px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={!off}
                      disabled={!canManageTasks}
                      onChange={() =>
                        setExcluded((prev) => {
                          const next = new Set(prev);
                          if (next.has(task.id)) next.delete(task.id);
                          else next.add(task.id);
                          return next;
                        })
                      }
                      aria-label={task.title}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <div className={`min-w-0 ${off ? 'opacity-50' : ''}`}>
                      <p className="text-sm font-medium text-dark-text">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        {t(`coreHr.onboarding.category.${task.category}`, { defaultValue: task.category })}
                        {' · '}
                        {t(`coreHr.onboarding.assignment.${task.assignmentType}`, { defaultValue: task.assignmentType })}
                        {task.dueOffsetDays != null
                          ? ` · ${t('coreHr.onboarding.templates.dueOffsetShort', { days: task.dueOffsetDays })}`
                          : ''}
                        {task.isRequired ? '' : ` · ${t('coreHr.onboarding.checklist.optional')}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {step === 'confirm' ? (
        <div className="space-y-4">
          {blocked ? <ErrorMessage message={t('coreHr.onboarding.wizard.hasActiveError')} /> : null}
          {submitError ? <ErrorMessage message={submitError} /> : null}
          <dl className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('coreHr.onboarding.table.employee')}</dt>
              <dd className="mt-1 text-sm text-dark-text">{employee?.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('coreHr.onboarding.form.template')}</dt>
              <dd className="mt-1 text-sm text-dark-text">{selectedTemplate?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('coreHr.onboarding.form.startDate')}</dt>
              <dd className="mt-1 text-sm text-dark-text">{formatDate(startDate, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('coreHr.onboarding.form.expectedCompletion')}
              </dt>
              <dd className="mt-1 text-sm text-dark-text">{formatDate(expected, locale)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('coreHr.onboarding.form.owner')}</dt>
              <dd className="mt-1 text-sm text-dark-text">{ownerName ?? t('coreHr.onboarding.form.noOwner')}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t('coreHr.onboarding.wizard.tasksIncluded')}
              </dt>
              <dd className="mt-1 text-sm text-dark-text">
                {templateLoading ? '…' : includedTasks.length}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-gray-500">
            {startImmediately ? t('coreHr.onboarding.wizard.willStart') : t('coreHr.onboarding.wizard.willBeNotStarted')}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

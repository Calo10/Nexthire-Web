import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import TextareaField from '../../../../components/TextareaField';
import { employeesApi } from '../../api/employeesApi';
import { offboardingsApi } from '../../api/offboardingsApi';
import { offboardingTemplatesApi } from '../../api/offboardingTemplatesApi';
import type { OffboardingLookups } from '../../hooks/useOffboardingLookups';
import type { EmployeeListItem } from '../../models/employee';
import {
  INVOLUNTARY_SEPARATION_TYPES,
  REHIRE_ELIGIBILITIES,
  SEPARATION_TYPES,
  type CreateOffboardingAssetRequest,
  type OffboardingDetail,
  type OffboardingTemplateDetail,
  type OffboardingTemplateListItem,
} from '../../models/offboarding';
import { apiErrorMessage, employeeName, formatDate } from '../../utils/employeeFormat';
import { addDaysInput, todayInput } from '../../utils/offboardingFormat';
import EmployeeAvatar from '../EmployeeAvatar';

const STEPS = ['employee', 'separation', 'template', 'configure', 'confirm'] as const;
type Step = (typeof STEPS)[number];

export type OffboardingWizardEmployee = Pick<EmployeeListItem, 'id' | 'jobTitleId' | 'departmentId'> & {
  name: string;
  jobTitle?: string | null;
  department?: string | null;
  profilePictureUrl?: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  lookups: OffboardingLookups;
  /** When set the "select employee" step is skipped. */
  preselectedEmployee?: OffboardingWizardEmployee | null;
  /** Can the user drop template tasks (Offboarding.ManageTasks)? */
  canManageTasks: boolean;
  /** Can the user list company assets to return (Offboarding.ManageAssets)? */
  canManageAssets: boolean;
  /** Separation reason, rehire eligibility and confidential notes are only collected with ViewConfidentialInformation. */
  canViewConfidential: boolean;
  onCreated: (offboarding: OffboardingDetail) => void;
};

function bestTemplate(
  templates: OffboardingTemplateListItem[],
  emp: OffboardingWizardEmployee | null,
  separationType: string,
): string {
  const usable = templates.filter((tpl) => tpl.isActive && !tpl.isArchived);
  if (usable.length === 0) return '';
  // Prefer templates that target the chosen separation type, then job title / department, then the default.
  const pool = usable.filter((tpl) => tpl.separationType === separationType);
  const scoped = pool.length > 0 ? pool : usable.filter((tpl) => !tpl.separationType);
  const candidates = scoped.length > 0 ? scoped : usable;
  const byJob = emp?.jobTitleId ? candidates.find((tpl) => tpl.jobTitleId && tpl.jobTitleId === emp.jobTitleId) : undefined;
  const byDept = emp?.departmentId
    ? candidates.find((tpl) => !tpl.jobTitleId && tpl.departmentId && tpl.departmentId === emp.departmentId)
    : undefined;
  const byDefault = candidates.find((tpl) => tpl.isDefault);
  return (byJob ?? byDept ?? byDefault ?? candidates[0]).id;
}

function toWizardEmployee(e: EmployeeListItem): OffboardingWizardEmployee {
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

const checkbox = 'h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500';

export default function NewOffboardingWizard({
  isOpen,
  onClose,
  lookups,
  preselectedEmployee,
  canManageTasks,
  canManageAssets,
  canViewConfidential,
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
  const [employee, setEmployee] = useState<OffboardingWizardEmployee | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [activeEmployeeIds, setActiveEmployeeIds] = useState<Set<string>>(new Set());
  const reqId = useRef(0);

  // Separation step
  const [separationType, setSeparationType] = useState('');
  const [noticeDate, setNoticeDate] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [rehire, setRehire] = useState('');
  const [confidentialNotes, setConfidentialNotes] = useState('');

  // Template / configure
  const [templateId, setTemplateId] = useState('');
  const [expected, setExpected] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');
  const [startImmediately, setStartImmediately] = useState(false);
  const [notifyEmployee, setNotifyEmployee] = useState(false);
  const [assets, setAssets] = useState<CreateOffboardingAssetRequest[]>([]);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('');
  const [assetSerial, setAssetSerial] = useState('');

  // Template tasks
  const [templateDetail, setTemplateDetail] = useState<OffboardingTemplateDetail | null>(null);
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
    setSeparationType('');
    setNoticeDate(todayInput());
    setLastWorkingDay('');
    setEffectiveDate('');
    setReason('');
    setRehire('');
    setConfidentialNotes('');
    setTemplateId('');
    setExpected('');
    setOwnerUserId('');
    setStartImmediately(false);
    setNotifyEmployee(false);
    setAssets([]);
    setAssetName('');
    setAssetType('');
    setAssetSerial('');
    setTemplateDetail(null);
    setTemplateError(null);
    setExcluded(new Set());
    setSubmitError(null);
    setSubmitting(false);
  }, [isOpen, preselectedEmployee]);

  // Employees that already have an active offboarding cannot be selected again.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    offboardingsApi
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
        if (id === reqId.current) setEmployeesError(apiErrorMessage(err, t('coreHr.offboarding.wizard.employeeLoadError')));
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
    setTemplateId(bestTemplate(lookups.templates, employee, separationType));
  }, [isOpen, step, templateId, lookups.templates, employee, separationType]);

  // Load the template tasks for the configure/review steps.
  useEffect(() => {
    if (!isOpen || (step !== 'configure' && step !== 'confirm') || !templateId) return;
    if (templateDetail?.id === templateId) return;
    let cancelled = false;
    setTemplateLoading(true);
    setTemplateError(null);
    offboardingTemplatesApi
      .get(templateId)
      .then((d) => {
        if (!cancelled) setTemplateDetail(d);
      })
      .catch((err) => {
        if (!cancelled) setTemplateError(apiErrorMessage(err, t('coreHr.offboarding.wizard.templateLoadError')));
      })
      .finally(() => {
        if (!cancelled) setTemplateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, step, templateId, templateDetail?.id, t]);

  const selectedTemplate = usableTemplates.find((tpl) => tpl.id === templateId) ?? null;
  const ownerName = lookups.owners.find((o) => o.id === ownerUserId)?.name;

  const lastDayError = noticeDate && lastWorkingDay && lastWorkingDay < noticeDate ? t('coreHr.offboarding.form.lastDayBeforeNotice') : undefined;
  const effectiveError =
    lastWorkingDay && effectiveDate && effectiveDate < lastWorkingDay ? t('coreHr.offboarding.form.effectiveBeforeLastDay') : undefined;
  const expectedError = noticeDate && expected && expected < noticeDate ? t('coreHr.offboarding.form.dateOrderError') : undefined;
  const involuntary = INVOLUNTARY_SEPARATION_TYPES.includes(separationType);

  const canNext = (() => {
    switch (step) {
      case 'employee':
        return !!employee && !activeEmployeeIds.has(employee.id);
      case 'separation':
        return !!separationType && !!lastWorkingDay && !lastDayError && !effectiveError;
      case 'template':
        return !!templateId;
      case 'configure':
        return !expectedError && !templateLoading && !!templateDetail && !templateError;
      default:
        return true;
    }
  })();

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    setExcluded(new Set());
    setTemplateDetail(null);
    // Suggest an expected completion date from the template's estimated duration (counted from the last working day).
    const tpl = usableTemplates.find((x) => x.id === id);
    if (tpl?.estimatedDurationDays && lastWorkingDay && !expected) setExpected(addDaysInput(lastWorkingDay, tpl.estimatedDurationDays));
  };

  const submit = async () => {
    if (!employee || !templateId || !separationType || !lastWorkingDay) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await offboardingsApi.create({
        employeeId: employee.id,
        templateId,
        ownerUserId: ownerUserId || null,
        separationType,
        noticeDate: noticeDate || null,
        lastWorkingDay,
        terminationEffectiveDate: effectiveDate || null,
        expectedCompletionDate: expected || null,
        ...(canViewConfidential
          ? {
              separationReason: reason.trim() || null,
              rehireEligibility: rehire || null,
              confidentialNotes: confidentialNotes.trim() || null,
            }
          : {}),
        notifyEmployee: notifyEmployee && !involuntary,
        startImmediately,
        excludedTemplateTaskIds: canManageTasks && excluded.size > 0 ? Array.from(excluded) : undefined,
        assets: canManageAssets && assets.length > 0 ? assets : undefined,
      });
      onCreated(created);
    } catch (err) {
      setSubmitError(apiErrorMessage(err, t('coreHr.offboarding.wizard.createError')));
    } finally {
      setSubmitting(false);
    }
  };

  const dueOffsetLabel = (days: number) =>
    days < 0
      ? t('coreHr.offboarding.templates.dueBefore', { count: Math.abs(days) })
      : days === 0
        ? t('coreHr.offboarding.templates.dueOnLastDay')
        : t('coreHr.offboarding.templates.dueAfter', { count: days });

  const addAssetRow = () => {
    if (!assetName.trim()) return;
    setAssets((list) => [
      ...list,
      {
        assetName: assetName.trim(),
        assetType: assetType.trim() || null,
        serialNumber: assetSerial.trim() || null,
        returnRequired: true,
        expectedReturnDate: lastWorkingDay || null,
      },
    ]);
    setAssetName('');
    setAssetType('');
    setAssetSerial('');
  };

  const includedTasks = (templateDetail?.tasks ?? []).filter((task) => !excluded.has(task.id));
  const blocked = !!employee && activeEmployeeIds.has(employee.id);

  const dt = 'text-xs font-semibold uppercase tracking-wide text-gray-500';
  const dd = 'mt-1 text-sm text-dark-text';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title={t('coreHr.offboarding.wizard.title')}
      subtitle={t('coreHr.offboarding.wizard.stepOf', { current: stepIndex + 1, total: steps.length })}
      width="md"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={submitting} onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          {stepIndex > 0 ? (
            <Button variant="outline" size="sm" disabled={submitting} onClick={() => setStepIndex((i) => i - 1)}>
              {t('coreHr.offboarding.wizard.back')}
            </Button>
          ) : null}
          {step === 'confirm' ? (
            <Button size="sm" disabled={submitting || blocked} onClick={() => void submit()}>
              {submitting ? t('common.actions.creating') : t('coreHr.offboarding.wizard.create')}
            </Button>
          ) : (
            <Button size="sm" disabled={!canNext} onClick={() => setStepIndex((i) => i + 1)}>
              {t('coreHr.offboarding.wizard.next')}
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
            {i + 1}. {t(`coreHr.offboarding.wizard.steps.${s}`)}
          </li>
        ))}
      </ol>

      {step === 'employee' ? (
        <div className="space-y-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('coreHr.offboarding.wizard.searchEmployee')}
            aria-label={t('coreHr.offboarding.wizard.searchEmployee')}
            className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {employeesError ? <ErrorMessage message={employeesError} /> : null}
          <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200">
            {employeesLoading && employees.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">{t('common.loading')}</li>
            ) : employees.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-500">{t('coreHr.offboarding.wizard.noEmployees')}</li>
            ) : (
              employees.map((e) => {
                const hasActive = activeEmployeeIds.has(e.id);
                const separated = e.employmentStatus === 'Terminated' || e.isArchived;
                const unavailable = hasActive || separated;
                const selected = employee?.id === e.id;
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      disabled={unavailable}
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
                          {t('coreHr.offboarding.wizard.hasActive')}
                        </span>
                      ) : separated ? (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {t('coreHr.offboarding.wizard.alreadySeparated')}
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

      {step === 'separation' ? (
        <div className="space-y-4">
          <SelectField
            label={t('coreHr.offboarding.form.separationType')}
            value={separationType}
            onChange={(e) => {
              setSeparationType(e.target.value);
              if (INVOLUNTARY_SEPARATION_TYPES.includes(e.target.value)) setNotifyEmployee(false);
            }}
            required
            options={[
              { value: '', label: t('coreHr.offboarding.form.selectType') },
              ...SEPARATION_TYPES.map((s) => ({ value: s, label: t(`coreHr.offboarding.separationType.${s}`) })),
            ]}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField type="date" label={t('coreHr.offboarding.form.noticeDate')} value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} />
            <TextField
              type="date"
              label={t('coreHr.offboarding.form.lastWorkingDay')}
              value={lastWorkingDay}
              min={noticeDate || undefined}
              onChange={(e) => setLastWorkingDay(e.target.value)}
              error={lastDayError}
              required
            />
            <TextField
              type="date"
              label={t('coreHr.offboarding.form.terminationEffectiveDate')}
              value={effectiveDate}
              min={lastWorkingDay || undefined}
              onChange={(e) => setEffectiveDate(e.target.value)}
              error={effectiveError}
            />
          </div>
          {canViewConfidential ? (
            <div className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{t('coreHr.offboarding.form.confidentialSection')}</p>
              <TextareaField
                label={t('coreHr.offboarding.form.separationReason')}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <SelectField
                label={t('coreHr.offboarding.form.rehireEligibility')}
                value={rehire}
                onChange={(e) => setRehire(e.target.value)}
                options={[
                  { value: '', label: t('coreHr.offboarding.form.notSet') },
                  ...REHIRE_ELIGIBILITIES.map((r) => ({ value: r, label: t(`coreHr.offboarding.rehire.${r}`) })),
                ]}
              />
              <TextareaField
                label={t('coreHr.offboarding.form.confidentialNotes')}
                value={confidentialNotes}
                onChange={(e) => setConfidentialNotes(e.target.value)}
                rows={3}
                maxLength={4000}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 'template' ? (
        usableTemplates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            {t('coreHr.offboarding.wizard.noTemplates')}
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
                        {t('coreHr.offboarding.templates.default')}
                      </span>
                    ) : null}
                  </div>
                  {tpl.description ? <p className="mt-1 text-xs text-gray-500">{tpl.description}</p> : null}
                  <p className="mt-2 text-xs text-gray-500">
                    {t('coreHr.offboarding.templates.taskCount', { count: tpl.taskCount })}
                    {tpl.estimatedDurationDays
                      ? ` · ${t('coreHr.offboarding.templates.durationDays', { count: tpl.estimatedDurationDays })}`
                      : ''}
                    {tpl.separationType
                      ? ` · ${t(`coreHr.offboarding.separationType.${tpl.separationType}`, { defaultValue: tpl.separationType })}`
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
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              type="date"
              label={t('coreHr.offboarding.form.expectedCompletion')}
              value={expected}
              min={noticeDate || undefined}
              onChange={(e) => setExpected(e.target.value)}
              error={expectedError}
            />
            <SelectField
              label={t('coreHr.offboarding.form.owner')}
              value={ownerUserId}
              onChange={(e) => setOwnerUserId(e.target.value)}
              options={[
                { value: '', label: t('coreHr.offboarding.form.noOwner') },
                ...lookups.owners.map((o) => ({ value: o.id, label: o.name })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{t('coreHr.offboarding.wizard.checklist')}</p>
            <p className="text-xs text-gray-500">
              {canManageTasks ? t('coreHr.offboarding.wizard.checklistHint') : t('coreHr.offboarding.wizard.checklistReadOnly')}
            </p>
            {templateError ? <ErrorMessage message={templateError} /> : null}
            {templateLoading && !templateDetail ? (
              <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
            ) : (
              <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200">
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
                        className={`mt-1 ${checkbox}`}
                      />
                      <div className={`min-w-0 ${off ? 'opacity-50' : ''}`}>
                        <p className="text-sm font-medium text-dark-text">{task.title}</p>
                        <p className="text-xs text-gray-500">
                          {t(`coreHr.offboarding.category.${task.category}`, { defaultValue: task.category })}
                          {' · '}
                          {t(`coreHr.offboarding.assignment.${task.assignmentType}`, { defaultValue: task.assignmentType })}
                          {task.dueOffsetDays != null ? ` · ${dueOffsetLabel(task.dueOffsetDays)}` : ''}
                          {task.isRequired ? '' : ` · ${t('coreHr.offboarding.checklist.optional')}`}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {canManageAssets ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{t('coreHr.offboarding.wizard.assets')}</p>
              <p className="text-xs text-gray-500">{t('coreHr.offboarding.wizard.assetsHint')}</p>
              {assets.length > 0 ? (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                  {assets.map((a, i) => (
                    <li key={`${a.assetName}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2">
                      <span className="min-w-0 text-sm text-dark-text">
                        <span className="font-medium">{a.assetName}</span>
                        <span className="text-xs text-gray-500">
                          {[a.assetType, a.serialNumber ? `S/N ${a.serialNumber}` : null].filter(Boolean).map((x) => ` · ${x}`).join('')}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setAssets((list) => list.filter((_, idx) => idx !== i))}
                        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                        aria-label={t('coreHr.offboarding.assetsAccess.assets.remove')}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
                <TextField
                  label={t('coreHr.offboarding.assetsAccess.assets.name')}
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  maxLength={200}
                />
                <TextField
                  label={t('coreHr.offboarding.assetsAccess.assets.type')}
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  maxLength={80}
                />
                <TextField
                  label={t('coreHr.offboarding.assetsAccess.assets.serial')}
                  value={assetSerial}
                  onChange={(e) => setAssetSerial(e.target.value)}
                  maxLength={120}
                />
                <Button variant="outline" size="sm" className="h-12" disabled={!assetName.trim()} onClick={addAssetRow}>
                  {t('coreHr.offboarding.assetsAccess.assets.add')}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={startImmediately} onChange={(e) => setStartImmediately(e.target.checked)} className={checkbox} />
              {t('coreHr.offboarding.wizard.startImmediately')}
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={notifyEmployee && !involuntary}
                disabled={involuntary}
                onChange={(e) => setNotifyEmployee(e.target.checked)}
                className={`mt-0.5 ${checkbox} disabled:opacity-50`}
              />
              <span>
                {t('coreHr.offboarding.form.notifyEmployee')}
                <span className="block text-xs text-gray-500">
                  {involuntary ? t('coreHr.offboarding.wizard.notifyEmployeeInvoluntary') : t('coreHr.offboarding.wizard.notifyEmployeeHint')}
                </span>
              </span>
            </label>
          </div>
        </div>
      ) : null}

      {step === 'confirm' ? (
        <div className="space-y-4">
          {blocked ? <ErrorMessage message={t('coreHr.offboarding.wizard.hasActiveError')} /> : null}
          {submitError ? <ErrorMessage message={submitError} /> : null}
          <dl className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
            <div>
              <dt className={dt}>{t('coreHr.offboarding.table.employee')}</dt>
              <dd className={dd}>{employee?.name}</dd>
            </div>
            <div>
              <dt className={dt}>{t('coreHr.offboarding.form.separationType')}</dt>
              <dd className={dd}>{separationType ? t(`coreHr.offboarding.separationType.${separationType}`) : '—'}</dd>
            </div>
            <div>
              <dt className={dt}>{t('coreHr.offboarding.form.noticeDate')}</dt>
              <dd className={dd}>{formatDate(noticeDate, locale)}</dd>
            </div>
            <div>
              <dt className={dt}>{t('coreHr.offboarding.form.lastWorkingDay')}</dt>
              <dd className={dd}>{formatDate(lastWorkingDay, locale)}</dd>
            </div>
            <div>
              <dt className={dt}>{t('coreHr.offboarding.form.terminationEffectiveDate')}</dt>
              <dd className={dd}>{formatDate(effectiveDate, locale)}</dd>
            </div>
            <div>
              <dt className={dt}>{t('coreHr.offboarding.form.template')}</dt>
              <dd className={dd}>{selectedTemplate?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className={dt}>{t('coreHr.offboarding.form.expectedCompletion')}</dt>
              <dd className={dd}>{formatDate(expected, locale)}</dd>
            </div>
            <div>
              <dt className={dt}>{t('coreHr.offboarding.form.owner')}</dt>
              <dd className={dd}>{ownerName ?? t('coreHr.offboarding.form.noOwner')}</dd>
            </div>
            <div>
              <dt className={dt}>{t('coreHr.offboarding.wizard.tasksIncluded')}</dt>
              <dd className={dd}>{templateLoading ? '…' : includedTasks.length}</dd>
            </div>
            <div>
              <dt className={dt}>{t('coreHr.offboarding.form.notifyEmployee')}</dt>
              <dd className={dd}>{notifyEmployee && !involuntary ? t('coreHr.offboarding.yes') : t('coreHr.offboarding.no')}</dd>
            </div>
            {canManageAssets ? (
              <div>
                <dt className={dt}>{t('coreHr.offboarding.wizard.assets')}</dt>
                <dd className={dd}>{assets.length}</dd>
              </div>
            ) : null}
            {canViewConfidential ? (
              <div>
                <dt className={dt}>{t('coreHr.offboarding.form.rehireEligibility')}</dt>
                <dd className={dd}>{rehire ? t(`coreHr.offboarding.rehire.${rehire}`) : t('coreHr.offboarding.form.notSet')}</dd>
              </div>
            ) : null}
          </dl>
          <p className="text-xs text-gray-500">
            {startImmediately ? t('coreHr.offboarding.wizard.willStart') : t('coreHr.offboarding.wizard.willBeScheduled')}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

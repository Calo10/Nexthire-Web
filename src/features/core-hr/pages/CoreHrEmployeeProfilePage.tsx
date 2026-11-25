import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { employeesApi } from '../api/employeesApi';
import ChangeStatusModal from '../components/ChangeStatusModal';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';
import DetailField from '../components/DetailField';
import EditEmployeeSectionModal, { type EditableSection } from '../components/EditEmployeeSectionModal';
import EmployeeActivityPanel from '../components/EmployeeActivityPanel';
import EmployeeAvatar from '../components/EmployeeAvatar';
import EmployeeCompensationPanel from '../components/EmployeeCompensationPanel';
import EmployeeDocumentsPanel, { DocumentExpiryBadge } from '../components/EmployeeDocumentsPanel';
import EmployeeStatusBadge from '../components/EmployeeStatusBadge';
import EmployeeOffboardingPanel from '../components/offboarding/EmployeeOffboardingPanel';
import EmployeeOnboardingPanel from '../components/onboarding/EmployeeOnboardingPanel';
import HrToast, { type HrToastState } from '../components/HrToast';
import { HR_PERMISSIONS, useHrCapabilities } from '../hooks/useHrCapabilities';
import { useHrLookups } from '../hooks/useHrLookups';
import { OFFBOARDING_PERMISSIONS, useOffboardingCapabilities } from '../hooks/useOffboardingCapabilities';
import { ONBOARDING_PERMISSIONS, useOnboardingCapabilities } from '../hooks/useOnboardingCapabilities';
import type { EmployeeDetail, EmploymentHistoryEntry } from '../models/employee';
import { apiErrorMessage, employeeName, formatDate, formatDateTime } from '../utils/employeeFormat';

type TabKey = 'overview' | 'personal' | 'job' | 'compensation' | 'onboarding' | 'offboarding' | 'documents' | 'activity';
const EDITABLE: EditableSection[] = ['personal', 'contact', 'emergency', 'job'];

function SectionCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">{title}</h3>
        {onEdit ? (
          <button type="button" onClick={onEdit} className="text-sm font-medium text-teal-700 hover:text-teal-900">
            {t('common.actions.edit')}
          </button>
        ) : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function CoreHrEmployeeProfilePage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const caps = useHrCapabilities();
  const lookups = useHrLookups(!caps.denied);
  const onboardingCaps = useOnboardingCapabilities();
  const offboardingCaps = useOffboardingCapabilities();

  const canEdit = caps.can(HR_PERMISSIONS.Edit);
  const canArchive = caps.can(HR_PERMISSIONS.Archive);
  const canManageDocuments = caps.can(HR_PERMISSIONS.ManageDocuments);
  const canViewCompensation = caps.has(HR_PERMISSIONS.ViewCompensation);
  const canManageCompensation = caps.can(HR_PERMISSIONS.ManageCompensation);
  const canSeeSensitive = caps.has(HR_PERMISSIONS.ViewSensitiveData);

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [history, setHistory] = useState<EmploymentHistoryEntry[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [activityKey, setActivityKey] = useState(0);
  const [editSection, setEditSection] = useState<EditableSection | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<HrToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const tabs = useMemo(() => {
    const list: TabKey[] = ['overview', 'personal', 'job'];
    if (canViewCompensation) list.push('compensation');
    const canSeeOnboarding = onboardingCaps.ready && !onboardingCaps.denied && onboardingCaps.has(ONBOARDING_PERMISSIONS.View);
    if (canSeeOnboarding) list.push('onboarding');
    const canSeeOffboarding = offboardingCaps.ready && !offboardingCaps.denied && offboardingCaps.has(OFFBOARDING_PERMISSIONS.View);
    if (canSeeOffboarding) list.push('offboarding');
    list.push('documents', 'activity');
    return list;
  }, [canViewCompensation, onboardingCaps, offboardingCaps]);

  const requestedTab = searchParams.get('tab') as TabKey | null;
  // Don't bounce away from `compensation` until capabilities have loaded.
  const tab: TabKey =
    requestedTab && (tabs.includes(requestedTab) || (requestedTab === 'compensation' && !caps.ready))
      ? requestedTab
      : 'overview';

  const setTab = (next: TabKey) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'overview') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      setEmployee(await employeesApi.get(id));
    } catch (err) {
      const status = (err as { status?: number })?.status;
      setError({
        message: apiErrorMessage(err, t('coreHr.employees.profile.loadError')),
        notFound: status === 404,
      });
    }
  }, [id, t]);

  useEffect(() => {
    setEmployee(null);
    setHistory(null);
    void load();
  }, [load]);

  // Employment history is fetched lazily when the Job tab opens.
  useEffect(() => {
    if (tab !== 'job' || !employee || history !== null) return;
    let cancelled = false;
    employeesApi
      .history(employee.id)
      .then((h) => {
        if (!cancelled) setHistory(h);
      })
      .catch((err) => {
        if (!cancelled) {
          setHistory([]);
          setHistoryError(apiErrorMessage(err, t('coreHr.employees.profile.historyError')));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab, employee, history, t]);

  // `?edit=<section>` (from the directory's Edit action) opens that section's editor once.
  useEffect(() => {
    const requested = searchParams.get('edit') as EditableSection | null;
    if (!requested || !employee || !caps.ready) return;
    const params = new URLSearchParams(searchParams);
    params.delete('edit');
    const shouldEdit = canEdit && !employee.isArchived && EDITABLE.includes(requested);
    if (shouldEdit) {
      const nextTab = requested === 'job' ? 'job' : 'personal';
      params.set('tab', nextTab);
      setEditSection(requested);
    }
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, caps.ready]);

  const applyUpdated = (updated: EmployeeDetail) => {
    setEmployee(updated);
    setHistory(null);
    setActivityKey((k) => k + 1);
  };

  const archive = async () => {
    if (!employee) return;
    setBusy(true);
    try {
      await employeesApi.archive(employee.id);
      setArchiveOpen(false);
      setToast({ tone: 'success', text: t('coreHr.employees.archive.success', { count: 1 }) });
      await load();
      setActivityKey((k) => k + 1);
    } catch (err) {
      setArchiveOpen(false);
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.employees.archive.error')) });
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!employee) return;
    setBusy(true);
    try {
      applyUpdated(await employeesApi.restore(employee.id));
      setToast({ tone: 'success', text: t('coreHr.employees.restore.success', { name: employeeName(employee) }) });
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.employees.restore.error')) });
    } finally {
      setBusy(false);
      setRestoreOpen(false);
    }
  };

  const name = employee ? employeeName(employee) : '';
  const breadcrumbs = [
    { label: t('modules.coreHr'), to: '/app/hr/dashboard' },
    { label: t('coreHr.employees.title'), to: '/app/hr/employees' },
    { label: name || t('common.loading') },
  ];

  if (caps.ready && caps.denied) {
    return (
      <CoreHrPageShell title={t('coreHr.employees.title')} breadcrumbs={breadcrumbs}>
        <CoreHrEmptyState
          title={t('coreHr.employees.forbiddenTitle')}
          description={t('coreHr.employees.forbiddenDescription')}
        />
      </CoreHrPageShell>
    );
  }

  if (error) {
    return (
      <CoreHrPageShell title={t('coreHr.employees.title')} breadcrumbs={breadcrumbs}>
        {error.notFound ? (
          <CoreHrEmptyState
            title={t('coreHr.employees.profile.notFoundTitle')}
            description={t('coreHr.employees.profile.notFoundDescription')}
          />
        ) : (
          <div className="space-y-3">
            <ErrorMessage message={error.message} />
            <Button variant="outline" size="sm" onClick={() => void load()}>
              {t('coreHr.employees.retry')}
            </Button>
          </div>
        )}
        <div className="mt-6">
          <Link to="/app/hr/employees" className="text-sm font-medium text-teal-700 hover:text-teal-900">
            ← {t('coreHr.employees.profile.backToList')}
          </Link>
        </div>
      </CoreHrPageShell>
    );
  }

  if (!employee) {
    return (
      <CoreHrPageShell title={t('common.loading')} breadcrumbs={breadcrumbs}>
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white" />
          <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
        </div>
      </CoreHrPageShell>
    );
  }

  const editable = canEdit && !employee.isArchived;
  const edit = (section: EditableSection) => (editable ? () => setEditSection(section) : undefined);
  const addressText = [employee.addressLine1, employee.addressLine2, employee.city, employee.state, employee.postalCode, employee.country]
    .filter((x) => x && String(x).trim())
    .join(', ');

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      {employee.workEmail ? (
        <a
          href={`mailto:${employee.workEmail}`}
          className="inline-flex items-center rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-dark-text hover:bg-gray-50"
        >
          {t('coreHr.employees.actions.email')}
        </a>
      ) : null}
      {editable ? (
        <Button variant="outline" size="sm" onClick={() => setStatusOpen(true)}>
          {t('coreHr.employees.actions.changeStatus')}
        </Button>
      ) : null}
      {canArchive && !employee.isArchived ? (
        <Button
          size="sm"
          className="!from-red-600 !to-red-600 hover:!from-red-700 hover:!to-red-700"
          onClick={() => setArchiveOpen(true)}
        >
          {t('coreHr.employees.actions.archive')}
        </Button>
      ) : null}
      {canArchive && employee.isArchived ? (
        <Button size="sm" onClick={() => setRestoreOpen(true)}>
          {t('coreHr.employees.actions.restore')}
        </Button>
      ) : null}
    </div>
  );

  return (
    <CoreHrPageShell title={name} breadcrumbs={breadcrumbs} actions={headerActions}>
      <div className="space-y-6">
        {/* Header card */}
        <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          <EmployeeAvatar name={name} seed={employee.id} url={employee.profilePictureUrl} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-dark-text">{employee.jobTitle || t('coreHr.employees.profile.noJobTitle')}</p>
              <EmployeeStatusBadge status={employee.employmentStatus} />
              {employee.isArchived ? <EmployeeStatusBadge archived /> : null}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              <DetailField label={t('coreHr.employees.drawer.employeeNumber')}>{employee.employeeNumber}</DetailField>
              <DetailField label={t('coreHr.employees.drawer.department')}>{employee.department}</DetailField>
              <DetailField label={t('coreHr.employees.drawer.location')}>{employee.location}</DetailField>
              <DetailField label={t('coreHr.employees.drawer.hireDate')}>
                {employee.hireDate ? formatDate(employee.hireDate, locale) : null}
              </DetailField>
            </dl>
          </div>
        </div>

        {employee.isArchived ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t('coreHr.employees.profile.archivedNotice')}
          </div>
        ) : null}

        {/* Tabs */}
        <div className="overflow-x-auto border-b border-gray-200">
          <div className="flex min-w-max gap-1" role="tablist">
            {tabs.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === k
                    ? 'border-teal-600 text-teal-800'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-dark-text'
                }`}
              >
                {t(`coreHr.employees.profile.tabs.${k}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        {tab === 'overview' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <SectionCard title={t('coreHr.employees.profile.sections.employment')}>
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <DetailField label={t('coreHr.employees.drawer.manager')}>
                    {employee.managerId ? (
                      <Link to={`/app/hr/employees/${employee.managerId}`} className="text-teal-700 hover:underline">
                        {employee.managerName}
                      </Link>
                    ) : null}
                  </DetailField>
                  <DetailField label={t('coreHr.employees.drawer.employmentType')}>{employee.employmentType}</DetailField>
                  <DetailField label={t('coreHr.employees.form.workModality')}>
                    {employee.workModality
                      ? t(`coreHr.employees.modality.${employee.workModality}`, { defaultValue: employee.workModality })
                      : null}
                  </DetailField>
                  <DetailField label={t('coreHr.employees.profile.tenure')}>
                    {employee.tenureYears != null
                      ? `${employee.tenureYears.toLocaleString(locale, { maximumFractionDigits: 1 })} ${t('coreHr.employees.kpi.years')}`
                      : null}
                  </DetailField>
                  <DetailField label={t('coreHr.employees.form.workEmail')}>{employee.workEmail}</DetailField>
                  <DetailField label={t('coreHr.employees.form.workPhone')}>{employee.workPhone}</DetailField>
                </dl>
              </SectionCard>
              <SectionCard title={t('coreHr.employees.profile.recentActivity')}>
                <EmployeeActivityPanel employeeId={employee.id} locale={locale} refreshKey={activityKey} limit={5} />
                <button
                  type="button"
                  onClick={() => setTab('activity')}
                  className="mt-4 text-sm font-medium text-teal-700 hover:text-teal-900"
                >
                  {t('coreHr.employees.profile.viewAllActivity')}
                </button>
              </SectionCard>
            </div>
            <div className="space-y-6">
              <SectionCard title={t('coreHr.employees.drawer.upcomingExpirations')}>
                {employee.upcomingDocumentExpirations.length === 0 ? (
                  <p className="text-sm text-gray-500">{t('coreHr.employees.drawer.noExpirations')}</p>
                ) : (
                  <ul className="space-y-3">
                    {employee.upcomingDocumentExpirations.map((d) => (
                      <li key={d.id} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-dark-text">{d.name}</p>
                          <p className="text-xs text-gray-500">
                            {t('coreHr.employees.documents.expiresOn', { date: formatDate(d.expiresAt, locale) })}
                          </p>
                        </div>
                        <DocumentExpiryBadge expiresAt={d.expiresAt} />
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
              <SectionCard title={t('coreHr.employees.profile.record')}>
                <dl className="space-y-4">
                  <DetailField label={t('coreHr.employees.profile.createdAt')}>{formatDateTime(employee.createdAt, locale)}</DetailField>
                  <DetailField label={t('coreHr.employees.profile.updatedAt')}>
                    {employee.updatedAt ? formatDateTime(employee.updatedAt, locale) : null}
                  </DetailField>
                  {employee.candidateId ? (
                    <DetailField label={t('coreHr.employees.profile.source')}>
                      <Link to="/app/candidates" className="text-teal-700 hover:underline">
                        {t('coreHr.employees.profile.fromCandidate')}
                      </Link>
                    </DetailField>
                  ) : null}
                </dl>
              </SectionCard>
            </div>
          </div>
        ) : null}

        {/* Personal */}
        {tab === 'personal' ? (
          <div className="space-y-6">
            {!canSeeSensitive ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {t('coreHr.employees.profile.sensitiveHidden')}
              </div>
            ) : null}
            <SectionCard title={t('coreHr.employees.edit.sections.personal')} onEdit={edit('personal')}>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label={t('coreHr.employees.form.firstName')}>{employee.firstName}</DetailField>
                <DetailField label={t('coreHr.employees.form.middleName')}>{employee.middleName}</DetailField>
                <DetailField label={t('coreHr.employees.form.lastName')}>{employee.lastName}</DetailField>
                <DetailField label={t('coreHr.employees.form.preferredName')}>{employee.preferredName}</DetailField>
                <DetailField label={t('coreHr.employees.form.dateOfBirth')}>
                  {employee.dateOfBirth ? formatDate(employee.dateOfBirth, locale) : null}
                </DetailField>
                <DetailField label={t('coreHr.employees.form.nationality')}>{employee.nationality}</DetailField>
              </dl>
            </SectionCard>
            <SectionCard title={t('coreHr.employees.edit.sections.contact')} onEdit={edit('contact')}>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailField label={t('coreHr.employees.form.personalEmail')}>{employee.personalEmail}</DetailField>
                <DetailField label={t('coreHr.employees.form.personalPhone')}>{employee.personalPhone}</DetailField>
                <div className="sm:col-span-2">
                  <DetailField label={t('coreHr.employees.profile.address')}>{addressText}</DetailField>
                </div>
              </dl>
            </SectionCard>
            <SectionCard title={t('coreHr.employees.edit.sections.emergency')} onEdit={edit('emergency')}>
              {employee.emergencyContacts.length === 0 ? (
                <p className="text-sm text-gray-500">{t('coreHr.employees.form.emergencyEmpty')}</p>
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {employee.emergencyContacts.map((c, i) => (
                    <li key={c.id ?? i} className="rounded-lg border border-gray-200 px-4 py-3 text-sm">
                      <p className="font-medium text-dark-text">
                        {c.fullName}
                        {c.isPrimary ? (
                          <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                            {t('coreHr.employees.form.emergencyPrimary')}
                          </span>
                        ) : null}
                      </p>
                      {c.relationship ? <p className="text-xs text-gray-500">{c.relationship}</p> : null}
                      <p className="mt-1 text-xs text-gray-600">{[c.phone, c.email].filter(Boolean).join(' · ') || '—'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        ) : null}

        {/* Job */}
        {tab === 'job' ? (
          <div className="space-y-6">
            <SectionCard title={t('coreHr.employees.edit.sections.job')} onEdit={edit('job')}>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label={t('coreHr.employees.form.jobTitle')}>{employee.jobTitle}</DetailField>
                <DetailField label={t('coreHr.employees.form.department')}>{employee.department}</DetailField>
                <DetailField label={t('coreHr.employees.form.manager')}>{employee.managerName}</DetailField>
                <DetailField label={t('coreHr.employees.form.employmentType')}>{employee.employmentType}</DetailField>
                <DetailField label={t('coreHr.employees.form.employmentStatus')}>
                  <EmployeeStatusBadge status={employee.employmentStatus} />
                </DetailField>
                <DetailField label={t('coreHr.employees.form.workLocation')}>{employee.location}</DetailField>
                <DetailField label={t('coreHr.employees.form.workModality')}>
                  {employee.workModality
                    ? t(`coreHr.employees.modality.${employee.workModality}`, { defaultValue: employee.workModality })
                    : null}
                </DetailField>
                <DetailField label={t('coreHr.employees.form.employeeNumber')}>{employee.employeeNumber}</DetailField>
                <DetailField label={t('coreHr.employees.form.hireDate')}>
                  {employee.hireDate ? formatDate(employee.hireDate, locale) : null}
                </DetailField>
                <DetailField label={t('coreHr.employees.form.probationEndDate')}>
                  {employee.probationEndDate ? formatDate(employee.probationEndDate, locale) : null}
                </DetailField>
                <DetailField label={t('coreHr.employees.form.contractStartDate')}>
                  {employee.contractStartDate ? formatDate(employee.contractStartDate, locale) : null}
                </DetailField>
                <DetailField label={t('coreHr.employees.form.contractEndDate')}>
                  {employee.contractEndDate ? formatDate(employee.contractEndDate, locale) : null}
                </DetailField>
                {employee.terminationDate || employee.terminationReason ? (
                  <>
                    <DetailField label={t('coreHr.employees.statusModal.terminationDate')}>
                      {employee.terminationDate ? formatDate(employee.terminationDate, locale) : null}
                    </DetailField>
                    <DetailField label={t('coreHr.employees.statusModal.terminationReason')}>
                      {employee.terminationReason}
                    </DetailField>
                  </>
                ) : null}
              </dl>
            </SectionCard>

            <SectionCard title={t('coreHr.employees.profile.history')}>
              {historyError ? <ErrorMessage message={historyError} /> : null}
              {history === null ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
                  ))}
                </div>
              ) : history.length === 0 && !historyError ? (
                <p className="text-sm text-gray-500">{t('coreHr.employees.profile.historyEmpty')}</p>
              ) : (
                <ol className="relative space-y-5 border-l border-gray-200 pl-5">
                  {history.map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal-500 ring-1 ring-teal-200" />
                      <p className="text-sm font-medium text-dark-text">
                        {t(`coreHr.employees.profile.changeTypes.${h.changeType}`, { defaultValue: h.changeType })}
                        <span className="ml-2 text-xs font-normal text-gray-500">{formatDateTime(h.effectiveAt, locale)}</span>
                      </p>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {[h.jobTitle, h.department, h.location, h.employmentType, h.managerName && `${t('coreHr.employees.drawer.manager')}: ${h.managerName}`]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                      {h.notes ? <p className="mt-0.5 text-xs text-gray-500">{h.notes}</p> : null}
                      {h.createdByName ? <p className="text-xs text-gray-400">{h.createdByName}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </SectionCard>
          </div>
        ) : null}

        {tab === 'compensation' && canViewCompensation ? (
          <SectionCard title={t('coreHr.employees.compensation.title')}>
            <EmployeeCompensationPanel
              employeeId={employee.id}
              canManage={canManageCompensation && !employee.isArchived}
              locale={locale}
              onChanged={() => setActivityKey((k) => k + 1)}
            />
          </SectionCard>
        ) : null}

        {tab === 'onboarding' ? (
          <SectionCard title={t('coreHr.onboarding.employeeTab.title')}>
            <EmployeeOnboardingPanel
              employeeId={employee.id}
              employeeNumber={employee.employeeNumber}
              employeeName={name}
              locale={locale}
              canCreate={onboardingCaps.can(ONBOARDING_PERMISSIONS.Create)}
              disabled={employee.isArchived}
              onStarted={() => setActivityKey((k) => k + 1)}
            />
          </SectionCard>
        ) : null}

        {tab === 'offboarding' ? (
          <SectionCard title={t('coreHr.offboarding.employeeTab.title')}>
            <EmployeeOffboardingPanel
              employee={employee}
              caps={offboardingCaps}
              locale={locale}
              disabled={employee.isArchived}
              onStarted={() => {
                setActivityKey((k) => k + 1);
                void employeesApi.get(employee.id).then(setEmployee).catch(() => undefined);
              }}
            />
          </SectionCard>
        ) : null}

        {tab === 'documents' ? (
          <SectionCard title={t('coreHr.employees.documents.title')}>
            <EmployeeDocumentsPanel
              employeeId={employee.id}
              canManage={canManageDocuments && !employee.isArchived}
              locale={locale}
              onChanged={() => {
                setActivityKey((k) => k + 1);
                void employeesApi.get(employee.id).then(setEmployee).catch(() => undefined);
              }}
            />
          </SectionCard>
        ) : null}

        {tab === 'activity' ? (
          <SectionCard title={t('coreHr.employees.profile.tabs.activity')}>
            <EmployeeActivityPanel employeeId={employee.id} locale={locale} refreshKey={activityKey} />
          </SectionCard>
        ) : null}
      </div>

      {editSection ? (
        <EditEmployeeSectionModal
          isOpen
          section={editSection}
          employee={employee}
          lookups={lookups}
          canCreateLookups={caps.can(HR_PERMISSIONS.Create)}
          onClose={() => setEditSection(null)}
          onSaved={(updated) => {
            setEditSection(null);
            applyUpdated(updated);
            setToast({ tone: 'success', text: t('coreHr.employees.edit.success') });
          }}
        />
      ) : null}

      <ChangeStatusModal
        isOpen={statusOpen}
        employee={employee}
        onClose={() => setStatusOpen(false)}
        onChanged={(updated) => {
          setStatusOpen(false);
          applyUpdated(updated);
          setToast({
            tone: 'success',
            text: t('coreHr.employees.statusModal.success', {
              name: employeeName(updated),
              status: t(`coreHr.employees.status.${updated.employmentStatus}`),
            }),
          });
        }}
      />

      <ConfirmModal
        isOpen={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => void archive()}
        tone="danger"
        busy={busy}
        title={t('coreHr.employees.archive.title', { count: 1 })}
        description={t('coreHr.employees.archive.descriptionOne', { name })}
        confirmLabel={t('coreHr.employees.archive.confirm')}
      />

      <ConfirmModal
        isOpen={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        onConfirm={() => void restore()}
        busy={busy}
        title={t('coreHr.employees.restore.title')}
        description={t('coreHr.employees.restore.description', { name })}
        confirmLabel={t('coreHr.employees.actions.restore')}
      />

      <HrToast toast={toast} onDismiss={dismissToast} />

      {/* Back affordance for keyboard users / small screens */}
      <div className="mt-8">
        <button
          type="button"
          onClick={() => navigate('/app/hr/employees')}
          className="text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          ← {t('coreHr.employees.profile.backToList')}
        </button>
      </div>
    </CoreHrPageShell>
  );
}

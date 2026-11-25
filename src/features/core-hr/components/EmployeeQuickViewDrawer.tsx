import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import { useBackdropDismiss } from '../../../hooks/useBackdropDismiss';
import { employeesApi } from '../api/employeesApi';
import type { EmployeeDetail, EmployeeListItem } from '../models/employee';
import { apiErrorMessage, employeeName, formatDate } from '../utils/employeeFormat';
import DetailField from './DetailField';
import EmployeeActivityPanel from './EmployeeActivityPanel';
import EmployeeAvatar from './EmployeeAvatar';
import EmployeeDocumentsPanel, { DocumentExpiryBadge } from './EmployeeDocumentsPanel';
import EmployeeStatusBadge from './EmployeeStatusBadge';

export type DrawerTab = 'overview' | 'information' | 'documents' | 'activity';
const TABS: DrawerTab[] = ['overview', 'information', 'documents', 'activity'];

type Props = {
  employeeId: string | null;
  /** Row data from the list, shown instantly while the detail loads. */
  preview?: EmployeeListItem | null;
  initialTab?: DrawerTab;
  canManageDocuments: boolean;
  /** Bump to reload (e.g. after the parent changed the employee's status). */
  refreshKey?: number;
  onClose: () => void;
};

export default function EmployeeQuickViewDrawer({
  employeeId,
  preview,
  initialTab = 'overview',
  canManageDocuments,
  refreshKey = 0,
  onClose,
}: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const backdropDismiss = useBackdropDismiss(onClose);
  const locale = i18n.language || 'en';
  const [tab, setTab] = useState<DrawerTab>(initialTab);
  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      setDetail(await employeesApi.get(employeeId));
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.employees.drawer.loadError')));
    } finally {
      setLoading(false);
    }
  }, [employeeId, t]);

  useEffect(() => {
    setDetail(null);
    setTab(initialTab);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, initialTab, refreshKey]);

  if (!employeeId) return null;

  const data: (EmployeeListItem & Partial<EmployeeDetail>) | null =
    detail?.id === employeeId ? detail : preview?.id === employeeId ? preview : null;
  const name = data ? employeeName(data) : '';
  const phone = detail?.workPhone;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={name || t('coreHr.employees.drawer.title')}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" {...backdropDismiss} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
          <div className="flex min-w-0 items-center gap-4">
            <EmployeeAvatar name={name || '?'} seed={employeeId} url={data?.profilePictureUrl} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-dark-text">{name || t('common.loading')}</h2>
              <p className="truncate text-sm text-gray-600">{data?.jobTitle || '—'}</p>
              {data ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <EmployeeStatusBadge status={data.employmentStatus} />
                  {data.isArchived ? <EmployeeStatusBadge archived /> : null}
                </div>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label={t('common.aria.closeDrawer')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contact actions */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-6 py-3">
          {data?.workEmail ? (
            <a
              href={`mailto:${data.workEmail}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {t('coreHr.employees.drawer.email')}
            </a>
          ) : null}
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {t('coreHr.employees.drawer.call')}
            </a>
          ) : null}
          {!data?.workEmail && !phone ? (
            <span className="py-1.5 text-sm text-gray-400">{t('coreHr.employees.drawer.noContact')}</span>
          ) : null}
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-6 pt-4">
          <div className="flex rounded-lg bg-gray-100 p-1" role="tablist">
            {TABS.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  tab === k ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                {t(`coreHr.employees.drawer.tabs.${k}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error ? <ErrorMessage message={error} /> : null}

          {tab === 'overview' && data ? (
            <>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailField label={t('coreHr.employees.drawer.employeeNumber')}>{data.employeeNumber}</DetailField>
                <DetailField label={t('coreHr.employees.drawer.department')}>{data.department}</DetailField>
                <DetailField label={t('coreHr.employees.drawer.manager')}>{data.managerName}</DetailField>
                <DetailField label={t('coreHr.employees.drawer.location')}>{data.location}</DetailField>
                <DetailField label={t('coreHr.employees.drawer.hireDate')}>
                  {data.hireDate ? formatDate(data.hireDate, locale) : null}
                </DetailField>
                <DetailField label={t('coreHr.employees.drawer.employmentType')}>{data.employmentType}</DetailField>
              </dl>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  {t('coreHr.employees.drawer.upcomingExpirations')}
                </h3>
                {loading && !detail ? (
                  <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
                ) : (detail?.upcomingDocumentExpirations?.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-500">{t('coreHr.employees.drawer.noExpirations')}</p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                    {detail!.upcomingDocumentExpirations.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
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
              </section>
            </>
          ) : null}

          {tab === 'information' ? (
            detail ? (
              <div className="space-y-6">
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                    {t('coreHr.employees.profile.sections.contact')}
                  </h3>
                  <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <DetailField label={t('coreHr.employees.form.workEmail')}>{detail.workEmail}</DetailField>
                    <DetailField label={t('coreHr.employees.form.workPhone')}>{detail.workPhone}</DetailField>
                    <DetailField label={t('coreHr.employees.form.personalEmail')}>{detail.personalEmail}</DetailField>
                    <DetailField label={t('coreHr.employees.form.personalPhone')}>{detail.personalPhone}</DetailField>
                  </dl>
                </section>
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                    {t('coreHr.employees.profile.sections.employment')}
                  </h3>
                  <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <DetailField label={t('coreHr.employees.form.workModality')}>
                      {detail.workModality ? t(`coreHr.employees.modality.${detail.workModality}`, { defaultValue: detail.workModality }) : null}
                    </DetailField>
                    <DetailField label={t('coreHr.employees.profile.tenure')}>
                      {detail.tenureYears != null
                        ? `${detail.tenureYears.toLocaleString(locale, { maximumFractionDigits: 1 })} ${t('coreHr.employees.kpi.years')}`
                        : null}
                    </DetailField>
                    <DetailField label={t('coreHr.employees.form.contractStartDate')}>
                      {detail.contractStartDate ? formatDate(detail.contractStartDate, locale) : null}
                    </DetailField>
                    <DetailField label={t('coreHr.employees.form.contractEndDate')}>
                      {detail.contractEndDate ? formatDate(detail.contractEndDate, locale) : null}
                    </DetailField>
                  </dl>
                </section>
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                    {t('coreHr.employees.wizard.steps.emergency')}
                  </h3>
                  {detail.emergencyContacts.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('coreHr.employees.form.emergencyEmpty')}</p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.emergencyContacts.map((c, i) => (
                        <li key={c.id ?? i} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm">
                          <p className="font-medium text-dark-text">
                            {c.fullName}
                            {c.relationship ? <span className="font-normal text-gray-500"> · {c.relationship}</span> : null}
                          </p>
                          <p className="text-xs text-gray-500">{[c.phone, c.email].filter(Boolean).join(' · ') || '—'}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            ) : (
              <div className="h-40 animate-pulse rounded-lg bg-gray-100" />
            )
          ) : null}

          {tab === 'documents' ? (
            <EmployeeDocumentsPanel
              employeeId={employeeId}
              canManage={canManageDocuments && !data?.isArchived}
              locale={locale}
              onChanged={() => void load()}
            />
          ) : null}

          {tab === 'activity' ? (
            <EmployeeActivityPanel employeeId={employeeId} locale={locale} refreshKey={refreshKey} />
          ) : null}

          {!data && !error ? <div className="h-40 animate-pulse rounded-lg bg-gray-100" /> : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 p-6">
          <Button variant="secondary" onClick={onClose}>
            {t('common.actions.close')}
          </Button>
          <Button variant="primary" onClick={() => navigate(`/app/hr/employees/${employeeId}`)}>
            {t('coreHr.employees.drawer.openProfile')}
          </Button>
        </div>
      </div>
    </div>
  );
}

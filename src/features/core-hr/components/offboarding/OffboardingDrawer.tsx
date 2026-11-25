import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
import { useBackdropDismiss } from '../../../../hooks/useBackdropDismiss';
import { offboardingsApi } from '../../api/offboardingsApi';
import type { OffboardingCapabilities } from '../../hooks/useOffboardingCapabilities';
import type { OffboardingLookups } from '../../hooks/useOffboardingLookups';
import { OFFBOARDING_PERMISSIONS, type OffboardingDetail } from '../../models/offboarding';
import { apiErrorMessage, formatDate } from '../../utils/employeeFormat';
import EmployeeAvatar from '../EmployeeAvatar';
import type { HrToastState } from '../HrToast';
import OffboardingActivityPanel from './OffboardingActivityPanel';
import OffboardingAssetsAccessPanel from './OffboardingAssetsAccessPanel';
import OffboardingChecklistPanel from './OffboardingChecklistPanel';
import OffboardingDocumentsPanel from './OffboardingDocumentsPanel';
import OffboardingExitInterviewPanel from './OffboardingExitInterviewPanel';
import OffboardingInfoPanel from './OffboardingInfoPanel';
import OffboardingProgressBar from './OffboardingProgressBar';
import OffboardingStatusBadge from './OffboardingStatusBadge';
import ReasonModal from '../onboarding/ReasonModal';

export type OffboardingDrawerTab = 'checklist' | 'information' | 'assetsAccess' | 'documents' | 'exitInterview' | 'activity';
const TABS: OffboardingDrawerTab[] = ['checklist', 'information', 'assetsAccess', 'documents', 'exitInterview', 'activity'];

export type OffboardingDrawerPreview = {
  employeeId: string;
  employeeName: string;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  status?: string;
  progressPercent?: number;
};

type Props = {
  offboardingId: string | null;
  preview?: OffboardingDrawerPreview | null;
  caps: OffboardingCapabilities;
  lookups: OffboardingLookups;
  locale: string;
  /** Called after any change (status, task, details) so the parent can refresh the board / list / KPIs. */
  onChanged: () => void;
  onToast: (toast: HrToastState) => void;
  onClose: () => void;
};

export default function OffboardingDrawer({ offboardingId, preview, caps, lookups, locale, onChanged, onToast, onClose }: Props) {
  const { t } = useTranslation();
  const backdropDismiss = useBackdropDismiss(onClose);
  const [tab, setTab] = useState<OffboardingDrawerTab>('checklist');
  const [detail, setDetail] = useState<OffboardingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activityKey, setActivityKey] = useState(0);

  const canEdit = caps.can(OFFBOARDING_PERMISSIONS.Edit);
  const canComplete = caps.can(OFFBOARDING_PERMISSIONS.Complete);
  const canCancel = caps.can(OFFBOARDING_PERMISSIONS.Cancel);
  const canManageTasks = caps.can(OFFBOARDING_PERMISSIONS.ManageTasks);
  const canApprove = caps.can(OFFBOARDING_PERMISSIONS.ApproveClearance);
  const canManageDocuments = caps.can(OFFBOARDING_PERMISSIONS.ManageDocuments);
  const canManageAssets = caps.can(OFFBOARDING_PERMISSIONS.ManageAssets);
  const canManageAccess = caps.can(OFFBOARDING_PERMISSIONS.ManageAccess);
  const canManageSettlement = caps.can(OFFBOARDING_PERMISSIONS.ManageSettlement);
  const canManageExit = caps.can(OFFBOARDING_PERMISSIONS.ManageExitInterviews);
  const canViewConfidential = caps.has(OFFBOARDING_PERMISSIONS.ViewConfidentialInformation);

  const load = useCallback(
    async (silent = false) => {
      if (!offboardingId) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        setDetail(await offboardingsApi.get(offboardingId));
      } catch (err) {
        setError(apiErrorMessage(err, t('coreHr.offboarding.drawer.loadError')));
      } finally {
        setLoading(false);
      }
    },
    [offboardingId, t],
  );

  useEffect(() => {
    setDetail(null);
    setTab('checklist');
    setActionError(null);
    void load();
  }, [offboardingId, load]);

  /** Reload after a task/document/detail change. */
  const afterChange = useCallback(async () => {
    setActionError(null);
    await load(true);
    setActivityKey((k) => k + 1);
    onChanged();
  }, [load, onChanged]);

  const runStatus = async (fn: () => Promise<OffboardingDetail>, successKey: string) => {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await fn();
      setDetail(updated);
      setActivityKey((k) => k + 1);
      onToast({ tone: 'success', text: t(successKey, { name: updated.employeeName }) });
      onChanged();
    } catch (err) {
      const message = apiErrorMessage(err, t('coreHr.offboarding.drawer.actionError'));
      setActionError(message);
      onToast({ tone: 'error', text: message });
    } finally {
      setBusy(false);
      setCompleteOpen(false);
      setCancelOpen(false);
    }
  };

  if (!offboardingId) return null;

  const d = detail?.id === offboardingId ? detail : null;
  const name = d?.employeeName ?? preview?.employeeName ?? '';
  const employeeId = d?.employeeId ?? preview?.employeeId ?? '';
  const status = d?.status ?? preview?.status;
  const progress = d?.progressPercent ?? preview?.progressPercent ?? 0;
  const isActive = status === 'Scheduled' || status === 'InProgress' || status === 'PendingClearance';

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={name || t('coreHr.offboarding.drawer.title')}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" {...backdropDismiss} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
          <div className="flex min-w-0 items-center gap-4">
            <EmployeeAvatar name={name || '?'} seed={employeeId} url={d?.avatarUrl ?? preview?.avatarUrl} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-dark-text">{name || t('common.loading')}</h2>
              <p className="truncate text-sm text-gray-600">{d?.jobTitle ?? preview?.jobTitle ?? '—'}</p>
              {status ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <OffboardingStatusBadge status={status} />
                  {d?.separationType ? (
                    <span className="text-xs text-gray-500">
                      {t(`coreHr.offboarding.separationType.${d.separationType}`, { defaultValue: d.separationType })}
                      {d.lastWorkingDay ? ` · ${t('coreHr.offboarding.card.lastDay')}: ${formatDate(d.lastWorkingDay, locale)}` : ''}
                    </span>
                  ) : null}
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

        {/* Progress + actions */}
        <div className="space-y-3 border-b border-gray-100 px-6 py-4">
          <OffboardingProgressBar percent={progress} />
          <div className="flex flex-wrap gap-2">
            {d && canEdit && d.status === 'Scheduled' ? (
              <Button size="sm" disabled={busy} onClick={() => void runStatus(() => offboardingsApi.start(d.id), 'coreHr.offboarding.toast.started')}>
                {t('coreHr.offboarding.actions.start')}
              </Button>
            ) : null}
            {d && canEdit && d.status === 'InProgress' ? (
              <Button
                size="sm"
                disabled={busy || !d.canSubmitClearance}
                title={
                  !d.canSubmitClearance
                    ? d.clearanceBlockers.length > 0
                      ? `${t('coreHr.offboarding.drawer.blockedHint')}\n${d.clearanceBlockers.join('\n')}`
                      : t('coreHr.offboarding.drawer.blockedHint')
                    : undefined
                }
                onClick={() => void runStatus(() => offboardingsApi.submitClearance(d.id), 'coreHr.offboarding.toast.submitted')}
              >
                {t('coreHr.offboarding.actions.submitClearance')}
              </Button>
            ) : null}
            {d && canEdit && d.status === 'PendingClearance' ? (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() =>
                  void runStatus(() => offboardingsApi.changeStatus(d.id, { status: 'InProgress' }), 'coreHr.offboarding.toast.returned')
                }
              >
                {t('coreHr.offboarding.actions.returnToProgress')}
              </Button>
            ) : null}
            {d && canComplete && isActive ? (
              <Button
                size="sm"
                disabled={busy || !d.canComplete}
                title={!d.canComplete ? t('coreHr.offboarding.drawer.blockedHint') : undefined}
                onClick={() => setCompleteOpen(true)}
              >
                {t('coreHr.offboarding.actions.complete')}
              </Button>
            ) : null}
            {d && canCancel && isActive ? (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                className="!border-red-300 !text-red-700 hover:!bg-red-50"
                onClick={() => setCancelOpen(true)}
              >
                {t('coreHr.offboarding.actions.cancel')}
              </Button>
            ) : null}
            {employeeId ? (
              <Link
                to={`/app/hr/employees/${employeeId}`}
                className="inline-flex items-center rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-dark-text hover:bg-gray-50"
              >
                {t('coreHr.offboarding.actions.openProfile')}
              </Link>
            ) : null}
          </div>
          {actionError ? <ErrorMessage message={actionError} /> : null}
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-6 pt-4">
          <div className="flex overflow-x-auto rounded-lg bg-gray-100 p-1" role="tablist">
            {TABS.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={`flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  tab === k ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                {t(`coreHr.offboarding.drawer.tabs.${k}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {error ? (
            <div className="space-y-3">
              <ErrorMessage message={error} />
              <Button variant="outline" size="sm" onClick={() => void load()}>
                {t('coreHr.offboarding.retry')}
              </Button>
            </div>
          ) : null}
          {loading && !d ? <div className="h-40 animate-pulse rounded-xl bg-gray-100" /> : null}

          {d && tab === 'checklist' ? (
            <OffboardingChecklistPanel
              detail={d}
              lookups={lookups}
              locale={locale}
              canManageTasks={canManageTasks}
              canApprove={canApprove}
              onChanged={afterChange}
              onError={(message) => setActionError(message)}
            />
          ) : null}
          {d && tab === 'information' ? (
            <OffboardingInfoPanel
              detail={d}
              lookups={lookups}
              locale={locale}
              canEdit={canEdit}
              canViewConfidential={canViewConfidential}
              onSaved={(updated) => {
                setDetail(updated);
                setActivityKey((k) => k + 1);
                onChanged();
              }}
              onError={(message) => setActionError(message)}
            />
          ) : null}
          {d && tab === 'assetsAccess' ? (
            <OffboardingAssetsAccessPanel
              offboardingId={d.id}
              assets={d.assets}
              accessItems={d.accessItems}
              settlementItems={d.settlementItems}
              lookups={lookups}
              locale={locale}
              canManageAssets={canManageAssets && isActive}
              canManageAccess={canManageAccess && isActive}
              canManageSettlement={canManageSettlement && isActive}
              onChanged={afterChange}
              onError={(message) => setActionError(message)}
            />
          ) : null}
          {d && tab === 'documents' ? (
            <OffboardingDocumentsPanel
              offboardingId={d.id}
              documents={d.documents}
              canManage={canManageDocuments && isActive}
              onChanged={afterChange}
              onError={(message) => setActionError(message)}
            />
          ) : null}
          {d && tab === 'exitInterview' ? (
            <OffboardingExitInterviewPanel
              offboardingId={d.id}
              interview={d.exitInterview}
              lookups={lookups}
              locale={locale}
              canEdit={canManageExit && isActive}
              canViewConfidential={canViewConfidential}
              onChanged={afterChange}
              onError={(message) => setActionError(message)}
            />
          ) : null}
          {d && tab === 'activity' ? (
            <OffboardingActivityPanel offboardingId={d.id} locale={locale} refreshKey={activityKey} />
          ) : null}
        </div>
      </div>

      <ConfirmModal
        isOpen={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={() => d && void runStatus(() => offboardingsApi.complete(d.id), 'coreHr.offboarding.toast.completed')}
        busy={busy}
        title={t('coreHr.offboarding.completeModal.title')}
        description={t('coreHr.offboarding.completeModal.description', { name })}
        confirmLabel={t('coreHr.offboarding.actions.complete')}
      />

      <ReasonModal
        isOpen={cancelOpen}
        title={t('coreHr.offboarding.cancelModal.title')}
        description={t('coreHr.offboarding.cancelModal.description', { name })}
        label={t('coreHr.offboarding.cancelModal.reason')}
        confirmLabel={t('coreHr.offboarding.cancelModal.confirm')}
        busy={busy}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => d && void runStatus(() => offboardingsApi.cancel(d.id, reason), 'coreHr.offboarding.toast.cancelled')}
      />
    </div>
  );
}

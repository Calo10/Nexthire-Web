import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import ConfirmModal from '../../../../components/ui/ConfirmModal';
import { useBackdropDismiss } from '../../../../hooks/useBackdropDismiss';
import { onboardingsApi } from '../../api/onboardingsApi';
import type { OnboardingCapabilities } from '../../hooks/useOnboardingCapabilities';
import type { OnboardingLookups } from '../../hooks/useOnboardingLookups';
import { ONBOARDING_PERMISSIONS, type OnboardingDetail } from '../../models/onboarding';
import { apiErrorMessage } from '../../utils/employeeFormat';
import EmployeeAvatar from '../EmployeeAvatar';
import type { HrToastState } from '../HrToast';
import OnboardingActivityPanel from './OnboardingActivityPanel';
import OnboardingChecklistPanel from './OnboardingChecklistPanel';
import OnboardingDocumentsPanel from './OnboardingDocumentsPanel';
import OnboardingInfoPanel from './OnboardingInfoPanel';
import OnboardingProgressBar from './OnboardingProgressBar';
import OnboardingStatusBadge from './OnboardingStatusBadge';
import ReasonModal from './ReasonModal';

export type OnboardingDrawerTab = 'checklist' | 'information' | 'documents' | 'activity';
const TABS: OnboardingDrawerTab[] = ['checklist', 'information', 'documents', 'activity'];

export type OnboardingDrawerPreview = {
  employeeId: string;
  employeeName: string;
  jobTitle?: string | null;
  avatarUrl?: string | null;
  status?: string;
  progressPercent?: number;
};

type Props = {
  onboardingId: string | null;
  preview?: OnboardingDrawerPreview | null;
  caps: OnboardingCapabilities;
  lookups: OnboardingLookups;
  locale: string;
  /** Called after any change (status, task, details) so the parent can refresh the board / list / KPIs. */
  onChanged: () => void;
  onToast: (toast: HrToastState) => void;
  onClose: () => void;
};

export default function OnboardingDrawer({ onboardingId, preview, caps, lookups, locale, onChanged, onToast, onClose }: Props) {
  const { t } = useTranslation();
  const backdropDismiss = useBackdropDismiss(onClose);
  const [tab, setTab] = useState<OnboardingDrawerTab>('checklist');
  const [detail, setDetail] = useState<OnboardingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activityKey, setActivityKey] = useState(0);

  const canEdit = caps.can(ONBOARDING_PERMISSIONS.Edit);
  const canComplete = caps.can(ONBOARDING_PERMISSIONS.Complete);
  const canCancel = caps.can(ONBOARDING_PERMISSIONS.Cancel);
  const canManageTasks = caps.can(ONBOARDING_PERMISSIONS.ManageTasks);
  const canApprove = caps.can(ONBOARDING_PERMISSIONS.ApproveTasks);
  const canManageDocuments = caps.can(ONBOARDING_PERMISSIONS.ManageDocuments);

  const load = useCallback(
    async (silent = false) => {
      if (!onboardingId) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        setDetail(await onboardingsApi.get(onboardingId));
      } catch (err) {
        setError(apiErrorMessage(err, t('coreHr.onboarding.drawer.loadError')));
      } finally {
        setLoading(false);
      }
    },
    [onboardingId, t],
  );

  useEffect(() => {
    setDetail(null);
    setTab('checklist');
    setActionError(null);
    void load();
  }, [onboardingId, load]);

  /** Reload after a task/document/detail change. */
  const afterChange = useCallback(async () => {
    setActionError(null);
    await load(true);
    setActivityKey((k) => k + 1);
    onChanged();
  }, [load, onChanged]);

  const runStatus = async (fn: () => Promise<OnboardingDetail>, successKey: string) => {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await fn();
      setDetail(updated);
      setActivityKey((k) => k + 1);
      onToast({ tone: 'success', text: t(successKey, { name: updated.employeeName }) });
      onChanged();
    } catch (err) {
      const message = apiErrorMessage(err, t('coreHr.onboarding.drawer.actionError'));
      setActionError(message);
      onToast({ tone: 'error', text: message });
    } finally {
      setBusy(false);
      setCompleteOpen(false);
      setCancelOpen(false);
    }
  };

  if (!onboardingId) return null;

  const d = detail?.id === onboardingId ? detail : null;
  const name = d?.employeeName ?? preview?.employeeName ?? '';
  const employeeId = d?.employeeId ?? preview?.employeeId ?? '';
  const status = d?.status ?? preview?.status;
  const progress = d?.progressPercent ?? preview?.progressPercent ?? 0;
  const isActive = status === 'NotStarted' || status === 'InProgress' || status === 'InReview';

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={name || t('coreHr.onboarding.drawer.title')}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" {...backdropDismiss} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
          <div className="flex min-w-0 items-center gap-4">
            <EmployeeAvatar name={name || '?'} seed={employeeId} url={d?.avatarUrl ?? preview?.avatarUrl} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-bold text-dark-text">{name || t('common.loading')}</h2>
              <p className="truncate text-sm text-gray-600">{d?.jobTitle ?? preview?.jobTitle ?? '—'}</p>
              {status ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <OnboardingStatusBadge status={status} />
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
          <OnboardingProgressBar percent={progress} />
          <div className="flex flex-wrap gap-2">
            {d && canEdit && d.status === 'NotStarted' ? (
              <Button size="sm" disabled={busy} onClick={() => void runStatus(() => onboardingsApi.start(d.id), 'coreHr.onboarding.toast.started')}>
                {t('coreHr.onboarding.actions.start')}
              </Button>
            ) : null}
            {d && canEdit && d.status === 'InProgress' ? (
              <Button
                size="sm"
                disabled={busy || !d.canComplete}
                title={!d.canComplete ? t('coreHr.onboarding.drawer.blockedHint') : undefined}
                onClick={() => void runStatus(() => onboardingsApi.submitReview(d.id), 'coreHr.onboarding.toast.submitted')}
              >
                {t('coreHr.onboarding.actions.submitReview')}
              </Button>
            ) : null}
            {d && canEdit && d.status === 'InReview' ? (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void runStatus(() => onboardingsApi.returnToProgress(d.id), 'coreHr.onboarding.toast.returned')}
              >
                {t('coreHr.onboarding.actions.returnToProgress')}
              </Button>
            ) : null}
            {d && canComplete && isActive ? (
              <Button
                size="sm"
                disabled={busy || !d.canComplete}
                title={!d.canComplete ? t('coreHr.onboarding.drawer.blockedHint') : undefined}
                onClick={() => setCompleteOpen(true)}
              >
                {t('coreHr.onboarding.actions.complete')}
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
                {t('coreHr.onboarding.actions.cancel')}
              </Button>
            ) : null}
            {employeeId ? (
              <Link
                to={`/app/hr/employees/${employeeId}`}
                className="inline-flex items-center rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-dark-text hover:bg-gray-50"
              >
                {t('coreHr.onboarding.actions.openProfile')}
              </Link>
            ) : null}
          </div>
          {actionError ? <ErrorMessage message={actionError} /> : null}
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
                {t(`coreHr.onboarding.drawer.tabs.${k}`)}
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
                {t('coreHr.onboarding.retry')}
              </Button>
            </div>
          ) : null}
          {loading && !d ? <div className="h-40 animate-pulse rounded-xl bg-gray-100" /> : null}

          {d && tab === 'checklist' ? (
            <OnboardingChecklistPanel
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
            <OnboardingInfoPanel
              detail={d}
              lookups={lookups}
              locale={locale}
              canEdit={canEdit}
              onSaved={(updated) => {
                setDetail(updated);
                setActivityKey((k) => k + 1);
                onChanged();
              }}
              onError={(message) => setActionError(message)}
            />
          ) : null}
          {d && tab === 'documents' ? (
            <OnboardingDocumentsPanel
              onboardingId={d.id}
              documents={d.documents}
              canManage={canManageDocuments && isActive}
              onChanged={afterChange}
              onError={(message) => setActionError(message)}
            />
          ) : null}
          {d && tab === 'activity' ? (
            <OnboardingActivityPanel onboardingId={d.id} locale={locale} refreshKey={activityKey} />
          ) : null}
        </div>
      </div>

      <ConfirmModal
        isOpen={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={() => d && void runStatus(() => onboardingsApi.complete(d.id), 'coreHr.onboarding.toast.completed')}
        busy={busy}
        title={t('coreHr.onboarding.completeModal.title')}
        description={t('coreHr.onboarding.completeModal.description', { name })}
        confirmLabel={t('coreHr.onboarding.actions.complete')}
      />

      <ReasonModal
        isOpen={cancelOpen}
        title={t('coreHr.onboarding.cancelModal.title')}
        description={t('coreHr.onboarding.cancelModal.description', { name })}
        label={t('coreHr.onboarding.cancelModal.reason')}
        confirmLabel={t('coreHr.onboarding.cancelModal.confirm')}
        busy={busy}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => d && void runStatus(() => onboardingsApi.cancel(d.id, reason), 'coreHr.onboarding.toast.cancelled')}
      />
    </div>
  );
}

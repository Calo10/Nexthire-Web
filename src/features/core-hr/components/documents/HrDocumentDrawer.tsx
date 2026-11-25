import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import { useBackdropDismiss } from '../../../../hooks/useBackdropDismiss';
import { hrDocumentsApi } from '../../api/hrDocumentsApi';
import { useHrDocumentUrl } from '../../hooks/useHrDocumentUrl';
import type { HrDocumentDetail, HrDocumentListItem } from '../../models/hrDocument';
import { apiErrorMessage, formatDate, formatDateTime } from '../../utils/employeeFormat';
import { formatFileSize } from '../../utils/hrDocumentFormat';
import DetailField from '../DetailField';
import EmployeeAvatar from '../EmployeeAvatar';
import HrDocumentPreview from './HrDocumentPreview';
import HrDocumentStatusBadge, { HrDocumentTypeBadge } from './HrDocumentStatusBadge';

type TabKey = 'details' | 'activity' | 'access';
const TABS: TabKey[] = ['details', 'activity', 'access'];

type Props = {
  /** List row used for instant paint; the full record is fetched in the background. */
  doc: HrDocumentListItem | null;
  locale: string;
  canArchive: boolean;
  onArchive: (doc: HrDocumentListItem) => void;
  onClose: () => void;
};

export default function HrDocumentDrawer({ doc, locale, canArchive, onArchive, onClose }: Props) {
  const { t } = useTranslation();
  const backdropDismiss = useBackdropDismiss(onClose);
  const [tab, setTab] = useState<TabKey>('details');
  const [detail, setDetail] = useState<HrDocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const id = doc?.id ?? null;

  useEffect(() => {
    setTab('details');
    setDetail(null);
    setError(null);
    setFullscreen(false);
    if (!id) return;
    let cancelled = false;
    hrDocumentsApi
      .get(id)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, t('coreHr.documentsHub.drawer.loadError')));
      });
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  const d: HrDocumentListItem | null = detail?.id === id ? detail : doc;
  const activity = detail?.id === id ? detail.activity : [];
  const source = useHrDocumentUrl(d);

  useEffect(() => {
    if (!id) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !fullscreen) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [id, fullscreen, onClose]);

  if (!id || !d) return null;

  const download = () => {
    if (source.url) window.open(source.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={d.name}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" {...backdropDismiss} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-dark-text">{d.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <HrDocumentTypeBadge category={d.category} />
              <HrDocumentStatusBadge doc={d} />
              {d.fileSizeBytes ? <span className="text-xs text-gray-500">{formatFileSize(d.fileSizeBytes)}</span> : null}
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

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {error ? <ErrorMessage message={error} /> : null}

          <HrDocumentPreview doc={d} source={source} className="h-72" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!source.url} onClick={download}>
              {t('coreHr.documentsHub.actions.download')}
            </Button>
            <Button size="sm" variant="outline" disabled={!source.url} onClick={() => setFullscreen(true)}>
              {t('coreHr.documentsHub.actions.fullscreen')}
            </Button>
            {canArchive ? (
              <Button
                size="sm"
                variant="outline"
                className="!border-red-300 !text-red-700 hover:!bg-red-50"
                onClick={() => onArchive(d)}
              >
                {t('coreHr.documentsHub.actions.archive')}
              </Button>
            ) : null}
          </div>

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
                {t(`coreHr.documentsHub.drawer.tabs.${k}`)}
              </button>
            ))}
          </div>

          {tab === 'details' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                <EmployeeAvatar name={d.employeeName || '?'} seed={d.employeeId} url={d.employeeAvatarUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-dark-text">{d.employeeName}</p>
                  <p className="truncate text-xs text-gray-500">
                    {[d.employeeJobTitle, d.employeeDepartment].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <Link to={`/app/hr/employees/${d.employeeId}`} className="text-sm font-medium text-teal-700 hover:text-teal-800">
                  {t('coreHr.documentsHub.byEmployee.profile')}
                </Link>
              </div>
              <dl className="grid grid-cols-2 gap-4">
                <DetailField label={t('coreHr.documentsHub.table.type')}>
                  {t(`coreHr.employees.documents.categories.${d.category}`, { defaultValue: d.category })}
                </DetailField>
                <DetailField label={t('coreHr.documentsHub.table.expiration')}>{formatDate(d.expiresAt, locale)}</DetailField>
                <DetailField label={t('coreHr.documentsHub.drawer.format')}>{d.contentType || (d.externalUrl ? t('coreHr.documentsHub.drawer.link') : '—')}</DetailField>
                <DetailField label={t('coreHr.documentsHub.drawer.size')}>{formatFileSize(d.fileSizeBytes) || '—'}</DetailField>
                <DetailField label={t('coreHr.documentsHub.drawer.uploadedBy')}>{d.uploadedByName || '—'}</DetailField>
                <DetailField label={t('coreHr.documentsHub.drawer.uploadedAt')}>{formatDateTime(d.createdAt, locale)}</DetailField>
              </dl>
            </div>
          ) : null}

          {tab === 'activity' ? (
            <ul className="space-y-3 text-sm">
              {activity.map((a) => (
                <li key={a.id} className="rounded-lg border border-gray-200 px-4 py-3">
                  <p className="font-medium text-dark-text">{a.summary}</p>
                  <p className="text-xs text-gray-500">
                    {[a.createdByName, formatDateTime(a.createdAt, locale)].filter(Boolean).join(' · ')}
                  </p>
                </li>
              ))}
              <li className="rounded-lg border border-gray-200 px-4 py-3">
                <p className="font-medium text-dark-text">
                  {t('coreHr.documentsHub.drawer.activityUploaded', { name: d.uploadedByName || t('coreHr.documentsHub.drawer.unknownUser') })}
                </p>
                <p className="text-xs text-gray-500">{formatDateTime(d.createdAt, locale)}</p>
              </li>
            </ul>
          ) : null}

          {tab === 'access' ? (
            <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
              {t('coreHr.documentsHub.drawer.accessPlaceholder')}
            </p>
          ) : null}
        </div>
      </div>

      <Modal
        isOpen={fullscreen}
        onClose={() => setFullscreen(false)}
        title={d.name}
        width="2xl"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setFullscreen(false)}>
              {t('common.actions.close')}
            </Button>
            <Button size="sm" disabled={!source.url} onClick={download}>
              {t('coreHr.documentsHub.actions.download')}
            </Button>
          </>
        }
      >
        <HrDocumentPreview doc={d} source={source} className="h-[70vh]" />
      </Modal>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import TextField from '../TextField';
import TextareaField from '../TextareaField';
import SelectField from '../SelectField';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import StatusPill from '../StatusPill';
import type { Job } from '../../types/dashboard';
import { jobsApi } from '../../lib/api';

function formatDate(dateString: string | undefined, locale: string) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString(locale || 'en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

interface JobDetailDrawerProps {
  isOpen: boolean;
  job: Job | null;
  onClose: () => void;
  onUpdated?: (job: Job) => void;
}

export default function JobDetailDrawer({ isOpen, job, onClose, onUpdated }: JobDetailDrawerProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    status: 'open',
  });

  useEffect(() => {
    if (!isOpen) return;
    setIsEditing(false);
    setSaveError(null);
    setSuccess(null);
  }, [isOpen]);

  useEffect(() => {
    if (!job) return;
    setDraft({
      title: job.title || '',
      department: job.department || '',
      location: job.location || '',
      description: job.description || '',
      status: (job.status || 'open') as string,
    });
  }, [job]);

  const canSave = useMemo(() => {
    return !!draft.title.trim() && !isSaving;
  }, [draft.title, isSaving]);

  if (!isOpen) return null;

  const statusOptions = [
    { value: 'open', label: t('jobs.status.open') },
    { value: 'closed', label: t('jobs.status.closed') },
    { value: 'draft', label: t('jobs.status.draft') },
    { value: 'on_hold', label: t('jobs.status.on_hold') },
  ];

  const handleSave = async () => {
    if (!job) return;
    setSaveError(null);
    setSuccess(null);
    if (!canSave) {
      setSaveError(t('jobs.drawer.validation'));
      return;
    }

    setIsSaving(true);
    try {
      const updated = await jobsApi.updateJob(String(job.id), {
        title: draft.title.trim(),
        department: draft.department.trim() || undefined,
        location: draft.location.trim() || undefined,
        description: draft.description.trim() || undefined,
        status: draft.status,
      });
      setIsEditing(false);
      setSuccess(t('jobs.drawer.updated'));
      // Keep local draft in sync with response (so re-entering edit shows latest values)
      if (updated && typeof updated === 'object') {
        const u: any = updated;
        setDraft({
          title: u.title ?? draft.title,
          department: u.department ?? draft.department,
          location: u.location ?? draft.location,
          description: u.description ?? draft.description,
          status: u.status ?? draft.status,
        });
      }
      onUpdated?.(updated as Job);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err ? String((err as any).message) : t('jobs.drawer.errors.save');
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col border-l border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-dark-text truncate">{job?.title || t('jobs.drawer.title')}</h2>
            <p className="text-sm text-gray-600 truncate">{job?.location || job?.department || ''}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.aria.closeDrawer')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveError ? <ErrorMessage message={saveError} /> : null}
          {success ? <SuccessMessage message={success} /> : null}

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('jobs.drawer.details')}</h3>
            <Button variant="outline" size="sm" onClick={() => setIsEditing((v) => !v)} disabled={isSaving || !job}>
              {isEditing ? t('common.actions.cancel') : t('common.actions.edit')}
            </Button>
          </div>

          {isEditing ? (
            <div className="space-y-5">
              <TextField
                label={t('jobs.fields.title')}
                required
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  label={t('jobs.fields.department')}
                  value={draft.department}
                  onChange={(e) => setDraft({ ...draft, department: e.target.value })}
                />
                <TextField
                  label={t('jobs.fields.location')}
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                />
              </div>
              <SelectField
                label={t('jobs.fields.status')}
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                options={statusOptions}
              />
              <TextareaField
                label={t('jobs.fields.description')}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('jobs.fields.department')}</p>
                  <p className="text-sm text-dark-text">{job?.department || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('jobs.fields.location')}</p>
                  <p className="text-sm text-dark-text">{job?.location || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('jobs.fields.status')}</p>
                {job?.status ? <StatusPill status={job.status} /> : <p className="text-sm text-dark-text">-</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('jobs.fields.description')}</p>
                <p className="text-sm text-dark-text whitespace-pre-wrap">{job?.description || '-'}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t('jobs.drawer.metadata')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('jobs.drawer.created')}</p>
                <p className="text-sm text-dark-text">{formatDate(job?.createdAt, locale)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('jobs.drawer.updatedAt')}</p>
                <p className="text-sm text-dark-text">{formatDate(job?.updatedAt, locale)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            {t('common.actions.close')}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!job || !canSave}>
            {isSaving ? t('common.actions.saving') : t('common.actions.saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}


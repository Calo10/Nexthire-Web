import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import TextField from '../TextField';
import TextareaField from '../TextareaField';
import SelectField from '../SelectField';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import StatusPill from '../StatusPill';
import type { Job, JobLanguage } from '../../types/dashboard';
import { jobsApi, type ApiError } from '../../lib/api';
import JobBotQuestionsModal from './JobBotQuestionsModal';

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
  onDeleted?: () => void;
}

export default function JobDetailDrawer({ isOpen, job, onClose, onUpdated, onDeleted }: JobDetailDrawerProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [botQuestionsOpen, setBotQuestionsOpen] = useState(false);

  const [draft, setDraft] = useState({
    title: '',
    location: '',
    description: '',
    status: 'open',
    language: 'es' as JobLanguage,
  });

  useEffect(() => {
    if (!isOpen) return;
    setIsEditing(false);
    setSaveError(null);
    setSuccess(null);
    setBotQuestionsOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!job) return;
    setDraft({
      title: job.title || '',
      location: job.location || '',
      description: job.description || '',
      status: (job.status || 'open') as string,
      language: (job.language === 'en' ? 'en' : 'es') as JobLanguage,
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

  const languageOptions = [
    { value: 'es', label: t('jobs.language.es') },
    { value: 'en', label: t('jobs.language.en') },
  ];

  const languageLabel = (language?: string) => {
    if (language === 'en') return t('jobs.language.en');
    if (language === 'es') return t('jobs.language.es');
    return language || '-';
  };

  const handleDelete = async () => {
    if (!job) return;
    const ok = window.confirm(t('jobs.drawer.confirmDelete'));
    if (!ok) return;

    setSaveError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      await jobsApi.deleteJob(String(job.id));
      onDeleted?.();
      onClose();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr && typeof apiErr === 'object' && apiErr.status === 409) {
        setSaveError(t('jobs.errors.deleteJobHasApplications'));
      } else {
        const message =
          err && typeof err === 'object' && 'message' in err ? String((err as any).message) : t('jobs.errors.deleteJob');
        setSaveError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

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
        location: draft.location.trim() || undefined,
        description: draft.description.trim() || undefined,
        status: draft.status,
        language: draft.language,
      });
      setIsEditing(false);
      setSuccess(t('jobs.drawer.updated'));
      // Keep local draft in sync with response (so re-entering edit shows latest values)
      if (updated && typeof updated === 'object') {
        const u: any = updated;
        setDraft({
          title: u.title ?? draft.title,
          location: u.location ?? draft.location,
          description: u.description ?? draft.description,
          status: u.status ?? draft.status,
          language: (u.language === 'en' ? 'en' : 'es') as JobLanguage,
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
    <>
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
            <p className="text-sm text-gray-600 truncate">{job?.location || ''}</p>
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
              <TextField
                label={t('jobs.fields.location')}
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              />
              <SelectField
                label={t('jobs.fields.status')}
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                options={statusOptions}
              />
              <SelectField
                label={t('jobs.fields.language')}
                value={draft.language}
                onChange={(e) => setDraft({ ...draft, language: e.target.value as JobLanguage })}
                options={languageOptions}
              />
              <TextareaField
                label={t('jobs.fields.description')}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('jobs.fields.location')}</p>
                <p className="text-sm text-dark-text">{job?.location || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('jobs.fields.status')}</p>
                {job?.status ? <StatusPill status={job.status} /> : <p className="text-sm text-dark-text">-</p>}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('jobs.fields.language')}</p>
                <p className="text-sm text-dark-text">{languageLabel(job?.language)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('jobs.fields.description')}</p>
                <p className="text-sm text-dark-text whitespace-pre-wrap">{job?.description || '-'}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t('jobs.drawer.actions')}</h3>
            <Button
              variant="outline"
              size="sm"
              disabled={!job || isSaving}
              onClick={() => setBotQuestionsOpen(true)}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {t('jobs.drawer.botQuestions')}
              </span>
            </Button>
          </div>

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

        <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-3">
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700 from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-600"
            onClick={handleDelete}
            disabled={!job || isSaving}
          >
            {t('common.actions.delete')}
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              {t('common.actions.close')}
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!job || !canSave || isSaving}>
              {isSaving ? t('common.actions.saving') : t('common.actions.saveChanges')}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <JobBotQuestionsModal
      isOpen={botQuestionsOpen}
      jobId={job ? String(job.id) : null}
      jobTitle={job?.title || ''}
      onClose={() => setBotQuestionsOpen(false)}
    />
    </>
  );
}


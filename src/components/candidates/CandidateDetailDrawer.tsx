import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import TextField from '../TextField';
import SelectField from '../SelectField';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import PhoneDisplay from '../PhoneDisplay';
import { candidateSourceSelectOptions, normalizeCandidateSourceForSelect } from '../../lib/candidateSources';
import { getCountryCallingCodeOptions, onlyDigits, splitE164Phone, toE164Phone } from '../../lib/phone';
import { useCandidate } from '../../hooks/useCandidate';
import { candidatesApi } from '../../api/candidatesApi';
import Modal from '../Modal';
import SourcePill from './SourcePill';

function formatDate(dateString: string, locale: string) {
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

interface CandidateDetailDrawerProps {
  isOpen: boolean;
  candidateId: string | null;
  onClose: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export default function CandidateDetailDrawer({
  isOpen,
  candidateId,
  onClose,
  onUpdated,
  onDeleted,
}: CandidateDetailDrawerProps) {
  const { t, i18n } = useTranslation();
  const shouldFetch = isOpen && !!candidateId;
  const { data, isLoading, error, refetch } = useCandidate(shouldFetch, candidateId);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumePrefetchLoading, setResumePrefetchLoading] = useState(false);

  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [resumeModalLoading, setResumeModalLoading] = useState(false);
  const [resumeModalError, setResumeModalError] = useState<string | null>(null);
  const [resumeModalUrl, setResumeModalUrl] = useState<string | null>(null);
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    cached: boolean;
    analysis: {
      summary?: string | null;
      language?: string | null;
      docType?: string | null;
      keyPoints?: string[];
      warnings?: string[];
      extractedTextChars?: number | null;
      createdAtUtc?: string | null;
    } | null;
  } | null>(null);

  const [draft, setDraft] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneCountryCode: '506',
    phoneNationalNumber: '',
    source: '',
  });

  const fullName = useMemo(() => {
    if (!data) return '';
    return `${data.firstName || ''} ${data.lastName || ''}`.trim();
  }, [data]);

  useEffect(() => {
    if (!isOpen) return;
    setIsEditing(false);
    setSaveError(null);
    setSuccess(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !candidateId) return;
    let cancelled = false;
    const run = async () => {
      setResumePrefetchLoading(true);
      try {
        const url = await candidatesApi.resumeDownloadUrl(candidateId);
        if (cancelled) return;
        setResumeUrl(url);
      } catch {
        if (!cancelled) setResumeUrl(null);
      } finally {
        if (!cancelled) setResumePrefetchLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [candidateId, isOpen]);

  useEffect(() => {
    if (!data) return;
    const split = splitE164Phone(data.phone || '');
    setDraft({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      phoneCountryCode: split.callingCode || '506',
      phoneNationalNumber: split.nationalNumber || '',
      source: normalizeCandidateSourceForSelect(data.source),
    });
  }, [data]);

  const viewerUrl = useMemo(() => {
    const url = String(resumeModalUrl || '').trim();
    if (!url) return '';
    const lower = url.toLowerCase();
    const isDoc = lower.includes('.docx') || lower.includes('.doc');
    if (isDoc) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }
    return url;
  }, [resumeModalUrl]);

  useEffect(() => {
    if (!isResumeModalOpen) return;
    if (!viewerUrl) return;
    setResumePreviewLoading(true);
  }, [isResumeModalOpen, viewerUrl]);

  const sourceOptions = useMemo(
    () => [{ value: '', label: t('common.none') }, ...candidateSourceSelectOptions(t)],
    [t]
  );
  const countryOptions = getCountryCallingCodeOptions();

  if (!isOpen) return null;

  const canSave =
    draft.firstName.trim() &&
    draft.lastName.trim() &&
    draft.email.trim() &&
    isValidEmail(draft.email) &&
    !isSaving;

  const handleSave = async () => {
    if (!candidateId) return;
    setSaveError(null);
    setSuccess(null);
    if (!canSave) {
      setSaveError(t('candidates.validation.drawerRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const phoneE164 = toE164Phone(draft.phoneCountryCode, draft.phoneNationalNumber);
      await candidatesApi.update(candidateId, {
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        email: draft.email.trim(),
        phone: phoneE164 || undefined,
        source: draft.source.trim() || undefined,
      });
      setIsEditing(false);
      setSuccess(t('candidates.drawer.updated'));
      refetch();
      onUpdated?.();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err ? String((err as any).message) : t('candidates.errors.saveChanges');
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!candidateId) return;
    const ok = window.confirm(t('candidates.drawer.confirmDelete'));
    if (!ok) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await candidatesApi.delete(candidateId);
      onDeleted?.();
      onClose();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err ? String((err as any).message) : t('candidates.errors.deleteCandidate');
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const loadAnalysis = async (id: string) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      const res = await candidatesApi.resumeAnalysis(id);
      setAnalysisResult(res);
      if (!res?.analysis) setAnalysisError(t('candidates.drawer.resume.analysis.empty'));
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('candidates.drawer.resume.failed');
      setAnalysisError(msg);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleViewResume = async () => {
    if (!candidateId) return;
    if (resumeModalLoading) return;
    setIsResumeModalOpen(true);
    setResumeModalLoading(true);
    setResumeModalError(null);
    try {
      const url = resumeUrl || (await candidatesApi.resumeDownloadUrl(candidateId));
      setResumeUrl(url);
      setResumeModalUrl(url);
      if (!url) {
        setResumeModalError(t('candidates.drawer.resume.noResume'));
      }
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : t('candidates.drawer.resume.failed');
      setResumeModalError(msg);
    } finally {
      setResumeModalLoading(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!candidateId) return;
    if (!resumeUrl) return;
    if (analysisLoading) return;
    setIsAnalysisModalOpen(true);
    await loadAnalysis(candidateId);
  };

  return (
    <>
    <div
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col border-l border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-dark-text truncate">
              {isLoading ? t('common.loading') : fullName || t('candidates.candidate')}
            </h2>
            <p className="text-sm text-gray-600 truncate">{data?.email || ''}</p>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <ErrorMessage message={error.message || t('candidates.errors.loadCandidate')} />}
          {saveError && <ErrorMessage message={saveError} />}
          {success && <SuccessMessage message={success} />}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : data ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{t('candidates.drawer.details')}</h3>
                <Button variant="outline" size="sm" onClick={() => setIsEditing((v) => !v)} disabled={isSaving}>
                  {isEditing ? t('common.actions.cancel') : t('common.actions.edit')}
                </Button>
              </div>

              <div className="space-y-5">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TextField
                      label={t('candidates.fields.firstName')}
                      required
                      value={draft.firstName}
                      onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                    />
                    <TextField
                      label={t('candidates.fields.lastName')}
                      required
                      value={draft.lastName}
                      onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('candidates.fields.firstName')}</p>
                      <p className="text-sm text-dark-text">{data.firstName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('candidates.fields.lastName')}</p>
                      <p className="text-sm text-dark-text">{data.lastName || '-'}</p>
                    </div>
                  </div>
                )}

                {isEditing ? (
                  <TextField
                    label={t('candidates.fields.email')}
                    required
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  />
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('candidates.fields.email')}</p>
                    <p className="text-sm text-dark-text">{data.email || '-'}</p>
                  </div>
                )}

                {/* Resume actions */}
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {t('candidates.drawer.resume.title')}
                    </h3>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-purple-200 text-primary hover:bg-purple-50 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!candidateId || resumeModalLoading}
                      onClick={handleViewResume}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {resumeModalLoading ? (
                          <Spinner />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6M7 4h7l3 3v13a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                            />
                          </svg>
                        )}
                        <span>{t('candidates.drawer.resume.view')}</span>
                      </div>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!candidateId || !resumeUrl || analysisLoading || resumePrefetchLoading}
                      onClick={handleAnalyzeResume}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {analysisLoading ? (
                          <Spinner />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        )}
                        <span>{t('candidates.drawer.resume.analyze')}</span>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-8">
                    {isEditing ? (
                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-2">
                          <SelectField
                            label={t('candidates.fields.phoneCountry')}
                            value={draft.phoneCountryCode}
                            onChange={(e) => setDraft({ ...draft, phoneCountryCode: e.target.value })}
                            options={countryOptions}
                          />
                        </div>
                        <div className="col-span-3">
                          <TextField
                            label={t('candidates.fields.phoneNumber')}
                            value={draft.phoneNationalNumber}
                            onChange={(e) =>
                              setDraft({ ...draft, phoneNationalNumber: onlyDigits(e.target.value) })
                            }
                            placeholder={t('candidates.placeholders.phone')}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('candidates.fields.phone')}</p>
                        <PhoneDisplay phone={data.phone} className="text-sm text-dark-text" />
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-4">
                    {isEditing ? (
                      <SelectField
                        label={t('candidates.fields.source')}
                        value={draft.source}
                        onChange={(e) => setDraft({ ...draft, source: e.target.value })}
                        options={sourceOptions}
                      />
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('candidates.fields.source')}</p>
                        {data.source?.trim() ? (
                          <SourcePill source={data.source} />
                        ) : (
                          <span className="text-sm text-gray-600">-</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t('candidates.drawer.metadata')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('candidates.drawer.created')}</p>
                    <p className="text-sm text-dark-text">{data.createdAt ? formatDate(data.createdAt, i18n.language || 'en') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('candidates.drawer.updatedAt')}</p>
                    <p className="text-sm text-dark-text">{data.updatedAt ? formatDate(data.updatedAt, i18n.language || 'en') : '-'}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600">{t('candidates.drawer.selectCandidate')}</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={handleDelete} disabled={!candidateId || isSaving}>
            {t('common.actions.delete')}
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>
              {t('common.actions.close')}
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={!candidateId || !isEditing || !canSave}>
              {isSaving ? t('common.actions.saving') : t('common.actions.saveChanges')}
            </Button>
          </div>
        </div>
      </div>
    </div>

    {/* Resume preview modal */}
    <Modal
      isOpen={isResumeModalOpen}
      onClose={() => {
        setIsResumeModalOpen(false);
        setResumeModalError(null);
        setResumePreviewLoading(false);
      }}
      title={t('candidates.drawer.resume.modalTitle')}
      width="xl"
      footer={
        resumeModalUrl ? (
          <>
            <Button variant="secondary" onClick={() => setIsResumeModalOpen(false)}>
              {t('common.actions.close')}
            </Button>
            <a href={resumeModalUrl} download rel="noreferrer" className="inline-flex">
              <Button variant="primary">{t('candidates.drawer.resume.openInNewTab')}</Button>
            </a>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setIsResumeModalOpen(false)}>
            {t('common.actions.close')}
          </Button>
        )
      }
    >
      {resumeModalLoading ? (
        <div className="h-[70vh] rounded-2xl bg-gray-100 animate-pulse" />
      ) : resumeModalError ? (
        <ErrorMessage message={resumeModalError} />
      ) : viewerUrl ? (
        <div className="relative h-[70vh] rounded-2xl border border-gray-200 overflow-hidden bg-white">
          {resumePreviewLoading ? (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <Spinner className="w-5 h-5" />
                <span>{t('common.loading')}</span>
              </div>
            </div>
          ) : null}
          <iframe
            title="resume-preview"
            src={viewerUrl}
            className="w-full h-full"
            onLoad={() => setResumePreviewLoading(false)}
          />
        </div>
      ) : (
        <div className="text-sm text-gray-600">{t('candidates.drawer.resume.noResume')}</div>
      )}
    </Modal>

    {/* AI analysis modal */}
    <Modal
      isOpen={isAnalysisModalOpen}
      onClose={() => {
        setIsAnalysisModalOpen(false);
        setAnalysisError(null);
      }}
      title={t('candidates.drawer.resume.analysisModalTitle')}
      width="xl"
      footer={
        <>
          <Button variant="secondary" onClick={() => setIsAnalysisModalOpen(false)}>
            {t('common.actions.close')}
          </Button>
          <Button variant="primary" disabled={!candidateId || analysisLoading} onClick={() => candidateId && loadAnalysis(candidateId)}>
            {analysisLoading ? t('common.actions.saving') : t('candidates.drawer.resume.analysis.refresh')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {analysisLoading ? (
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        ) : analysisError ? (
          <ErrorMessage message={analysisError} />
        ) : analysisResult?.analysis ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {analysisResult.cached ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {t('candidates.drawer.resume.analysis.cached')}
                  </span>
                ) : null}
                {analysisResult.analysis.language ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {t('candidates.drawer.resume.analysis.language')}: {analysisResult.analysis.language}
                  </span>
                ) : null}
                {analysisResult.analysis.docType ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {t('candidates.drawer.resume.analysis.docType')}: {analysisResult.analysis.docType}
                  </span>
                ) : null}
              </div>
              {analysisResult.analysis.createdAtUtc ? (
                <div className="text-xs text-gray-500">
                  {t('candidates.drawer.resume.analysis.createdAt')}: {formatDate(analysisResult.analysis.createdAtUtc, i18n.language || 'en')}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                {t('candidates.drawer.resume.analysis.summary')}
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{analysisResult.analysis.summary || '—'}</p>
              {typeof analysisResult.analysis.extractedTextChars === 'number' ? (
                <p className="text-xs text-gray-500 mt-3">
                  {t('candidates.drawer.resume.analysis.extractedChars')}: {analysisResult.analysis.extractedTextChars}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  {t('candidates.drawer.resume.analysis.keyPoints')}
                </h3>
                {analysisResult.analysis.keyPoints?.length ? (
                  <ul className="space-y-2">
                    {analysisResult.analysis.keyPoints.map((k, idx) => (
                      <li key={`${idx}-${k}`} className="flex gap-2 text-sm text-gray-700">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        <span className="min-w-0">{k}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">—</p>
                )}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide mb-3">
                  {t('candidates.drawer.resume.analysis.warnings')}
                </h3>
                {analysisResult.analysis.warnings?.length ? (
                  <ul className="space-y-2">
                    {analysisResult.analysis.warnings.map((w, idx) => (
                      <li key={`${idx}-${w}`} className="text-sm text-amber-900">
                        {w}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-amber-900/80">—</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-sm text-gray-600">{t('candidates.drawer.resume.analysis.empty')}</div>
        )}
      </div>
    </Modal>
    </>
  );
}


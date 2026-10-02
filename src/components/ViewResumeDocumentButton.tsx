import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { documentsApi } from '../api/documentsApi';
import Button from './Button';
import ErrorMessage from './ErrorMessage';
import Modal from './Modal';

const DOCUMENT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isResumeDocumentId(value: string | null | undefined): boolean {
  return DOCUMENT_ID.test(String(value || '').trim());
}

export function isResumeAnswer(answer: { label?: string; key?: string }): boolean {
  const text = `${answer.label || ''} ${answer.key || ''}`.toLowerCase();
  return /cv|curriculum|currículum|curriculo|resume/.test(text);
}

export default function ViewResumeDocumentButton({
  documentId,
  disabled = false,
}: {
  documentId: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const viewerUrl = useMemo(() => {
    const raw = String(url || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();
    if (lower.includes('.docx') || lower.includes('.doc')) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(raw)}`;
    }
    return raw;
  }, [url]);

  useEffect(() => {
    if (!open || !viewerUrl) return;
    setPreviewLoading(true);
  }, [open, viewerUrl]);

  const openResume = async () => {
    if (loading || disabled || !isResumeDocumentId(documentId)) return;
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const next = await documentsApi.downloadUrl(documentId.trim());
      setUrl(next);
      if (!next) setError(t('candidates.drawer.resume.noResume'));
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : t('candidates.drawer.resume.failed');
      setError(message || t('candidates.drawer.resume.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-1 border-purple-200 text-primary hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled || loading || !isResumeDocumentId(documentId)}
        onClick={() => void openResume()}
      >
        <span className="inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6M7 4h7l3 3v13a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
            />
          </svg>
          {t('candidates.drawer.resume.view')}
        </span>
      </Button>
      <Modal
        isOpen={open}
        onClose={() => {
          setOpen(false);
          setError(null);
          setPreviewLoading(false);
        }}
        title={t('candidates.drawer.resume.modalTitle')}
        width="xl"
        footer={
          url ? (
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                {t('common.actions.close')}
              </Button>
              <a href={url} download rel="noreferrer" className="inline-flex">
                <Button variant="primary">{t('candidates.drawer.resume.openInNewTab')}</Button>
              </a>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t('common.actions.close')}
            </Button>
          )
        }
      >
        {loading ? (
          <div className="h-[70vh] rounded-2xl bg-gray-100 animate-pulse" />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : viewerUrl ? (
          <div className="relative h-[70vh] rounded-2xl border border-gray-200 overflow-hidden bg-white">
            {previewLoading ? (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-sm text-gray-700">
                {t('common.loading')}
              </div>
            ) : null}
            <iframe
              title={t('candidates.drawer.resume.modalTitle')}
              src={viewerUrl}
              className="h-full w-full"
              onLoad={() => setPreviewLoading(false)}
            />
          </div>
        ) : (
          <div className="text-sm text-gray-600">{t('candidates.drawer.resume.noResume')}</div>
        )}
      </Modal>
    </>
  );
}

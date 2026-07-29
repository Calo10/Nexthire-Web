import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import TextField from '../TextField';
import TextareaField from '../TextareaField';
import ErrorMessage from '../ErrorMessage';
import ImageUploadPreview, {
  type MetaCreativeImageReady,
} from '../marketing/metaCampaign/ImageUploadPreview';
import GeneratedUrlPreview from '../marketing/metaCampaign/GeneratedUrlPreview';
import { jobsApi, type ApiError } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { resolveTenantId } from '../../lib/resolveTenantId';
import { buildPublicJobPostUrl, resolveSiteOrigin } from '../../lib/metaCampaignUrls';
import type { GeneratedMetaCreativePreview } from '../../types/metaCampaign';

function extensionFromContentType(contentType: string): string {
  const t = contentType.toLowerCase();
  if (t.includes('jpeg') || t.includes('jpg')) return 'jpg';
  if (t.includes('webp')) return 'webp';
  if (t.includes('gif')) return 'gif';
  return 'png';
}

function parseDataUrl(dataUrl: string): { base64: string; contentType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { contentType: match[1], base64: match[2] };
}

function creativeImageSrc(base64: string, contentType: string): string | null {
  const raw = String(base64 || '')
    .replace(/^data:[^;]+;base64,/, '')
    .trim();
  if (!raw) return null;
  const mime = String(contentType || 'image/png').trim() || 'image/png';
  return `data:${mime};base64,${raw}`;
}

interface GenerateProps {
  mode: 'generate';
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  onSaved: (payload: { hasAdDesign: true }) => void;
}

interface ViewProps {
  mode: 'view';
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  onDeleted: () => void;
}

type Props = GenerateProps | ViewProps;

export default function JobAdDesignModal(props: Props) {
  if (props.mode === 'view') {
    return <JobAdDesignViewModal {...props} />;
  }
  return <JobAdDesignGenerateModal {...props} />;
}

function JobAdDesignGenerateModal({ isOpen, onClose, jobId, jobTitle, onSaved }: GenerateProps) {
  const { t } = useTranslation();
  const [creativeMessage, setCreativeMessage] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [imageHash, setImageHash] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [imageContentType, setImageContentType] = useState('image/png');
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedMetaCreativePreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCreativeMessage('');
    setAiInstructions('');
    setImageHash('');
    setImagePreviewUrl(null);
    setImageBase64('');
    setImageContentType('image/png');
    setGeneratedPreview(null);
    setSaving(false);
    setError(null);
  }, [isOpen, jobId]);

  const resolvedImage = useMemo(() => {
    if (imageBase64.trim()) {
      return {
        base64: imageBase64.replace(/^data:[^;]+;base64,/, '').trim(),
        contentType: imageContentType || 'image/png',
      };
    }
    if (generatedPreview?.dataUrl) {
      const parsed = parseDataUrl(generatedPreview.dataUrl);
      if (parsed?.base64) {
        return {
          base64: parsed.base64,
          contentType: parsed.contentType || generatedPreview.contentType || 'image/png',
        };
      }
    }
    return null;
  }, [imageBase64, imageContentType, generatedPreview]);

  const canAccept = Boolean(jobId && resolvedImage?.base64 && !saving);

  const handleImageReady = (image: MetaCreativeImageReady) => {
    setImageHash(image.imageHash || '');
    setImagePreviewUrl(image.previewUrl);
    setImageBase64(image.imageBase64 || '');
    setImageContentType(image.imageContentType || 'image/png');
    setGeneratedPreview(null);
  };

  const handleAccept = async () => {
    if (!canAccept || !resolvedImage) return;
    setSaving(true);
    setError(null);
    try {
      await jobsApi.saveJobAdDesign(jobId, {
        imageBase64: resolvedImage.base64,
        imageContentType: resolvedImage.contentType,
        adText: creativeMessage.trim() || undefined,
      });
      onSaved({ hasAdDesign: true });
      onClose();
    } catch (e: unknown) {
      const err = e as ApiError;
      setError(err?.message || t('jobs.adDesign.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('jobs.adDesign.generateTitle')}
      subtitle={jobTitle || undefined}
      width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="button" variant="primary" disabled={!canAccept} onClick={() => void handleAccept()}>
            {saving ? t('common.actions.saving') : t('jobs.adDesign.accept')}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {error ? <ErrorMessage message={error} /> : null}
        <p className="text-sm text-gray-600">{t('metaCampaign.creative.intro')}</p>
        <TextField
          label={t('metaCampaign.creative.message')}
          value={creativeMessage}
          onChange={(e) => setCreativeMessage(e.target.value)}
        />
        <div>
          <TextareaField
            label={t('metaCampaign.creative.aiInstructions')}
            value={aiInstructions}
            onChange={(e) => setAiInstructions(e.target.value)}
            placeholder={t('metaCampaign.creative.aiInstructionsPlaceholder')}
            rows={3}
          />
          <p className="mt-1.5 text-xs text-gray-500">{t('metaCampaign.creative.aiInstructionsHint')}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2">{t('metaCampaign.creative.imageSection')}</p>
          <ImageUploadPreview
            mode="local"
            jobId={jobId}
            creativeMessage={creativeMessage}
            aiInstructions={aiInstructions}
            imageHash={imageHash}
            imagePreviewUrl={imagePreviewUrl}
            generatedPreview={generatedPreview}
            onGeneratedPreviewChange={setGeneratedPreview}
            onImageReady={handleImageReady}
          />
        </div>
      </div>
    </Modal>
  );
}

function JobAdDesignViewModal({ isOpen, onClose, jobId, jobTitle, onDeleted }: ViewProps) {
  const { t } = useTranslation();
  const { org } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState('');
  const [imageContentType, setImageContentType] = useState('image/png');
  const [adText, setAdText] = useState('');

  useEffect(() => {
    if (!isOpen || !jobId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const design = await jobsApi.getJobAdDesign(jobId);
        if (cancelled) return;
        if (!design?.imageBase64) {
          setError(t('jobs.adDesign.notFound'));
          setImageBase64('');
          return;
        }
        setImageBase64(design.imageBase64);
        setImageContentType(design.imageContentType || 'image/png');
        setAdText(design.adText || '');
      } catch (e: unknown) {
        if (!cancelled) {
          const err = e as ApiError;
          setError(err?.message || t('jobs.adDesign.loadFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, jobId, t]);

  const src = useMemo(
    () => creativeImageSrc(imageBase64, imageContentType),
    [imageBase64, imageContentType]
  );

  const publicJobUrl = useMemo(() => {
    const orgSegment = resolveTenantId(org);
    const origin = resolveSiteOrigin();
    if (!orgSegment || !origin || !jobId) return '';
    return buildPublicJobPostUrl(origin, orgSegment, jobId);
  }, [org, jobId]);

  const handleDownload = () => {
    if (!src) return;
    const ext = extensionFromContentType(imageContentType);
    const safeName = (jobTitle.trim() || 'job-ad-design').replace(/[^\w.-]+/g, '-').slice(0, 80);
    const a = document.createElement('a');
    a.href = src;
    a.download = `${safeName}.${ext}`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDelete = async () => {
    if (!jobId) return;
    const ok = window.confirm(t('jobs.adDesign.confirmDelete'));
    if (!ok) return;
    setDeleting(true);
    setError(null);
    try {
      await jobsApi.deleteJobAdDesign(jobId);
      onDeleted();
      onClose();
    } catch (e: unknown) {
      const err = e as ApiError;
      setError(err?.message || t('jobs.adDesign.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('jobs.adDesign.viewTitle')}
      subtitle={jobTitle || undefined}
      width="md"
      footer={
        <div className="flex flex-wrap justify-between gap-3">
          <Button
            type="button"
            variant="primary"
            className="bg-red-600 hover:bg-red-700 from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-600"
            disabled={deleting || loading || !src}
            onClick={() => void handleDelete()}
          >
            {deleting ? t('common.actions.saving') : t('common.actions.delete')}
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={deleting}>
              {t('common.actions.close')}
            </Button>
            <Button type="button" variant="primary" disabled={!src || deleting} onClick={handleDownload}>
              {t('jobs.adDesign.download')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        {loading ? (
          <div className="py-10 text-center text-gray-500">{t('common.loading')}</div>
        ) : src ? (
          <>
            {adText ? (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {t('metaCampaign.creative.message')}
                </p>
                <p className="text-sm text-gray-800">{adText}</p>
              </div>
            ) : null}
            <img
              src={src}
              alt=""
              className="w-full max-h-[28rem] object-contain rounded-xl border border-gray-200 bg-gray-50"
            />
            <GeneratedUrlPreview url={publicJobUrl} />
          </>
        ) : !error ? (
          <p className="text-sm text-gray-500 text-center py-8">{t('jobs.adDesign.notFound')}</p>
        ) : null}
      </div>
    </Modal>
  );
}

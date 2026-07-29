import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';
import ErrorMessage from '../../ErrorMessage';
import { generateMetaCreativePreview, uploadMetaCreativeImage } from '../../../api/metaCampaignApi';
import type { ApiError } from '../../../lib/api';
import type { GeneratedMetaCreativePreview } from '../../../types/metaCampaign';

export interface MetaCreativeImageReady {
  imageHash: string;
  previewUrl: string | null;
  imageBase64: string;
  imageContentType: string;
}

interface Props {
  jobId: string;
  creativeMessage?: string;
  aiInstructions?: string;
  imageHash: string;
  imagePreviewUrl: string | null;
  generatedPreview: GeneratedMetaCreativePreview | null;
  onGeneratedPreviewChange: (preview: GeneratedMetaCreativePreview | null) => void;
  onImageReady: (image: MetaCreativeImageReady) => void;
  /** `meta` uploads to Meta Ads; `local` only keeps base64 for job ad design. */
  mode?: 'meta' | 'local';
}

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

function dataUrlToFile(dataUrl: string, contentType: string): File {
  const parts = dataUrl.split(',');
  if (parts.length < 2) throw new Error('Invalid image data');
  const base64 = parts[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const ext = extensionFromContentType(contentType);
  return new File([bytes], `meta-ai-preview.${ext}`, { type: contentType || 'image/png' });
}

function fileToBase64(file: File): Promise<{ base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const parsed = parseDataUrl(dataUrl);
      if (!parsed) {
        reject(new Error('Invalid image data'));
        return;
      }
      resolve({
        base64: parsed.base64,
        contentType: parsed.contentType || file.type || 'image/png',
      });
    };
    reader.onerror = () => reject(new Error('READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

export default function ImageUploadPreview({
  jobId,
  creativeMessage,
  aiInstructions,
  imageHash,
  imagePreviewUrl,
  generatedPreview,
  onGeneratedPreviewChange,
  onImageReady,
  mode = 'meta',
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [generating, setGenerating] = useState(false);
  const [uploadingGenerated, setUploadingGenerated] = useState(false);
  const [uploadingManual, setUploadingManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = generating || uploadingGenerated || uploadingManual;
  const isLocal = mode === 'local';
  const previewUrl = generatedPreview?.dataUrl ?? imagePreviewUrl;
  const dimensions = useMemo(() => {
    if (!generatedPreview) return null;
    if (!generatedPreview.width || !generatedPreview.height) return null;
    return `${generatedPreview.width}x${generatedPreview.height}`;
  }, [generatedPreview]);

  const runUpload = async (file: File) => {
    setUploadingManual(true);
    setError(null);
    try {
      if (isLocal) {
        const encoded = await fileToBase64(file);
        const preview = URL.createObjectURL(file);
        onGeneratedPreviewChange(null);
        onImageReady({
          imageHash: '',
          previewUrl: preview,
          imageBase64: encoded.base64,
          imageContentType: encoded.contentType,
        });
        return;
      }

      const [{ imageHash: hash }, encoded] = await Promise.all([
        uploadMetaCreativeImage(file),
        fileToBase64(file),
      ]);
      if (!hash) throw new Error(t('metaCampaign.creative.noHash'));
      const preview = URL.createObjectURL(file);
      onGeneratedPreviewChange(null);
      onImageReady({
        imageHash: hash,
        previewUrl: preview,
        imageBase64: encoded.base64,
        imageContentType: encoded.contentType,
      });
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('metaCampaign.creative.uploadFailed');
      setError(msg);
    } finally {
      setUploadingManual(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      setError(t('metaCampaign.creative.imageOnly'));
      return;
    }
    void runUpload(file);
  };

  const handleGeneratePreview = async () => {
    if (!jobId.trim()) {
      setError(t('metaCampaign.validation.jobRequired'));
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await generateMetaCreativePreview({
        jobId: jobId.trim(),
        creativeMessage: creativeMessage?.trim() || undefined,
        aiInstructions: aiInstructions?.trim() || undefined,
      });
      if (res.imageUrl) {
        if (res.imageHash) {
          // Some backends return an already-uploaded image + hash from this endpoint.
          onGeneratedPreviewChange(null);
          onImageReady({
            imageHash: res.imageHash,
            previewUrl: res.imageUrl,
            imageBase64: res.imageBase64 || '',
            imageContentType: res.contentType || 'image/png',
          });
          return;
        }
        onGeneratedPreviewChange({
          dataUrl: res.imageUrl,
          contentType: res.contentType || 'image/png',
          width: res.width,
          height: res.height,
          imagePrompt: res.imagePrompt,
          metaCreativeHint: res.metaCreativeHint,
        });
        return;
      }
      if (!res.imageBase64) throw new Error(t('metaCampaign.creative.demoFailed'));
      const dataUrl = `data:${res.contentType};base64,${res.imageBase64}`;
      onGeneratedPreviewChange({
        dataUrl,
        contentType: res.contentType,
        width: res.width,
        height: res.height,
        imagePrompt: res.imagePrompt,
        metaCreativeHint: res.metaCreativeHint,
      });
    } catch (e: unknown) {
      const err = e as ApiError;
      if (err?.status === 503) {
        setError(t('metaCampaign.creative.aiUnavailable'));
      } else if (err?.status === 400) {
        setError(err.message || t('metaCampaign.creative.aiValidation'));
      } else {
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('metaCampaign.creative.demoFailed');
        setError(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleUseGenerated = async () => {
    if (!generatedPreview) return;
    setUploadingGenerated(true);
    setError(null);
    try {
      const parsed = parseDataUrl(generatedPreview.dataUrl);
      if (isLocal) {
        onImageReady({
          imageHash: '',
          previewUrl: generatedPreview.dataUrl,
          imageBase64: parsed?.base64 || '',
          imageContentType: parsed?.contentType || generatedPreview.contentType || 'image/png',
        });
        return;
      }

      const file = dataUrlToFile(generatedPreview.dataUrl, generatedPreview.contentType);
      const { imageHash: hash } = await uploadMetaCreativeImage(file);
      if (!hash) throw new Error(t('metaCampaign.creative.noHash'));
      const preview = URL.createObjectURL(file);
      onImageReady({
        imageHash: hash,
        previewUrl: preview,
        imageBase64: parsed?.base64 || '',
        imageContentType: parsed?.contentType || generatedPreview.contentType || 'image/png',
      });
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('metaCampaign.creative.uploadFailed');
      setError(msg);
    } finally {
      setUploadingGenerated(false);
    }
  };

  const handleDownloadGenerated = () => {
    const src = generatedPreview?.dataUrl ?? previewUrl;
    if (!src) return;
    const ext = extensionFromContentType(generatedPreview?.contentType || 'image/png');
    const a = document.createElement('a');
    a.href = src;
    a.download = `nexthire-meta-ai-${Date.now()}.${ext}`;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-4">
      {error ? <ErrorMessage message={error} /> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy || !jobId.trim()} onClick={() => void handleGeneratePreview()}>
          <span className="inline-flex items-center gap-1.5">
            {generating ? (
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
                <path d="M19 14l1 2.3L22.3 17l-2.3 1L19 20.3l-1-2.3L15.7 17l2.3-1L19 14z" />
              </svg>
            )}
            <span>{generating ? t('metaCampaign.creative.working') : generatedPreview ? t('metaCampaign.creative.regenerate') : t('metaCampaign.creative.generateAi')}</span>
          </span>
        </Button>
        {generatedPreview ? (
          <Button type="button" variant="primary" size="sm" disabled={busy} onClick={() => void handleUseGenerated()}>
            {uploadingGenerated ? t('metaCampaign.creative.working') : t('metaCampaign.creative.useThisImage')}
          </Button>
        ) : null}
        {generatedPreview?.dataUrl ? (
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleDownloadGenerated}>
            <span className="inline-flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              {t('metaCampaign.creative.download')}
            </span>
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          {t('metaCampaign.creative.uploadManualInstead')}
        </Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 min-h-[200px] flex flex-col items-center justify-center">
        {generating ? (
          <div className="w-full space-y-4">
            <div className="relative h-40 w-full overflow-hidden rounded-lg border border-violet-100 bg-gradient-to-br from-violet-50 via-fuchsia-50 to-cyan-50">
              <div className="absolute -left-8 top-8 h-24 w-24 rounded-full bg-violet-300/50 blur-2xl animate-pulse" />
              <div className="absolute right-8 top-4 h-20 w-20 rounded-full bg-fuchsia-300/40 blur-2xl animate-pulse" />
              <div className="absolute bottom-6 right-16 h-16 w-16 rounded-full bg-cyan-300/45 blur-2xl animate-pulse" />
              <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.65)_48%,transparent_72%)] animate-[shimmer_1.8s_infinite]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.2s]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500 animate-bounce [animation-delay:-0.1s]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-bounce" />
                </div>
                <p className="text-xs font-medium text-violet-700">{t('metaCampaign.creative.working')}</p>
              </div>
            </div>
            <style>{`@keyframes shimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }`}</style>
            <div className="h-4 w-1/2 mx-auto rounded bg-gray-100 animate-pulse" />
            <div className="h-4 w-2/3 mx-auto rounded bg-gray-100 animate-pulse" />
          </div>
        ) : previewUrl || imageHash ? (
          <div className="w-full space-y-2">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="max-h-56 mx-auto rounded-lg object-contain border border-gray-100" />
            ) : (
              <p className="text-sm text-center text-gray-600">{t('metaCampaign.creative.hashOnlyPreview')}</p>
            )}
            {generatedPreview ? (
              <div className="space-y-1">
                {dimensions ? <p className="text-xs text-center text-gray-500">{dimensions}</p> : null}
                {generatedPreview.metaCreativeHint ? (
                  <p className="text-xs text-center text-gray-500">{generatedPreview.metaCreativeHint}</p>
                ) : null}
              </div>
            ) : null}
            {!isLocal ? (
              <p className="text-xs font-mono text-center text-gray-500 break-all">
                {t('metaCampaign.creative.imageHash')}: {imageHash || '—'}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">{t('metaCampaign.creative.noImageYet')}</p>
        )}
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import TextField from '../../TextField';
import SelectField from '../../SelectField';
import ImageUploadPreview from './ImageUploadPreview';
import type { GeneratedMetaCreativePreview, MetaCtaType } from '../../../types/metaCampaign';

interface Props {
  selectedJobId: string;
  adText: string;
  onAdText: (v: string) => void;
  ctaType: MetaCtaType;
  onCtaType: (v: MetaCtaType) => void;
  imageHash: string;
  imagePreviewUrl: string | null;
  generatedPreview: GeneratedMetaCreativePreview | null;
  onGeneratedPreviewChange: (preview: GeneratedMetaCreativePreview | null) => void;
  onImageReady: (imageHash: string, previewUrl: string | null) => void;
  fieldErrors: Record<string, string>;
}

export default function CampaignStepCreative({
  selectedJobId,
  adText,
  onAdText,
  ctaType,
  onCtaType,
  imageHash,
  imagePreviewUrl,
  generatedPreview,
  onGeneratedPreviewChange,
  onImageReady,
  fieldErrors,
}: Props) {
  const { t } = useTranslation();

  const ctaOpts: { value: MetaCtaType; label: string }[] = [
    { value: 'LEARN_MORE', label: 'LEARN_MORE' },
    { value: 'APPLY_NOW', label: 'APPLY_NOW' },
    { value: 'SIGN_UP', label: 'SIGN_UP' },
  ];

  return (
    <div className="space-y-6">
      <TextField
        label={t('metaCampaign.creative.adText')}
        value={adText}
        onChange={(e) => onAdText(e.target.value)}
        error={fieldErrors.adText}
      />
      <SelectField
        label={t('metaCampaign.creative.cta')}
        value={ctaType}
        onChange={(e) => onCtaType(e.target.value as MetaCtaType)}
        options={ctaOpts}
      />
      <div>
        <p className="text-sm font-medium text-gray-800 mb-2">{t('metaCampaign.creative.imageSection')}</p>
        <ImageUploadPreview
          jobId={selectedJobId}
          imageHash={imageHash}
          imagePreviewUrl={imagePreviewUrl}
          generatedPreview={generatedPreview}
          onGeneratedPreviewChange={onGeneratedPreviewChange}
          onImageReady={onImageReady}
        />
        {fieldErrors.imageHash ? <p className="mt-2 text-sm text-red-600">{fieldErrors.imageHash}</p> : null}
      </div>
    </div>
  );
}

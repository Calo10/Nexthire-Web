import { useTranslation } from 'react-i18next';
import TextField from '../../TextField';
import TextareaField from '../../TextareaField';
import ImageUploadPreview, { type MetaCreativeImageReady } from './ImageUploadPreview';
import type { GeneratedMetaCreativePreview } from '../../../types/metaCampaign';

interface Props {
  selectedJobId: string;
  creativeMessage: string;
  onCreativeMessage: (v: string) => void;
  aiInstructions: string;
  onAiInstructions: (v: string) => void;
  imageHash: string;
  imagePreviewUrl: string | null;
  generatedPreview: GeneratedMetaCreativePreview | null;
  onGeneratedPreviewChange: (preview: GeneratedMetaCreativePreview | null) => void;
  onImageReady: (image: MetaCreativeImageReady) => void;
  fieldErrors: Record<string, string>;
}

export default function CampaignStepCreative({
  selectedJobId,
  creativeMessage,
  onCreativeMessage,
  aiInstructions,
  onAiInstructions,
  imageHash,
  imagePreviewUrl,
  generatedPreview,
  onGeneratedPreviewChange,
  onImageReady,
  fieldErrors,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">{t('metaCampaign.creative.intro')}</p>
      <TextField
        label={t('metaCampaign.creative.message')}
        value={creativeMessage}
        onChange={(e) => onCreativeMessage(e.target.value)}
        error={fieldErrors.creativeMessage}
      />
      <div>
        <TextareaField
          label={t('metaCampaign.creative.aiInstructions')}
          value={aiInstructions}
          onChange={(e) => onAiInstructions(e.target.value)}
          placeholder={t('metaCampaign.creative.aiInstructionsPlaceholder')}
          rows={3}
        />
        <p className="mt-1.5 text-xs text-gray-500">{t('metaCampaign.creative.aiInstructionsHint')}</p>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-800 mb-2">{t('metaCampaign.creative.imageSection')}</p>
        <ImageUploadPreview
          jobId={selectedJobId}
          creativeMessage={creativeMessage}
          aiInstructions={aiInstructions}
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

import { useTranslation } from 'react-i18next';
import TextField from '../../TextField';
import ErrorMessage from '../../ErrorMessage';
import GeneratedUrlPreview from './GeneratedUrlPreview';
import type { MetaDestinationType } from '../../../types/metaCampaign';
import { buildPublicJobPostUrl, buildWhatsappDestinationUrl, resolveSiteOrigin } from '../../../lib/metaCampaignUrls';

interface Props {
  destinationType: MetaDestinationType;
  onDestinationType: (v: MetaDestinationType) => void;
  whatsappMessage: string;
  onWhatsappMessage: (v: string) => void;
  jobPostUrlOverride: string;
  onJobPostUrlOverride: (v: string) => void;
  orgSegment: string;
  jobId: string;
  whatsappConfigured: boolean;
  fieldErrors?: { url?: string; whatsapp?: string; destination?: string };
}

export default function CampaignStepDestination({
  destinationType,
  onDestinationType,
  whatsappMessage,
  onWhatsappMessage,
  jobPostUrlOverride,
  onJobPostUrlOverride,
  orgSegment,
  jobId,
  whatsappConfigured,
  fieldErrors,
}: Props) {
  const { t } = useTranslation();
  const origin = resolveSiteOrigin();
  const defaultJobUrl = buildPublicJobPostUrl(origin, orgSegment, jobId);
  const effectiveJobUrl = jobPostUrlOverride.trim() || defaultJobUrl;

  const waUrl = destinationType === 'whatsapp' ? buildWhatsappDestinationUrl(whatsappMessage) : '';
  const previewUrl = destinationType === 'whatsapp' ? waUrl : effectiveJobUrl;

  const errMsg = fieldErrors?.url || fieldErrors?.whatsapp || fieldErrors?.destination;

  return (
    <div className="space-y-6">
      {errMsg ? <ErrorMessage message={errMsg} /> : null}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-800 mb-2">{t('metaCampaign.destination.type')}</legend>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="dest"
            checked={destinationType === 'whatsapp'}
            onChange={() => onDestinationType('whatsapp')}
            className="text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-800">{t('metaCampaign.destination.whatsapp')}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="dest"
            checked={destinationType === 'job_post_url'}
            onChange={() => onDestinationType('job_post_url')}
            className="text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-800">{t('metaCampaign.destination.jobUrl')}</span>
        </label>
      </fieldset>

      {destinationType === 'whatsapp' ? (
        <div className="space-y-3">
          {!whatsappConfigured ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">{t('metaCampaign.destination.noWhatsappEnv')}</p>
          ) : null}
          <TextField
            label={t('metaCampaign.destination.message')}
            value={whatsappMessage}
            onChange={(e) => onWhatsappMessage(e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 break-all">{t('metaCampaign.destination.defaultUrlHint')}</p>
          <p className="text-xs font-mono text-gray-600 break-all">{defaultJobUrl}</p>
          <TextField
            label={t('metaCampaign.destination.urlOverride')}
            value={jobPostUrlOverride}
            onChange={(e) => onJobPostUrlOverride(e.target.value)}
            placeholder={defaultJobUrl}
          />
        </div>
      )}

      <GeneratedUrlPreview
        url={previewUrl}
        emptyMessage={
          destinationType === 'whatsapp' && !whatsappConfigured
            ? t('metaCampaign.destination.noWhatsappEnv')
            : t('metaCampaign.preview.noUrl')
        }
      />
    </div>
  );
}

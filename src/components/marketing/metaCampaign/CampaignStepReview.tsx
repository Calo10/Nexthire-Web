import { useTranslation } from 'react-i18next';
import type { Job } from '../../../types/dashboard';
import type { MetaDestinationType, MetaPlatformChoice } from '../../../types/metaCampaign';
import { jobCodeFromJob, platformsFromChoice } from '../../../types/metaCampaign';

interface Props {
  job: Job | null;
  jobCode: string;
  campaignName: string;
  dailyBudget: number;
  country: string;
  ageMin: number;
  ageMax: number;
  platformChoice: MetaPlatformChoice;
  destinationType: MetaDestinationType;
  destinationUrl: string;
  adText: string;
  ctaType: string;
  status: string;
  imagePreviewUrl: string | null;
  imageHash: string;
}

export default function CampaignStepReview({
  job,
  jobCode,
  campaignName,
  dailyBudget,
  country,
  ageMin,
  ageMax,
  platformChoice,
  destinationType,
  destinationUrl,
  adText,
  ctaType,
  status,
  imagePreviewUrl,
  imageHash,
}: Props) {
  const { t } = useTranslation();
  const platforms = platformsFromChoice(platformChoice).join(', ');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <ReviewRow label={t('metaCampaign.review.job')} value={job ? `${job.title} (${jobCode || jobCodeFromJob(job)})` : '—'} />
        <ReviewRow label={t('metaCampaign.review.campaignName')} value={campaignName} />
        <ReviewRow label={t('metaCampaign.review.budget')} value={String(dailyBudget)} />
        <ReviewRow
          label={t('metaCampaign.review.audience')}
          value={`${country} · ${ageMin}–${ageMax}`}
        />
        <ReviewRow label={t('metaCampaign.review.platforms')} value={platforms} />
        <ReviewRow label={t('metaCampaign.review.destination')} value={destinationType} />
        <ReviewRow label={t('metaCampaign.review.destinationUrl')} value={destinationUrl || '—'} mono />
        <ReviewRow label={t('metaCampaign.review.adText')} value={adText} />
        <ReviewRow label={t('metaCampaign.review.cta')} value={ctaType} />
        <ReviewRow label={t('metaCampaign.review.status')} value={status} />
        <ReviewRow label={t('metaCampaign.review.imageHash')} value={imageHash || '—'} mono />
      </div>
      {imagePreviewUrl ? (
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2">{t('metaCampaign.review.image')}</p>
          <img src={imagePreviewUrl} alt="" className="max-h-48 rounded-lg border border-gray-200" />
        </div>
      ) : imageHash ? (
        <p className="text-sm text-gray-600">{t('metaCampaign.review.imageFromMeta')}</p>
      ) : null}
    </div>
  );
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className={`sm:col-span-2 text-sm text-dark-text ${mono ? 'font-mono break-all' : ''}`}>{value}</dd>
    </div>
  );
}

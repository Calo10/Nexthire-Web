import { useTranslation } from 'react-i18next';
import type { Job } from '../../../types/dashboard';
import type { MetaDestinationType, MetaGeoSelection } from '../../../types/metaCampaign';
import {
  formatDailyBudgetUsd,
  formatMetaTargetingAgeRange,
  jobCodeFromJob,
  META_EMPLOYMENT_SPECIAL_AD_CATEGORIES,
  specialAdCategoriesRequireFixedAge,
  specialAdCategoryCountryFromGeo,
} from '../../../types/metaCampaign';

interface Props {
  job: Job | null;
  jobCode: string;
  destinationType: MetaDestinationType;
  destinationLabel: string;
  campaignName: string;
  objectiveLabel: string;
  dailyBudget: number;
  geoSelection: MetaGeoSelection | null;
  ageMin: number;
  ageMax: number;
  platformsLabel: string;
  destinationUrl: string;
  creativeMessage: string;
  statusLabel: string;
  billingLabel: string;
  optimizationLabel: string;
  bidLabel: string;
  imagePreviewUrl: string | null;
  imageReady: boolean;
}

export default function CampaignStepReview({
  job,
  jobCode,
  destinationType,
  destinationLabel,
  campaignName,
  objectiveLabel,
  dailyBudget,
  geoSelection,
  ageMin,
  ageMax,
  platformsLabel,
  destinationUrl,
  creativeMessage,
  statusLabel,
  billingLabel,
  optimizationLabel,
  bidLabel,
  imagePreviewUrl,
  imageReady,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">{t('metaCampaign.review.intro')}</p>
      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <ReviewRow label={t('metaCampaign.review.job')} value={job ? `${job.title} (${jobCode || jobCodeFromJob(job)})` : '—'} />
        <ReviewRow label={t('metaCampaign.review.destination')} value={destinationLabel} />
        <ReviewRow label={t('metaCampaign.review.campaignName')} value={campaignName} />
        <ReviewRow label={t('metaCampaign.review.objective')} value={objectiveLabel} />
        <ReviewRow label={t('metaCampaign.review.budget')} value={formatDailyBudgetUsd(dailyBudget)} />
        <ReviewRow label={t('metaCampaign.review.location')} value={geoSelection?.label ?? '—'} />
        {specialAdCategoryCountryFromGeo(geoSelection).length ? (
          <ReviewRow
            label={t('metaCampaign.review.specialAdCategoryCountry')}
            value={specialAdCategoryCountryFromGeo(geoSelection).join(', ')}
          />
        ) : null}
        {geoSelection?.radiusMiles ? (
          <ReviewRow
            label={t('metaCampaign.review.radius')}
            value={`${geoSelection.radiusMiles} mi`}
          />
        ) : null}
        <ReviewRow
          label={t('metaCampaign.review.audience')}
          value={formatMetaTargetingAgeRange(
            ageMin,
            ageMax,
            specialAdCategoriesRequireFixedAge(META_EMPLOYMENT_SPECIAL_AD_CATEGORIES)
          )}
        />
        <ReviewRow label={t('metaCampaign.review.platforms')} value={platformsLabel} />
        <ReviewRow label={t('metaCampaign.review.status')} value={statusLabel} />
        {destinationType === 'job_post_url' ? (
          <ReviewRow label={t('metaCampaign.review.destinationUrl')} value={destinationUrl || '—'} mono />
        ) : (
          <ReviewRow label={t('metaCampaign.review.whatsappLink')} value={destinationUrl || '—'} mono />
        )}
        <ReviewRow label={t('metaCampaign.review.creativeMessage')} value={creativeMessage} />
        <ReviewRow label={t('metaCampaign.review.advancedSummary')} value={`${billingLabel} · ${optimizationLabel} · ${bidLabel}`} />
      </div>
      {imagePreviewUrl ? (
        <div>
          <p className="text-sm font-medium text-gray-800 mb-2">{t('metaCampaign.review.image')}</p>
          <img src={imagePreviewUrl} alt="" className="max-h-48 rounded-lg border border-gray-200" />
        </div>
      ) : imageReady ? (
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

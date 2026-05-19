import { useTranslation } from 'react-i18next';
import type { MetaCampaignCreateResult } from '../../../types/metaCampaign';

interface Props {
  result: MetaCampaignCreateResult;
}

export default function CampaignCreationResult({ result }: Props) {
  const { t } = useTranslation();
  const { campaignId, adSetId, creativeId, adId, adAccountId } = result;

  const manageUrl = adAccountId
    ? `https://adsmanager.facebook.com/adsmanager/manage/ads?act=${encodeURIComponent(adAccountId)}`
    : '';

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-emerald-900">{t('metaCampaign.result.title')}</h3>
      <ul className="space-y-2 text-sm">
        <li>
          <span className="text-gray-600">{t('metaCampaign.result.campaignId')}</span>{' '}
          <code className="font-mono text-xs bg-white/80 px-1 rounded">{campaignId || '—'}</code>
        </li>
        <li>
          <span className="text-gray-600">{t('metaCampaign.result.adSetId')}</span>{' '}
          <code className="font-mono text-xs bg-white/80 px-1 rounded">{adSetId || '—'}</code>
        </li>
        <li>
          <span className="text-gray-600">{t('metaCampaign.result.creativeId')}</span>{' '}
          <code className="font-mono text-xs bg-white/80 px-1 rounded">{creativeId || '—'}</code>
        </li>
        <li>
          <span className="text-gray-600">{t('metaCampaign.result.adId')}</span>{' '}
          <code className="font-mono text-xs bg-white/80 px-1 rounded">{adId || '—'}</code>
        </li>
      </ul>
      {manageUrl ? (
        <a
          href={manageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          {t('metaCampaign.result.openAdsManager')}
        </a>
      ) : null}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import ErrorMessage from '../ErrorMessage';
import Button from '../Button';
import { getMetaCampaignInsights, metaErrorMessageFromUnknown } from '../../api/metaCampaignApi';
import type { MetaCampaignInsights } from '../../types/metaCampaign';
import CampaignInsightsMetricsView from './CampaignInsightsMetricsView';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaignRef: string | number | null;
  campaignName?: string | null;
  /** NextHire leads for this campaign — used for Cost per Candidate. */
  leadsCount?: number | null;
}

export default function CampaignInsightsModal({
  isOpen,
  onClose,
  campaignRef,
  campaignName,
  leadsCount,
}: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<MetaCampaignInsights | null>(null);

  useEffect(() => {
    if (!isOpen || campaignRef == null) {
      setInsights(null);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMetaCampaignInsights(campaignRef, 'maximum');
        if (!cancelled) setInsights(data);
      } catch (e: unknown) {
        if (!cancelled) {
          setInsights(null);
          setError(
            metaErrorMessageFromUnknown(e) ??
              (e && typeof e === 'object' && 'message' in e
                ? String((e as { message: string }).message)
                : t('sourcing.errors.loadInsights'))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, campaignRef, t]);

  const titleName = insights?.campaignName || campaignName || t('sourcing.campaign.insights.untitled');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sourcing.campaign.insights.title')}
      subtitle={titleName}
      width="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          {t('common.actions.close')}
        </Button>
      }
    >
      <div className="space-y-5">
        {error ? <ErrorMessage message={error} /> : null}

        {loading ? (
          <div className="space-y-3">
            <div className="h-52 rounded-2xl bg-purple-50 animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-purple-50 animate-pulse" />
              ))}
            </div>
          </div>
        ) : null}

        {!loading && insights ? (
          <>
            {insights.metaCampaignId ? (
              <div className="text-xs text-gray-500">
                {t('sourcing.campaign.externalCampaignId')}: {insights.metaCampaignId}
              </div>
            ) : null}
            <CampaignInsightsMetricsView
              insights={insights}
              leadsCount={leadsCount}
              gradientIdPrefix="modal"
            />
          </>
        ) : null}
      </div>
    </Modal>
  );
}

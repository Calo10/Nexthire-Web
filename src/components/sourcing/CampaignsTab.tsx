import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import {
  deleteMetaCampaign,
  getMetaAdAccountStatus,
  listMetaCampaignInsights,
  metaCampaignInsightsRef,
  metaCampaignRef,
  metaErrorMessageFromUnknown,
  pauseMetaCampaign,
} from '../../api/metaCampaignApi';
import { deleteSourcingCampaign, getSourcingCampaigns, updateSourcingCampaignStatus } from '../../api/sourcingApi';
import type { SourcingCampaign } from '../../types/sourcing';
import type { MetaAdAccountStatus, MetaCampaignInsights } from '../../types/metaCampaign';
import type { Job } from '../../types/dashboard';
import { normalizeSourcingPlatformCode, SOURCING_PLATFORM_CODES } from '../../lib/sourcingPlatformCodes';
import CampaignModal from './CampaignModal';
import CampaignInsightsModal from './CampaignInsightsModal';
import LeadStatusPill from './LeadStatusPill';
import SourceTypeBrandLogo from './SourceTypeBrandLogo';
import HoverTooltip from '../HoverTooltip';
import { formatMoney, computeCostPerCandidate } from './sourcingUtils';

interface Props {
  shouldFetch: boolean;
  refreshKey: number;
  jobs: Job[];
  metaAdsReady: boolean;
  metaAdsLoading?: boolean;
  twilioReady: boolean;
  twilioLoading?: boolean;
  onGoToSources?: () => void;
  onToastSuccess: (msg: string) => void;
  onToastError: (msg: string) => void;
  onOpenCreateCampaign: (mode?: 'full' | 'whatsapp-apply') => void;
}

function campaignPlatformCode(platform: string | null | undefined): string {
  return normalizeSourcingPlatformCode(platform);
}

function isMetaAdsCampaign(c: SourcingCampaign): boolean {
  const platform = (c.platform || '').toLowerCase();
  return platform === 'meta_ads' || platform === 'meta' || Boolean(c.externalCampaignId);
}

function campaignPlatformLabel(code: string, t: (key: string) => string): string {
  const normalized = code.toLowerCase();
  if ((SOURCING_PLATFORM_CODES as readonly string[]).includes(normalized)) {
    return t(`sourcing.campaign.platforms.${normalized}`);
  }
  return code;
}

function formatCount(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(undefined).format(n);
}

function insightsKey(c: SourcingCampaign): string | null {
  if (c.id != null && String(c.id).trim()) return String(c.id);
  if (c.externalCampaignId != null && String(c.externalCampaignId).trim()) {
    return String(c.externalCampaignId);
  }
  return null;
}

export default function CampaignsTab({
  shouldFetch,
  refreshKey,
  jobs,
  metaAdsReady,
  metaAdsLoading = false,
  twilioReady,
  twilioLoading = false,
  onGoToSources,
  onToastSuccess,
  onToastError,
  onOpenCreateCampaign,
}: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<SourcingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | number | null>(null);
  const [insightsTarget, setInsightsTarget] = useState<{
    ref: string | number;
    name?: string | null;
    leadsCount?: number | null;
  } | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [insightsByKey, setInsightsByKey] = useState<Record<string, MetaCampaignInsights>>({});
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState<MetaAdAccountStatus | null>(null);
  const [accountStatusLoading, setAccountStatusLoading] = useState(false);
  const [accountStatusError, setAccountStatusError] = useState<string | null>(null);

  const loadAccountStatus = useCallback(async () => {
    if (!shouldFetch || !metaAdsReady) {
      setAccountStatus(null);
      setAccountStatusError(null);
      return;
    }
    setAccountStatusLoading(true);
    setAccountStatusError(null);
    try {
      const status = await getMetaAdAccountStatus();
      setAccountStatus(status);
    } catch (e: unknown) {
      setAccountStatus(null);
      setAccountStatusError(
        metaErrorMessageFromUnknown(e) ??
          (e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : t('sourcing.metaAds.accountStatus.loadError'))
      );
    } finally {
      setAccountStatusLoading(false);
    }
  }, [shouldFetch, metaAdsReady, t]);

  const loadInsights = useCallback(async () => {
    if (!shouldFetch || !metaAdsReady) {
      setInsightsByKey({});
      return;
    }
    setInsightsLoading(true);
    try {
      const res = await listMetaCampaignInsights('maximum');
      const map: Record<string, MetaCampaignInsights> = {};
      for (const row of res.items) {
        if (row.localRecordId) map[row.localRecordId] = row;
        if (row.metaCampaignId) map[row.metaCampaignId] = row;
      }
      setInsightsByKey(map);
    } catch {
      setInsightsByKey({});
    } finally {
      setInsightsLoading(false);
    }
  }, [shouldFetch, metaAdsReady]);

  const load = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getSourcingCampaigns();
      setItems(res.items);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : t('sourcing.errors.loadCampaigns');
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, t]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights, refreshKey, items.length]);

  useEffect(() => {
    loadAccountStatus();
  }, [loadAccountStatus, refreshKey]);

  const accountStatusTone = useMemo(() => {
    if (!accountStatus) return null;
    if (accountStatus.isHealthy && !accountStatus.isPaymentIssue) {
      return {
        wrap: 'border-emerald-200 bg-emerald-50 text-emerald-800',
        dot: 'bg-emerald-500',
      };
    }
    if (accountStatus.isPaymentIssue || accountStatus.statusKey === 'unsettled' || accountStatus.statusKey === 'grace') {
      return {
        wrap: 'border-amber-200 bg-amber-50 text-amber-900',
        dot: 'bg-amber-500',
      };
    }
    return {
      wrap: 'border-red-200 bg-red-50 text-red-800',
      dot: 'bg-red-500',
    };
  }, [accountStatus]);

  const jobTitleById = (id: unknown) => {
    const s = id != null ? String(id) : '';
    const j = jobs.find((x) => String(x.id) === s);
    return j?.title || '—';
  };

  const insightFor = useMemo(
    () => (c: SourcingCampaign) => {
      const key = insightsKey(c);
      if (!key) return null;
      return (
        insightsByKey[key] ??
        (c.externalCampaignId ? insightsByKey[String(c.externalCampaignId)] : null) ??
        null
      );
    },
    [insightsByKey]
  );

  const togglePause = async (c: SourcingCampaign) => {
    const rowId = c.id != null ? String(c.id) : '';
    const ref = metaCampaignRef(c);
    if (!rowId && !ref) return;
    const cur = (c.status || '').toLowerCase();
    const isPaused = cur === 'paused';
    const isMeta = isMetaAdsCampaign(c);
    setPendingId(rowId || String(ref));
    try {
      if (isMeta && ref) {
        if (isPaused) {
          if (rowId) await updateSourcingCampaignStatus(rowId, { status: 'active' });
        } else {
          await pauseMetaCampaign(ref);
        }
      } else if (rowId) {
        const next = cur === 'active' || cur === 'running' ? 'paused' : 'active';
        await updateSourcingCampaignStatus(rowId, { status: next });
      }
      onToastSuccess(isPaused ? t('sourcing.toast.campaignActivated') : t('sourcing.toast.campaignPaused'));
      await load();
      await loadInsights();
    } catch (e: unknown) {
      onToastError(
        metaErrorMessageFromUnknown(e) ??
          (e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : t('sourcing.errors.action'))
      );
    } finally {
      setPendingId(null);
    }
  };

  const removeCampaign = async (c: SourcingCampaign) => {
    const rowId = c.id != null ? String(c.id) : '';
    const ref = metaCampaignRef(c);
    if (!rowId && !ref) return;
    const label = (c.name || '').trim() || t('sourcing.campaign.deleteUnnamed');
    const ok = window.confirm(t('sourcing.campaign.confirmDelete', { name: label }));
    if (!ok) return;
    setPendingId(rowId || String(ref));
    try {
      if (isMetaAdsCampaign(c) && ref) {
        await deleteMetaCampaign(ref);
      } else if (rowId) {
        await deleteSourcingCampaign(rowId);
      }
      if (viewId != null && rowId && String(viewId) === rowId) setViewId(null);
      onToastSuccess(t('sourcing.toast.campaignDeleted'));
      await load();
      await loadInsights();
    } catch (e: unknown) {
      onToastError(
        metaErrorMessageFromUnknown(e) ??
          (e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : t('sourcing.errors.deleteCampaign'))
      );
    } finally {
      setPendingId(null);
    }
  };

  const metaCreateDisabled = metaAdsLoading || !metaAdsReady;
  const showMetaTooltip = !metaAdsReady && !metaAdsLoading;

  const metaTooltipContent = (
    <>
      {t('sourcing.metaAds.configureRequired')}
      {onGoToSources ? (
        <>
          {' '}
          <button
            type="button"
            className="font-medium text-violet-300 underline hover:text-white"
            onClick={onGoToSources}
          >
            {t('sourcing.metaAds.goToSources')}
          </button>
        </>
      ) : null}
    </>
  );

  const metaCreateButton = (tooltipAlign: 'center' | 'end' = 'end') => (
    <HoverTooltip show={showMetaTooltip} content={metaTooltipContent} align={tooltipAlign}>
      <Button
        variant="primary"
        size="md"
        onClick={() => onOpenCreateCampaign('full')}
        disabled={metaCreateDisabled}
        className={`disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:opacity-45 ${
          metaCreateDisabled ? 'pointer-events-none' : ''
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('sourcing.header.createCampaign')}
        </span>
      </Button>
    </HoverTooltip>
  );

  const whatsappCreateDisabled = twilioLoading || !twilioReady;
  const showWhatsappTooltip = !twilioReady && !twilioLoading;

  const whatsappTooltipContent = (
    <>
      {t('sourcing.twilio.configureRequired')}
      {onGoToSources ? (
        <>
          {' '}
          <button
            type="button"
            className="font-medium text-violet-300 underline hover:text-white"
            onClick={onGoToSources}
          >
            {t('sourcing.twilio.goToSources')}
          </button>
        </>
      ) : null}
    </>
  );

  const whatsappCreateButton = (tooltipAlign: 'center' | 'end' = 'end') => (
    <HoverTooltip show={showWhatsappTooltip} content={whatsappTooltipContent} align={tooltipAlign}>
      <Button
        variant="outline"
        size="md"
        onClick={() => onOpenCreateCampaign('whatsapp-apply')}
        disabled={whatsappCreateDisabled}
        className={`disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:opacity-45 ${
          whatsappCreateDisabled ? 'pointer-events-none' : ''
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden>
            <path
              fill="#25D366"
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
            />
          </svg>
          {t('sourcing.header.createWhatsAppCampaign')}
        </span>
      </Button>
    </HoverTooltip>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          {metaAdsReady ? (
            accountStatusLoading && !accountStatus ? (
              <div className="h-14 w-full max-w-md rounded-xl border border-purple-100 bg-white/80 animate-pulse" />
            ) : accountStatus && accountStatusTone ? (
              <div
                className={`inline-flex max-w-xl flex-col gap-1 rounded-xl border px-3.5 py-2.5 shadow-sm ${accountStatusTone.wrap}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${accountStatusTone.dot}`} />
                  <span className="text-sm font-semibold">
                    {t('sourcing.metaAds.accountStatus.title')}:{' '}
                    {t(`sourcing.metaAds.accountStatus.keys.${accountStatus.statusKey}`, {
                      defaultValue: accountStatus.statusLabel,
                    })}
                  </span>
                </div>
                <p className="text-xs opacity-90 pl-4.5">
                  {accountStatus.name || accountStatus.adAccountId}
                  {accountStatus.isPaymentIssue
                    ? ` · ${accountStatus.disableReasonLabel || t('sourcing.metaAds.accountStatus.paymentIssue')}`
                    : accountStatus.disableReasonLabel
                      ? ` · ${accountStatus.disableReasonLabel}`
                      : ''}
                </p>
                {(accountStatus.balance != null || accountStatus.amountSpent != null) && (
                  <p className="text-xs opacity-80 pl-4.5 tabular-nums">
                    {accountStatus.amountSpent != null
                      ? `${t('sourcing.metaAds.accountStatus.spent')}: ${formatMoney(accountStatus.amountSpent, accountStatus.currency)}`
                      : null}
                    {accountStatus.amountSpent != null && accountStatus.balance != null ? ' · ' : null}
                    {accountStatus.balance != null
                      ? `${t('sourcing.metaAds.accountStatus.balance')}: ${formatMoney(accountStatus.balance, accountStatus.currency)}`
                      : null}
                  </p>
                )}
              </div>
            ) : accountStatusError ? (
              <div className="inline-flex max-w-xl items-start gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-600 shadow-sm">
                <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-gray-400 shrink-0" />
                <span>
                  {t('sourcing.metaAds.accountStatus.unavailable')}: {accountStatusError}
                </span>
              </div>
            ) : null
          ) : !metaAdsLoading ? (
            <div className="inline-flex max-w-xl items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span>
                {t('sourcing.metaAds.configureRequired')}
                {onGoToSources ? (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="font-medium underline hover:no-underline"
                      onClick={onGoToSources}
                    >
                      {t('sourcing.metaAds.goToSources')}
                    </button>
                  </>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end items-start gap-2">
          {whatsappCreateButton('end')}
          {metaCreateButton('end')}
        </div>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/60 border border-purple-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-purple-200 bg-white/60">
          <h3 className="text-lg font-semibold text-dark-text mb-2">{t('sourcing.empty.noCampaignsTitle')}</h3>
          <p className="text-sm text-gray-600 mb-6">{t('sourcing.empty.noCampaignsSubtitle')}</p>
          <div className="flex flex-wrap justify-center items-start gap-2">
            {whatsappCreateButton('center')}
            {metaCreateButton('center')}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-purple-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-purple-50/80 text-left text-gray-600 border-b border-purple-100">
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.name')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.job')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.platform')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.dailyBudget')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.table.status')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.spend')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.impressions')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.reach')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.linkClicks')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.costPerClick')}</th>
                  <th
                    className="px-4 py-3 font-semibold"
                    title={t('sourcing.campaign.table.leadsHint')}
                  >
                    {t('sourcing.campaign.table.leads')}
                  </th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.dashboard.costPerCandidate')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('sourcing.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const id = c.id != null ? String(c.id) : '';
                  const busy = pendingId === id;
                  const platformCode = campaignPlatformCode(c.platform);
                  const platformLabel = platformCode ? campaignPlatformLabel(platformCode, t) : '';
                  const isMeta = isMetaAdsCampaign(c);
                  const metrics = insightFor(c);
                  const dbLeads = c.leadsCount ?? c.leads;
                  const leadsNum =
                    dbLeads != null && Number.isFinite(Number(dbLeads))
                      ? Number(dbLeads)
                      : metrics?.metaLeads != null && Number.isFinite(Number(metrics.metaLeads))
                        ? Number(metrics.metaLeads)
                        : null;
                  const leads = leadsNum != null ? formatCount(leadsNum) : '—';
                  const costPerCandidate = computeCostPerCandidate(metrics?.spend, leadsNum);
                  const insightsRef = metaCampaignInsightsRef(c);

                  return (
                    <tr
                      key={id || String(c.externalCampaignId)}
                      className="border-b border-gray-100 hover:bg-purple-50/40"
                    >
                      <td className="px-4 py-3 font-medium text-dark-text">{c.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{c.jobTitle || jobTitleById(c.jobId)}</td>
                      <td className="px-4 py-3">
                        {platformCode ? (
                          <div className="flex items-center" title={platformLabel}>
                            <SourceTypeBrandLogo
                              sourceTypeCode={platformCode}
                              displayName={platformLabel}
                              size="xs"
                            />
                          </div>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {c.dailyBudget != null ? `$${Number(c.dailyBudget).toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <LeadStatusPill status={c.status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {isMeta && insightsLoading && !metrics ? '…' : formatMoney(metrics?.spend)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {isMeta && insightsLoading && !metrics ? '…' : formatCount(metrics?.impressions)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {isMeta && insightsLoading && !metrics ? '…' : formatCount(metrics?.reach)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {isMeta && insightsLoading && !metrics
                          ? '…'
                          : formatCount(metrics?.inlineLinkClicks)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {isMeta && insightsLoading && !metrics
                          ? '…'
                          : formatMoney(metrics?.costPerInlineLinkClick ?? metrics?.cpc)}
                      </td>
                      <td className="px-4 py-3">{leads}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {isMeta && insightsLoading && !metrics ? '…' : formatMoney(costPerCandidate)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex flex-wrap justify-end gap-1">
                          {isMeta && insightsRef ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="!py-1 !px-2"
                              onClick={() =>
                                setInsightsTarget({
                                  ref: insightsRef,
                                  name: c.name,
                                  leadsCount: leadsNum,
                                })
                              }
                              disabled={busy}
                            >
                              {t('sourcing.campaign.insights.details')}
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            className="!py-1 !px-2"
                            onClick={() => c.id != null && setViewId(c.id)}
                            disabled={busy}
                          >
                            {t('sourcing.actions.view')}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="!py-1 !px-2"
                            onClick={() => togglePause(c)}
                            disabled={busy}
                          >
                            {(c.status || '').toLowerCase() === 'paused'
                              ? t('sourcing.campaign.activate')
                              : t('sourcing.campaign.pause')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="!py-1 !px-2 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => void removeCampaign(c)}
                            disabled={busy}
                          >
                            {t('sourcing.campaign.delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CampaignModal
        isOpen={viewId != null}
        onClose={() => setViewId(null)}
        jobs={jobs}
        campaignId={viewId}
        onSuccess={() => {}}
      />
      <CampaignInsightsModal
        isOpen={insightsTarget != null}
        onClose={() => setInsightsTarget(null)}
        campaignRef={insightsTarget?.ref ?? null}
        campaignName={insightsTarget?.name}
        leadsCount={insightsTarget?.leadsCount}
      />
    </div>
  );
}

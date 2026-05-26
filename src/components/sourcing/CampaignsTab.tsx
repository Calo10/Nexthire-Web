import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import {
  deleteMetaCampaign,
  metaCampaignRef,
  metaErrorMessageFromUnknown,
  pauseMetaCampaign,
} from '../../api/metaCampaignApi';
import { deleteSourcingCampaign, getSourcingCampaigns, updateSourcingCampaignStatus } from '../../api/sourcingApi';
import type { SourcingCampaign } from '../../types/sourcing';
import type { Job } from '../../types/dashboard';
import { normalizeSourcingPlatformCode, SOURCING_PLATFORM_CODES } from '../../lib/sourcingPlatformCodes';
import CampaignModal from './CampaignModal';
import LeadStatusPill from './LeadStatusPill';
import SourceTypeBrandLogo from './SourceTypeBrandLogo';

interface Props {
  shouldFetch: boolean;
  refreshKey: number;
  jobs: Job[];
  onToastSuccess: (msg: string) => void;
  onToastError: (msg: string) => void;
  onOpenCreateCampaign: (mode?: 'full' | 'whatsapp-apply') => void;
}

function campaignPlatformCode(platform: string | null | undefined): string {
  return normalizeSourcingPlatformCode(platform);
}

function isMetaAdsCampaign(c: SourcingCampaign): boolean {
  const platform = (c.platform || '').toLowerCase();
  return platform === 'meta_ads' || Boolean(c.externalCampaignId);
}

function campaignPlatformLabel(code: string, t: (key: string) => string): string {
  const normalized = code.toLowerCase();
  if ((SOURCING_PLATFORM_CODES as readonly string[]).includes(normalized)) {
    return t(`sourcing.campaign.platforms.${normalized}`);
  }
  return code;
}

export default function CampaignsTab({
  shouldFetch,
  refreshKey,
  jobs,
  onToastSuccess,
  onToastError,
  onOpenCreateCampaign,
}: Props) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<SourcingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | number | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

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
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.loadCampaigns');
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, t]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const jobTitleById = (id: unknown) => {
    const s = id != null ? String(id) : '';
    const j = jobs.find((x) => String(x.id) === s);
    return j?.title || '—';
  };

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
    } catch (e: unknown) {
      onToastError(metaErrorMessageFromUnknown(e) ?? (e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.action')));
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
    } catch (e: unknown) {
      onToastError(
        metaErrorMessageFromUnknown(e) ??
          (e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.deleteCampaign'))
      );
    } finally {
      setPendingId(null);
    }
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(i18n.language);
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" size="md" onClick={() => onOpenCreateCampaign('whatsapp-apply')}>
          <span className="flex items-center gap-2">
            <img src="https://cdn.simpleicons.org/whatsapp" alt="" className="w-5 h-5" />
            {t('sourcing.header.createWhatsAppCampaign')}
          </span>
        </Button>
        <Button variant="primary" size="md" onClick={() => onOpenCreateCampaign('full')}>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('sourcing.header.createCampaign')}
          </span>
        </Button>
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
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => onOpenCreateCampaign('whatsapp-apply')}>
              {t('sourcing.header.createWhatsAppCampaign')}
            </Button>
            <Button variant="primary" onClick={() => onOpenCreateCampaign('full')}>
              {t('sourcing.header.createCampaign')}
            </Button>
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
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.leads')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.start')}</th>
                  <th className="px-4 py-3 font-semibold">{t('sourcing.campaign.table.end')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('sourcing.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => {
                  const id = c.id != null ? String(c.id) : '';
                  const busy = pendingId === id;
                  const leads = c.leadsCount ?? c.leads ?? '—';
                  const platformCode = campaignPlatformCode(c.platform);
                  const platformLabel = platformCode ? campaignPlatformLabel(platformCode, t) : '';
                  return (
                    <tr key={id} className="border-b border-gray-100 hover:bg-purple-50/40">
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
                      <td className="px-4 py-3">{leads}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.startDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.endDate)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex flex-wrap justify-end gap-1">
                          <Button variant="outline" size="sm" className="!py-1 !px-2" onClick={() => c.id != null && setViewId(c.id)} disabled={busy}>
                            {t('sourcing.actions.view')}
                          </Button>
                          <Button variant="secondary" size="sm" className="!py-1 !px-2" onClick={() => togglePause(c)} disabled={busy}>
                            {(c.status || '').toLowerCase() === 'paused' ? t('sourcing.campaign.activate') : t('sourcing.campaign.pause')}
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

      <CampaignModal isOpen={viewId != null} onClose={() => setViewId(null)} jobs={jobs} campaignId={viewId} onSuccess={() => {}} />
    </div>
  );
}

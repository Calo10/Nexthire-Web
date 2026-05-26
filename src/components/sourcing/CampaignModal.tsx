import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../Modal';
import Button from '../Button';
import TextField from '../TextField';
import SelectField from '../SelectField';
import ErrorMessage from '../ErrorMessage';
import { createSourcingCampaign, getSourcingCampaign } from '../../api/sourcingApi';
import type { Job } from '../../types/dashboard';
import type { SourcingCampaign } from '../../types/sourcing';
import { SOURCING_PLATFORM_CODES, sourcingPlatformSelectLabels } from '../../lib/sourcingPlatformCodes';
import LeadStatusPill from './LeadStatusPill';
import SourceTypeBrandLogo from './SourceTypeBrandLogo';
import {
  buildWhatsappMeUrl,
  jobPostRef,
  parseJobIdFromWhatsappLandingUrl,
  parseJobTitleFromWhatsappAutoName,
  sourcingWhatsAppPhoneFromEnv,
} from '../../lib/sourcingWhatsAppApplyLink';

function strId(v: unknown): string {
  if (v == null) return '';
  const s = String(v).trim();
  return s;
}

/** Backend may return camelCase, PascalCase, snake_case, or a nested `job` object. */
function pickJobIdFromCampaign(c: unknown): string {
  if (!c || typeof c !== 'object') return '';
  const r = c as Record<string, unknown>;
  const nestedId = (o: unknown): string => {
    if (!o || typeof o !== 'object' || o === null) return '';
    const j = o as Record<string, unknown>;
    return strId(j.id) || strId(j.Id);
  };
  return (
    strId(r.jobId) ||
    strId(r.JobId) ||
    strId(r.jobID) ||
    strId(r.JobID) ||
    strId(r.job_id) ||
    nestedId(r.job) ||
    nestedId(r.Job) ||
    ''
  );
}

function pickJobTitleFromCampaign(c: unknown): string | null {
  if (!c || typeof c !== 'object') return null;
  const r = c as Record<string, unknown>;
  const pick = (v: unknown) => {
    const s = strId(v);
    return s || null;
  };
  const nestedTitle = (o: unknown): string | null => {
    if (!o || typeof o !== 'object' || o === null) return null;
    const j = o as Record<string, unknown>;
    return pick(j.title) || pick(j.Title) || pick(j.name) || pick(j.Name);
  };
  return pick(r.jobTitle) || pick(r.JobTitle) || nestedTitle(r.job) || nestedTitle(r.Job);
}

function isWhatsappLandingUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return u.includes('wa.me') || u.includes('api.whatsapp.com');
}

function campaignPlatformLabel(code: string, t: (key: string) => string): string {
  const normalized = code.toLowerCase();
  if ((SOURCING_PLATFORM_CODES as readonly string[]).includes(normalized)) {
    return t(`sourcing.campaign.platforms.${normalized}`);
  }
  return code;
}

function formatCampaignDateTime(iso: string | null | undefined, locale: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  campaignId?: string | number | null;
  /** When `whatsapp-apply`, only the job is required; platform is fixed to WhatsApp. */
  createMode?: 'full' | 'whatsapp-apply';
  onSuccess: () => void;
}

export default function CampaignModal({ isOpen, onClose, jobs, campaignId, createMode = 'full', onSuccess }: Props) {
  const { t, i18n } = useTranslation();
  const readOnly = !!campaignId;
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  /** Title returned with campaign detail when the job is not in `jobs[]`. */
  const [viewJobTitle, setViewJobTitle] = useState<string | null>(null);
  const [loadedCampaign, setLoadedCampaign] = useState<SourcingCampaign | null>(null);

  const [form, setForm] = useState({
    jobId: '',
    name: '',
    platform: '',
    dailyBudget: '',
    totalBudget: '',
    currency: 'USD',
    startDate: '',
    endDate: '',
    landingPageUrl: '',
    trackingCode: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setSubmitError(null);
    setLoadError(null);
    setLinkCopied(false);
    if (!campaignId) {
      setViewJobTitle(null);
      setLoadedCampaign(null);
      setForm({
        jobId: '',
        name: '',
        platform: createMode === 'whatsapp-apply' ? 'whatsapp' : '',
        dailyBudget: '',
        totalBudget: '',
        currency: 'USD',
        startDate: '',
        endDate: '',
        landingPageUrl: '',
        trackingCode: '',
      });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const c = await getSourcingCampaign(campaignId);
        if (cancelled || !c) return;
        setLoadedCampaign(c);
        const landing = String(c.landingPageUrl || '').trim();
        const campaignName = String(c.name || '');
        let jid = pickJobIdFromCampaign(c);
        let jt = pickJobTitleFromCampaign(c);
        if (!jid && landing) {
          jid = parseJobIdFromWhatsappLandingUrl(landing);
        }
        if (!jt) {
          jt = parseJobTitleFromWhatsappAutoName(campaignName);
        }
        setViewJobTitle(jt);
        setForm({
          jobId: jid,
          name: campaignName,
          platform: String(c.platform || ''),
          dailyBudget: c.dailyBudget != null ? String(c.dailyBudget) : '',
          totalBudget: c.totalBudget != null ? String(c.totalBudget) : '',
          currency: String(c.currency || 'USD'),
          startDate: c.startDate ? String(c.startDate).slice(0, 10) : '',
          endDate: c.endDate ? String(c.endDate).slice(0, 10) : '',
          landingPageUrl: landing,
          trackingCode: String(c.trackingCode || ''),
        });
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.loadCampaign'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, campaignId, createMode, t]);

  const jobOptions = useMemo(() => {
    const fromList = jobs.map((j) => ({ value: String(j.id), label: j.title }));
    const ids = new Set(fromList.map((o) => o.value));
    const jid = form.jobId ? String(form.jobId) : '';
    const missingFromList = jid !== '' && !ids.has(jid);
    const injected =
      missingFromList
        ? [
            {
              value: jid,
              label: viewJobTitle || t('sourcing.campaign.jobUnknownTitle', { id: jid }),
            },
          ]
        : [];
    return [{ value: '', label: t('sourcing.campaign.selectJob') }, ...injected, ...fromList];
  }, [jobs, form.jobId, viewJobTitle, t]);

  /** Label shown in campaign detail (read-only); avoids empty disabled <select> when API shape differs from `jobs`. */
  const resolvedJobLabel = useMemo(() => {
    const jid = form.jobId ? String(form.jobId) : '';
    const fromList = jid ? jobs.find((j) => String(j.id) === jid) : undefined;
    if (fromList?.title) return fromList.title;
    if (viewJobTitle) return viewJobTitle;
    const fromAutoName = parseJobTitleFromWhatsappAutoName(form.name);
    if (fromAutoName) return fromAutoName;
    if (jid) return t('sourcing.campaign.jobUnknownTitle', { id: jid });
    return '—';
  }, [form.jobId, form.name, jobs, viewJobTitle, t]);

  const platformOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: '', label: t('sourcing.campaign.platformPlaceholder') },
      ...sourcingPlatformSelectLabels(t),
    ];
    const p = form.platform.trim();
    if (p && !(SOURCING_PLATFORM_CODES as readonly string[]).includes(p)) {
      opts.push({ value: p, label: p });
    }
    return opts;
  }, [t, form.platform]);

  const isWhatsapp = (form.platform || '').toLowerCase() === 'whatsapp';
  const phoneDigits = useMemo(() => sourcingWhatsAppPhoneFromEnv(), []);

  const applyMessage = useMemo(() => {
    if (!form.jobId) return '';
    return t('sourcing.campaign.whatsappPrefillMessage', { ref: jobPostRef(form.jobId) });
  }, [form.jobId, t]);

  const waMeUrl = useMemo(() => buildWhatsappMeUrl(phoneDigits, applyMessage), [phoneDigits, applyMessage]);

  const readOnlyLandingUrl = (form.landingPageUrl || '').trim();
  const showWhatsappDestination = readOnly && isWhatsappLandingUrl(readOnlyLandingUrl);
  const platformCode = (form.platform || loadedCampaign?.platform || '').trim();
  const platformLabel = platformCode ? campaignPlatformLabel(platformCode, t) : '';
  const empty = t('sourcing.campaign.emptyValue');

  const copyLink = async (url: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setSubmitError(null);
    try {
      if (isWhatsapp) {
        const digits = sourcingWhatsAppPhoneFromEnv();
        if (!form.jobId) {
          setSubmitError(t('sourcing.errors.whatsappJobRequired'));
          return;
        }
        if (!digits) {
          setSubmitError(t('sourcing.campaign.whatsappMissingPhoneEnv'));
          return;
        }
        const msg = t('sourcing.campaign.whatsappPrefillMessage', { ref: jobPostRef(form.jobId) });
        const landingPageUrl = buildWhatsappMeUrl(digits, msg);
        const job = jobs.find((j) => String(j.id) === form.jobId);
        await createSourcingCampaign({
          jobId: Number(form.jobId),
          name: t('sourcing.campaign.whatsappAutoName', { job: job?.title || `#${form.jobId}` }),
          platform: 'whatsapp',
          landingPageUrl,
          currency: 'USD',
        });
      } else {
        await createSourcingCampaign({
          jobId: form.jobId ? Number(form.jobId) : undefined,
          name: form.name,
          platform: form.platform || undefined,
          dailyBudget: form.dailyBudget ? Number(form.dailyBudget) : undefined,
          totalBudget: form.totalBudget ? Number(form.totalBudget) : undefined,
          currency: form.currency || 'USD',
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          landingPageUrl: form.landingPageUrl || undefined,
          trackingCode: form.trackingCode || undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setSubmitError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : t('sourcing.errors.saveCampaign'));
    } finally {
      setSaving(false);
    }
  };

  const whatsappOnlyCreate = !readOnly && !campaignId && createMode === 'whatsapp-apply';

  const whatsappLinkBlock = (url: string) => (
    <div className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
      {!phoneDigits ? <ErrorMessage message={t('sourcing.campaign.whatsappMissingPhoneEnv')} /> : null}
      {url ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('sourcing.campaign.whatsappShareLink')}</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-white font-mono text-xs text-gray-800 break-all"
                value={url}
              />
              <Button type="button" variant="outline" className="shrink-0" disabled={!url} onClick={() => void copyLink(url)}>
                {linkCopied ? t('sourcing.campaign.whatsappLinkCopied') : t('sourcing.campaign.whatsappCopyLink')}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">{t('sourcing.campaign.whatsappQrLabel')}</p>
            <div className="inline-block rounded-lg bg-white p-3 shadow-sm border border-gray-100">
              <QRCodeSVG value={url} size={200} level="M" />
            </div>
          </div>
          <p className="text-xs text-gray-600">{t('sourcing.campaign.whatsappShareHint')}</p>
        </>
      ) : phoneDigits && isWhatsapp && !form.jobId ? (
        <p className="text-sm text-gray-600">{t('sourcing.campaign.whatsappSelectJobHint')}</p>
      ) : null}
    </div>
  );

  const subtitle =
    readOnly
      ? undefined
      : isWhatsapp || whatsappOnlyCreate
        ? t('sourcing.campaign.whatsappSubtitle')
        : t('sourcing.campaign.subtitle');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        readOnly ? t('sourcing.campaign.viewTitle') : whatsappOnlyCreate ? t('sourcing.campaign.createWhatsAppTitle') : t('sourcing.campaign.createTitle')
      }
      subtitle={subtitle}
      width="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>
            {t('common.actions.close')}
          </Button>
          {!readOnly ? (
            <Button variant="primary" type="submit" form="campaign-form" disabled={saving}>
              {saving ? t('common.actions.creating') : t('sourcing.campaign.submit')}
            </Button>
          ) : null}
        </div>
      }
    >
      {loadError ? <ErrorMessage message={loadError} /> : null}
      {submitError ? <ErrorMessage message={submitError} /> : null}
      {loading ? (
        <div className="py-8 text-center text-gray-500">{t('common.loading')}</div>
      ) : (
        <form id="campaign-form" onSubmit={handleSubmit} className="space-y-4">
          {readOnly ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-dark-text">{form.name || empty}</p>
                  <p className="mt-1 text-sm text-gray-600">{resolvedJobLabel}</p>
                </div>
                <LeadStatusPill status={loadedCampaign?.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('sourcing.campaign.platform')}
                  </p>
                  {platformCode ? (
                    <div className="flex items-center gap-2" title={platformLabel}>
                      <SourceTypeBrandLogo sourceTypeCode={platformCode} displayName={platformLabel} size="sm" />
                      <span className="text-sm text-gray-800">{platformLabel}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">{empty}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('sourcing.campaign.dailyBudget')}
                  </p>
                  <p className="text-sm text-gray-800 tabular-nums">
                    {form.dailyBudget
                      ? `${form.currency || 'USD'} $${Number(form.dailyBudget).toFixed(2)}`
                      : empty}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('sourcing.campaign.totalBudget')}
                  </p>
                  <p className="text-sm text-gray-800 tabular-nums">
                    {form.totalBudget
                      ? `${form.currency || 'USD'} $${Number(form.totalBudget).toFixed(2)}`
                      : empty}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('sourcing.campaign.currency')}
                  </p>
                  <p className="text-sm text-gray-800">{form.currency || empty}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('sourcing.campaign.startDate')}
                  </p>
                  <p className="text-sm text-gray-800">
                    {form.startDate || formatCampaignDateTime(loadedCampaign?.startDate, i18n.language) || empty}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('sourcing.campaign.endDate')}
                  </p>
                  <p className="text-sm text-gray-800">
                    {form.endDate || formatCampaignDateTime(loadedCampaign?.endDate, i18n.language) || empty}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('sourcing.campaign.createdAt')}
                  </p>
                  <p className="text-sm text-gray-800">
                    {formatCampaignDateTime(loadedCampaign?.createdAt, i18n.language) || empty}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('sourcing.campaign.updatedAt')}
                  </p>
                  <p className="text-sm text-gray-800">
                    {formatCampaignDateTime(loadedCampaign?.updatedAt, i18n.language) || empty}
                  </p>
                </div>
              </div>

              {showWhatsappDestination ? (
                whatsappLinkBlock(readOnlyLandingUrl)
              ) : readOnlyLandingUrl ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('sourcing.campaign.destinationLink')}
                  </label>
                  <input
                    readOnly
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs text-gray-800 break-all"
                    value={readOnlyLandingUrl}
                  />
                </div>
              ) : null}

              {loadedCampaign?.externalCampaignId || loadedCampaign?.externalAdAccountId ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-800">{t('sourcing.campaign.metaIntegration')}</p>
                  {loadedCampaign.externalCampaignId ? (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('sourcing.campaign.externalCampaignId')}</p>
                      <p className="text-sm font-mono text-gray-800 break-all">{loadedCampaign.externalCampaignId}</p>
                    </div>
                  ) : null}
                  {loadedCampaign.externalAdAccountId ? (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('sourcing.campaign.externalAdAccountId')}</p>
                      <p className="text-sm font-mono text-gray-800 break-all">{loadedCampaign.externalAdAccountId}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {form.trackingCode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('sourcing.campaign.trackingCode')}</label>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                    rows={3}
                    value={form.trackingCode}
                    readOnly
                  />
                </div>
              ) : null}
            </div>
          ) : isWhatsapp ? (
            <div className="space-y-4">
              {whatsappOnlyCreate ? (
                <SelectField
                  label={t('sourcing.campaign.job')}
                  required
                  value={form.jobId}
                  onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                  options={jobOptions}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label={t('sourcing.campaign.platform')}
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    options={platformOptions}
                  />
                  <SelectField
                    label={t('sourcing.campaign.job')}
                    required
                    value={form.jobId}
                    onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                    options={jobOptions}
                  />
                </div>
              )}
              {whatsappLinkBlock(waMeUrl)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label={t('sourcing.campaign.job')}
                required
                value={form.jobId}
                onChange={(e) => setForm({ ...form, jobId: e.target.value })}
                options={jobOptions}
              />
              <TextField
                label={t('sourcing.campaign.name')}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <SelectField
                label={t('sourcing.campaign.platform')}
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                options={platformOptions}
              />
              <TextField
                label={t('sourcing.campaign.dailyBudget')}
                type="number"
                min={0}
                step="0.01"
                value={form.dailyBudget}
                onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })}
              />
              <TextField
                label={t('sourcing.campaign.totalBudget')}
                type="number"
                min={0}
                step="0.01"
                value={form.totalBudget}
                onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
              />
              <TextField label={t('sourcing.campaign.currency')} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              <TextField
                label={t('sourcing.campaign.startDate')}
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
              <TextField
                label={t('sourcing.campaign.endDate')}
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              <div className="md:col-span-2">
                <TextField
                  label={t('sourcing.campaign.landingPageUrl')}
                  type="url"
                  value={form.landingPageUrl}
                  onChange={(e) => setForm({ ...form, landingPageUrl: e.target.value })}
                  placeholder={t('common.placeholders.url')}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('sourcing.campaign.trackingCode')}</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  rows={3}
                  value={form.trackingCode}
                  onChange={(e) => setForm({ ...form, trackingCode: e.target.value })}
                />
              </div>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}

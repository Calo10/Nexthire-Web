import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import SourceTypeBrandLogo from './SourceTypeBrandLogo';
import Button from '../Button';
import TextField from '../TextField';
import ErrorMessage from '../ErrorMessage';
import { saveSourcingSourceConnection } from '../../api/sourcingApi';
import {
  buildCalendlyConfigJson,
  parseCalendlyConfig,
  type CalendlyConfigState,
} from '../../lib/calendlySourceConfig';
import { CALENDLY_SOURCE_CODE } from '../../lib/calendlySource';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sourceTypeCode: string;
  displayName: string;
  initialConnected?: boolean;
  initialActive?: boolean;
  initialConfig?: string;
  onSaved: () => void;
}

const META_ADS_CONFIG_KEYS = ['AccessToken', 'AdAccountId', 'PageId'] as const;

type MetaAdsConfigState = Record<(typeof META_ADS_CONFIG_KEYS)[number], string>;

function emptyMetaAdsConfig(): MetaAdsConfigState {
  return {
    AccessToken: '',
    AdAccountId: '',
    PageId: '',
  };
}

const LEGACY_META_ADS_KEY_MAP: Record<(typeof META_ADS_CONFIG_KEYS)[number], string[]> = {
  AccessToken: ['AccessToken', 'meta_access_token'],
  AdAccountId: ['AdAccountId', 'meta_ad_account_id'],
  PageId: ['PageId', 'facebook_page_id'],
};

function parseMetaAdsConfig(json: string): MetaAdsConfigState {
  const out = emptyMetaAdsConfig();
  try {
    const raw = json.trim() ? JSON.parse(json) : {};
    if (!raw || typeof raw !== 'object') return out;
    const rec = raw as Record<string, unknown>;
    for (const key of META_ADS_CONFIG_KEYS) {
      const legacyKeys = LEGACY_META_ADS_KEY_MAP[key];
      const match = legacyKeys.map((k) => rec[k]).find((v) => v != null && String(v).trim());
      out[key] = match == null ? '' : String(match);
    }
  } catch {
    return out;
  }
  return out;
}

/** Meta Ads (and legacy API codes that used the same Marketing API config). */
function isMetaAdsSourceCode(code: string) {
  const c = code.toLowerCase();
  return c === 'meta_ads' || c === 'facebook_ads' || c === 'instagram_ads';
}

function buildMetaAdsConfigJson(fields: MetaAdsConfigState, previousJson: string): string {
  let extra: Record<string, unknown> = {};
  try {
    const prev = previousJson.trim() ? JSON.parse(previousJson) : {};
    if (prev && typeof prev === 'object') {
      for (const [k, v] of Object.entries(prev as Record<string, unknown>)) {
        const isKnown =
          META_ADS_CONFIG_KEYS.includes(k as (typeof META_ADS_CONFIG_KEYS)[number]) ||
          Object.values(LEGACY_META_ADS_KEY_MAP).flat().includes(k);
        if (!isKnown) extra[k] = v;
      }
    }
  } catch {
    extra = {};
  }
  const merged: Record<string, unknown> = { ...extra };
  for (const key of META_ADS_CONFIG_KEYS) {
    merged[key] = fields[key].trim();
  }
  return JSON.stringify(merged);
}

const TIKTOK_CONFIG_KEYS = ['tiktok_access_token', 'tiktok_advertiser_id', 'tiktok_app_id', 'tiktok_secret'] as const;

type TiktokConfigState = Record<(typeof TIKTOK_CONFIG_KEYS)[number], string>;

function emptyTiktokConfig(): TiktokConfigState {
  return {
    tiktok_access_token: '',
    tiktok_advertiser_id: '',
    tiktok_app_id: '',
    tiktok_secret: '',
  };
}

function parseTiktokConfig(json: string): TiktokConfigState {
  const out = emptyTiktokConfig();
  try {
    const raw = json.trim() ? JSON.parse(json) : {};
    if (!raw || typeof raw !== 'object') return out;
    for (const key of TIKTOK_CONFIG_KEYS) {
      const v = (raw as Record<string, unknown>)[key];
      out[key] = v == null ? '' : String(v);
    }
  } catch {
    return out;
  }
  return out;
}

function isTikTokSourceCode(code: string) {
  return /tik[\s_-]?tok|tiktok/i.test(code.toLowerCase());
}

function buildTiktokConfigJson(fields: TiktokConfigState, previousJson: string): string {
  let extra: Record<string, unknown> = {};
  try {
    const prev = previousJson.trim() ? JSON.parse(previousJson) : {};
    if (prev && typeof prev === 'object') {
      for (const [k, v] of Object.entries(prev as Record<string, unknown>)) {
        if (!TIKTOK_CONFIG_KEYS.includes(k as (typeof TIKTOK_CONFIG_KEYS)[number])) {
          extra[k] = v;
        }
      }
    }
  } catch {
    extra = {};
  }
  const merged: Record<string, unknown> = { ...extra };
  for (const key of TIKTOK_CONFIG_KEYS) {
    merged[key] = fields[key].trim();
  }
  return JSON.stringify(merged);
}

const LINKEDIN_CONFIG_KEYS = [
  'linkedin_access_token',
  'linkedin_client_id',
  'linkedin_client_secret',
  'linkedin_ad_account_id',
] as const;

type LinkedinConfigState = Record<(typeof LINKEDIN_CONFIG_KEYS)[number], string>;

function emptyLinkedinConfig(): LinkedinConfigState {
  return {
    linkedin_access_token: '',
    linkedin_client_id: '',
    linkedin_client_secret: '',
    linkedin_ad_account_id: '',
  };
}

function parseLinkedinConfig(json: string): LinkedinConfigState {
  const out = emptyLinkedinConfig();
  try {
    const raw = json.trim() ? JSON.parse(json) : {};
    if (!raw || typeof raw !== 'object') return out;
    for (const key of LINKEDIN_CONFIG_KEYS) {
      const v = (raw as Record<string, unknown>)[key];
      out[key] = v == null ? '' : String(v);
    }
  } catch {
    return out;
  }
  return out;
}

function isLinkedInSourceCode(code: string) {
  return /linked[\s_-]?in|linkedin/i.test(code.toLowerCase());
}

function buildLinkedinConfigJson(fields: LinkedinConfigState, previousJson: string): string {
  let extra: Record<string, unknown> = {};
  try {
    const prev = previousJson.trim() ? JSON.parse(previousJson) : {};
    if (prev && typeof prev === 'object') {
      for (const [k, v] of Object.entries(prev as Record<string, unknown>)) {
        if (!LINKEDIN_CONFIG_KEYS.includes(k as (typeof LINKEDIN_CONFIG_KEYS)[number])) {
          extra[k] = v;
        }
      }
    }
  } catch {
    extra = {};
  }
  const merged: Record<string, unknown> = { ...extra };
  for (const key of LINKEDIN_CONFIG_KEYS) {
    merged[key] = fields[key].trim();
  }
  return JSON.stringify(merged);
}

const TWILIO_CONFIG_KEYS = ['Twilio:AccountSid', 'Twilio:AuthToken', 'Twilio:DefaultFromWhatsAppNumber'] as const;

type TwilioConfigField = 'AccountSid' | 'AuthToken' | 'DefaultFromWhatsAppNumber';

type TwilioConfigState = Record<TwilioConfigField, string>;

const TWILIO_FIELD_TO_JSON_KEY: Record<TwilioConfigField, (typeof TWILIO_CONFIG_KEYS)[number]> = {
  AccountSid: 'Twilio:AccountSid',
  AuthToken: 'Twilio:AuthToken',
  DefaultFromWhatsAppNumber: 'Twilio:DefaultFromWhatsAppNumber',
};

function emptyTwilioConfig(): TwilioConfigState {
  return {
    AccountSid: '',
    AuthToken: '',
    DefaultFromWhatsAppNumber: '',
  };
}

const LEGACY_TWILIO_KEY_MAP: Record<TwilioConfigField, string[]> = {
  AccountSid: ['Twilio:AccountSid', 'twilio_account_sid', 'account_sid'],
  AuthToken: ['Twilio:AuthToken', 'twilio_auth_token', 'auth_token'],
  DefaultFromWhatsAppNumber: [
    'Twilio:DefaultFromWhatsAppNumber',
    'twilio_default_from_whatsapp_number',
    'default_from_whatsapp_number',
  ],
};

function parseTwilioConfig(json: string): TwilioConfigState {
  const out = emptyTwilioConfig();
  try {
    const raw = json.trim() ? JSON.parse(json) : {};
    if (!raw || typeof raw !== 'object') return out;
    const rec = raw as Record<string, unknown>;
    for (const field of Object.keys(TWILIO_FIELD_TO_JSON_KEY) as TwilioConfigField[]) {
      const legacyKeys = LEGACY_TWILIO_KEY_MAP[field];
      const match = legacyKeys.map((k) => rec[k]).find((v) => v != null && String(v).trim());
      out[field] = match == null ? '' : String(match);
    }
  } catch {
    return out;
  }
  return out;
}

function isTwilioSourceCode(code: string) {
  const c = code.toLowerCase();
  return c === 'twilio' || c === 'whatsapp';
}

function buildTwilioConfigJson(fields: TwilioConfigState, previousJson: string): string {
  let extra: Record<string, unknown> = {};
  const knownKeys = new Set([
    ...TWILIO_CONFIG_KEYS,
    ...Object.values(LEGACY_TWILIO_KEY_MAP).flat(),
  ]);
  try {
    const prev = previousJson.trim() ? JSON.parse(previousJson) : {};
    if (prev && typeof prev === 'object') {
      for (const [k, v] of Object.entries(prev as Record<string, unknown>)) {
        if (!knownKeys.has(k)) extra[k] = v;
      }
    }
  } catch {
    extra = {};
  }
  const merged: Record<string, unknown> = { ...extra };
  for (const field of Object.keys(TWILIO_FIELD_TO_JSON_KEY) as TwilioConfigField[]) {
    merged[TWILIO_FIELD_TO_JSON_KEY[field]] = fields[field].trim();
  }
  return JSON.stringify(merged);
}

function isCalendlySourceCode(code: string) {
  return code.toLowerCase() === CALENDLY_SOURCE_CODE;
}

export default function SourceConnectionModal({
  isOpen,
  onClose,
  sourceTypeCode,
  displayName,
  initialConnected = false,
  initialActive = true,
  initialConfig = '{}',
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(initialConnected);
  const [isActive, setIsActive] = useState(initialActive);
  const [configJson, setConfigJson] = useState(initialConfig);
  const [metaAdsConfig, setMetaAdsConfig] = useState<MetaAdsConfigState>(() => parseMetaAdsConfig(initialConfig));
  const [tiktokConfig, setTiktokConfig] = useState<TiktokConfigState>(() => parseTiktokConfig(initialConfig));
  const [linkedinConfig, setLinkedinConfig] = useState<LinkedinConfigState>(() => parseLinkedinConfig(initialConfig));
  const [twilioConfig, setTwilioConfig] = useState<TwilioConfigState>(() => parseTwilioConfig(initialConfig));
  const [calendlyConfig, setCalendlyConfig] = useState<CalendlyConfigState>(() => parseCalendlyConfig(initialConfig));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isMetaAds = useMemo(() => isMetaAdsSourceCode(sourceTypeCode), [sourceTypeCode]);
  const isTikTok = useMemo(() => isTikTokSourceCode(sourceTypeCode), [sourceTypeCode]);
  const isLinkedIn = useMemo(() => isLinkedInSourceCode(sourceTypeCode), [sourceTypeCode]);
  const isTwilio = useMemo(() => isTwilioSourceCode(sourceTypeCode), [sourceTypeCode]);
  const isCalendly = useMemo(() => isCalendlySourceCode(sourceTypeCode), [sourceTypeCode]);

  useEffect(() => {
    if (!isOpen) return;
    setIsConnected(initialConnected);
    setIsActive(initialActive);
    const next = initialConfig || '{}';
    setConfigJson(next);
    setMetaAdsConfig(parseMetaAdsConfig(next));
    setTiktokConfig(parseTiktokConfig(next));
    setLinkedinConfig(parseLinkedinConfig(next));
    setTwilioConfig(parseTwilioConfig(next));
    setCalendlyConfig(parseCalendlyConfig(next));
    setError(null);
  }, [isOpen, initialConnected, initialActive, initialConfig]);

  const setMetaAdsField = (key: keyof MetaAdsConfigState, value: string) => {
    setMetaAdsConfig((prev) => ({ ...prev, [key]: value }));
  };

  const setTiktokField = (key: keyof TiktokConfigState, value: string) => {
    setTiktokConfig((prev) => ({ ...prev, [key]: value }));
  };

  const setLinkedinField = (key: keyof LinkedinConfigState, value: string) => {
    setLinkedinConfig((prev) => ({ ...prev, [key]: value }));
  };

  const setTwilioField = (key: TwilioConfigField, value: string) => {
    setTwilioConfig((prev) => ({ ...prev, [key]: value }));
  };

  const setCalendlyField = (key: keyof CalendlyConfigState, value: string) => {
    setCalendlyConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let outJson: string;
      if (isMetaAds) {
        outJson = buildMetaAdsConfigJson(metaAdsConfig, configJson);
      } else if (isTikTok) {
        outJson = buildTiktokConfigJson(tiktokConfig, configJson);
      } else if (isLinkedIn) {
        outJson = buildLinkedinConfigJson(linkedinConfig, configJson);
      } else if (isTwilio) {
        outJson = buildTwilioConfigJson(twilioConfig, configJson);
      } else if (isCalendly) {
        if (isConnected && !calendlyConfig.PersonalAccessToken.trim()) {
          setError(t('sourcing.sources.calendly.validationRequired'));
          setSaving(false);
          return;
        }
        outJson = buildCalendlyConfigJson(calendlyConfig, configJson);
      } else {
        let parsed: unknown = {};
        try {
          parsed = configJson.trim() ? JSON.parse(configJson) : {};
        } catch {
          setError(t('sourcing.sources.invalidJson'));
          setSaving(false);
          return;
        }
        outJson = typeof parsed === 'object' && parsed !== null ? JSON.stringify(parsed) : configJson;
      }

      await saveSourcingSourceConnection({
        sourceTypeCode,
        isConnected,
        isActive,
        configJson: outJson,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message: string }).message) : t('sourcing.errors.saveSource'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sourcing.sources.configureTitle', { name: displayName })}
      titleIcon={<SourceTypeBrandLogo sourceTypeCode={sourceTypeCode} displayName={displayName} size="lg" />}
      width="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" form="source-conn-form" disabled={saving}>
            {saving ? t('common.actions.saving') : t('sourcing.sources.save')}
          </Button>
        </div>
      }
    >
      {error ? <ErrorMessage message={error} /> : null}
      <form id="source-conn-form" onSubmit={handleSubmit} className="space-y-4">
        <TextField label={t('sourcing.sources.sourceTypeCode')} value={sourceTypeCode} readOnly disabled />
        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isConnected} onChange={(e) => setIsConnected(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm font-medium text-gray-700">{t('sourcing.sources.connected')}</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm font-medium text-gray-700">{t('sourcing.sources.active')}</span>
          </label>
        </div>

        {isMetaAds ? (
          <div className="space-y-4 pt-1">
            <p className="text-sm font-medium text-gray-800">{t('sourcing.sources.metaAds.sectionTitle')}</p>
            <TextField
              label={t('sourcing.sources.metaAds.accessToken')}
              value={metaAdsConfig.AccessToken}
              onChange={(e) => setMetaAdsField('AccessToken', e.target.value)}
              autoComplete="off"
            />
            <TextField
              label={t('sourcing.sources.metaAds.adAccountId')}
              value={metaAdsConfig.AdAccountId}
              onChange={(e) => setMetaAdsField('AdAccountId', e.target.value)}
              placeholder={t('sourcing.sources.metaAds.adAccountPlaceholder')}
              autoComplete="off"
            />
            <TextField
              label={t('sourcing.sources.metaAds.pageId')}
              value={metaAdsConfig.PageId}
              onChange={(e) => setMetaAdsField('PageId', e.target.value)}
              autoComplete="off"
            />
          </div>
        ) : isTikTok ? (
          <div className="space-y-4 pt-1">
            <p className="text-sm font-medium text-gray-800">{t('sourcing.sources.tiktok.sectionTitle')}</p>
            <TextField
              label={t('sourcing.sources.tiktok.accessToken')}
              value={tiktokConfig.tiktok_access_token}
              onChange={(e) => setTiktokField('tiktok_access_token', e.target.value)}
              autoComplete="off"
            />
            <TextField
              label={t('sourcing.sources.tiktok.advertiserId')}
              value={tiktokConfig.tiktok_advertiser_id}
              onChange={(e) => setTiktokField('tiktok_advertiser_id', e.target.value)}
              autoComplete="off"
            />
            <TextField
              label={t('sourcing.sources.tiktok.appId')}
              value={tiktokConfig.tiktok_app_id}
              onChange={(e) => setTiktokField('tiktok_app_id', e.target.value)}
              autoComplete="off"
            />
            <TextField
              label={t('sourcing.sources.tiktok.secret')}
              type="password"
              value={tiktokConfig.tiktok_secret}
              onChange={(e) => setTiktokField('tiktok_secret', e.target.value)}
              autoComplete="new-password"
            />
          </div>
        ) : isLinkedIn ? (
          <div className="space-y-4 pt-1">
            <p className="text-sm font-medium text-gray-800">{t('sourcing.sources.linkedin.sectionTitle')}</p>
            <TextField
              label={t('sourcing.sources.linkedin.accessToken')}
              value={linkedinConfig.linkedin_access_token}
              onChange={(e) => setLinkedinField('linkedin_access_token', e.target.value)}
              autoComplete="off"
            />
            <TextField
              label={t('sourcing.sources.linkedin.clientId')}
              value={linkedinConfig.linkedin_client_id}
              onChange={(e) => setLinkedinField('linkedin_client_id', e.target.value)}
              autoComplete="off"
            />
            <TextField
              label={t('sourcing.sources.linkedin.clientSecret')}
              type="password"
              value={linkedinConfig.linkedin_client_secret}
              onChange={(e) => setLinkedinField('linkedin_client_secret', e.target.value)}
              autoComplete="new-password"
            />
            <TextField
              label={t('sourcing.sources.linkedin.adAccountId')}
              value={linkedinConfig.linkedin_ad_account_id}
              onChange={(e) => setLinkedinField('linkedin_ad_account_id', e.target.value)}
              placeholder={t('sourcing.sources.linkedin.adAccountPlaceholder')}
              autoComplete="off"
            />
          </div>
        ) : isTwilio ? (
          <div className="space-y-4 pt-1">
            <p className="text-sm font-medium text-gray-800">{t('sourcing.sources.twilio.sectionTitle')}</p>
            <TextField
              label={t('sourcing.sources.twilio.accountSid')}
              value={twilioConfig.AccountSid}
              onChange={(e) => setTwilioField('AccountSid', e.target.value)}
              placeholder={t('sourcing.sources.twilio.accountSidPlaceholder')}
              autoComplete="off"
            />
            <TextField
              label={t('sourcing.sources.twilio.authToken')}
              type="password"
              value={twilioConfig.AuthToken}
              onChange={(e) => setTwilioField('AuthToken', e.target.value)}
              autoComplete="new-password"
            />
            <TextField
              label={t('sourcing.sources.twilio.defaultFromWhatsAppNumber')}
              value={twilioConfig.DefaultFromWhatsAppNumber}
              onChange={(e) => setTwilioField('DefaultFromWhatsAppNumber', e.target.value)}
              placeholder={t('sourcing.sources.twilio.defaultFromWhatsAppNumberPlaceholder')}
              autoComplete="off"
            />
          </div>
        ) : isCalendly ? (
          <div className="space-y-4 pt-1">
            <p className="text-sm font-medium text-gray-800">{t('sourcing.sources.calendly.sectionTitle')}</p>
            <p className="text-xs text-gray-500">{t('sourcing.sources.calendly.description')}</p>
            <TextField
              label={t('sourcing.sources.calendly.personalAccessToken')}
              type="password"
              value={calendlyConfig.PersonalAccessToken}
              onChange={(e) => setCalendlyField('PersonalAccessToken', e.target.value)}
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 -mt-2">{t('sourcing.sources.calendly.tokenHint')}</p>
            <TextField
              label={t('sourcing.sources.calendly.schedulingUrl')}
              value={calendlyConfig.SchedulingUrl}
              onChange={(e) => setCalendlyField('SchedulingUrl', e.target.value)}
              placeholder={t('sourcing.sources.calendly.schedulingUrlPlaceholder')}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 -mt-2">{t('sourcing.sources.calendly.schedulingUrlHint')}</p>
            <TextField
              label={t('sourcing.sources.calendly.webhookSigningKey')}
              value={calendlyConfig.WebhookSigningKey}
              onChange={(e) => setCalendlyField('WebhookSigningKey', e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 -mt-2">{t('sourcing.sources.calendly.webhookHint')}</p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('sourcing.sources.configJson')}</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm min-h-[140px]"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              spellCheck={false}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import { getSourcingSourceTypes, getSourcingSourceConnections } from '../../api/sourcingApi';
import { pickMetaAdsConnection } from '../../lib/sourcingMetaSource';
import { pickTwilioConnection } from '../../lib/sourcingTwilioSource';
import type { SourcingSourceType, SourcingSourceConnection } from '../../types/sourcing';
import SourceConnectionModal from './SourceConnectionModal';
import SourceTypeBrandLogo from './SourceTypeBrandLogo';

const FALLBACK_SOURCES: { code: string; name: string }[] = [
  { code: 'meta_ads', name: 'Meta Ads' },
  { code: 'twilio', name: 'Twilio' },
  { code: 'tiktok_ads', name: 'TikTok Ads' },
  { code: 'linkedin_ads', name: 'LinkedIn Ads' },
];

/** Shown only as unified Meta Ads card; connections may still exist under legacy codes. */
const LEGACY_META_SOURCE_CODES = new Set(['facebook_ads', 'instagram_ads']);

/** Legacy WhatsApp source — unified under Twilio card. */
const LEGACY_TWILIO_SOURCE_CODES = new Set(['whatsapp']);

/** Internal / non-integration sources — not shown as configurable connection cards */
const HIDDEN_SOURCE_CODES = new Set([
  'landing_page',
  'qr_code',
  'manual_entry',
  'manual',
  'referral',
  'public_apply',
]);

const UNDER_CONSTRUCTION_SOURCE_CODES = new Set(['tiktok_ads', 'linkedin_ads']);

interface Props {
  shouldFetch: boolean;
  refreshKey: number;
  onConnectionSaved?: () => void;
}

export default function SourcesTab({ shouldFetch, refreshKey, onConnectionSaved }: Props) {
  const { t } = useTranslation();
  const [types, setTypes] = useState<SourcingSourceType[]>([]);
  const [connections, setConnections] = useState<SourcingSourceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalCode, setModalCode] = useState('');
  const [modalName, setModalName] = useState('');

  const load = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [tList, cList] = await Promise.all([getSourcingSourceTypes(), getSourcingSourceConnections()]);
      setTypes(tList);
      setConnections(cList);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.loadSources');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, t]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const merged = useMemo(() => {
    const byCode = new Map<string, { code: string; name: string; fromApi: boolean }>();
    for (const f of FALLBACK_SOURCES) {
      byCode.set(f.code.toLowerCase(), { code: f.code, name: f.name, fromApi: false });
    }
    for (const typ of types) {
      const code = String(typ.code || typ.sourceTypeCode || '').toLowerCase();
      if (!code) continue;
      const name = String(typ.displayName || typ.name || code);
      byCode.set(code, { code: typ.code ? String(typ.code) : typ.sourceTypeCode ? String(typ.sourceTypeCode) : code, name, fromApi: true });
    }
    return Array.from(byCode.values())
      .filter((row) => !HIDDEN_SOURCE_CODES.has(row.code.toLowerCase()))
      .filter((row) => !LEGACY_META_SOURCE_CODES.has(row.code.toLowerCase()))
      .filter((row) => !LEGACY_TWILIO_SOURCE_CODES.has(row.code.toLowerCase()));
  }, [types]);

  const connByCode = useMemo(() => {
    const m = new Map<string, SourcingSourceConnection>();
    for (const c of connections) {
      const code = String(c.sourceTypeCode || '').toLowerCase();
      if (code) m.set(code, c);
    }
    return m;
  }, [connections]);

  const openConfigure = (code: string, name: string) => {
    setModalCode(code);
    setModalName(name);
    setModalOpen(true);
  };

  const modalConn =
    modalCode && modalCode.toLowerCase() === 'meta_ads'
      ? pickMetaAdsConnection(connByCode)
      : modalCode && modalCode.toLowerCase() === 'twilio'
        ? pickTwilioConnection(connByCode)
        : modalCode
          ? connByCode.get(modalCode.toLowerCase())
          : undefined;

  return (
    <div className="space-y-4">
      {error ? <ErrorMessage message={error} /> : null}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/60 border border-purple-100 animate-pulse" />
          ))}
        </div>
      ) : merged.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-purple-200 bg-white/60">
          <p className="text-gray-600">{t('sourcing.empty.noSourcesTitle')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {merged.map((row) => {
            const conn =
              row.code.toLowerCase() === 'meta_ads'
                ? pickMetaAdsConnection(connByCode)
                : row.code.toLowerCase() === 'twilio'
                  ? pickTwilioConnection(connByCode)
                  : connByCode.get(row.code.toLowerCase());
            const connected = !!conn?.isConnected;
            const active = conn?.isActive !== false;
            const underConstruction = UNDER_CONSTRUCTION_SOURCE_CODES.has(row.code.toLowerCase());
            return (
              <div
                key={row.code}
                className={`relative rounded-2xl border border-purple-100 bg-white p-5 shadow-sm flex flex-col gap-4 overflow-hidden ${
                  underConstruction ? 'opacity-70' : ''
                }`}
              >
                {underConstruction ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/55 backdrop-blur-[1px]"
                  >
                    <span className="rotate-[-18deg] select-none rounded-lg border-2 border-dashed border-amber-400/80 bg-amber-50/90 px-4 py-2 text-sm font-bold uppercase tracking-wider text-amber-700 shadow-sm">
                      {t('sourcing.sources.underConstruction')}
                    </span>
                  </div>
                ) : null}
                <div className={`flex flex-col gap-4 ${underConstruction ? 'pointer-events-none select-none' : ''}`}>
                <div className="flex items-start gap-3">
                  <SourceTypeBrandLogo sourceTypeCode={row.code} displayName={row.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-dark-text">{row.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">{row.code}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      connected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {connected ? t('sourcing.sources.badgeConnected') : t('sourcing.sources.badgeNotConnected')}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      active ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {active ? t('sourcing.sources.active') : t('sourcing.sources.inactive')}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={underConstruction}
                  onClick={() => openConfigure(row.code, row.name)}
                >
                  {t('sourcing.sources.configure')}
                </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SourceConnectionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        sourceTypeCode={modalCode}
        displayName={modalName}
        initialConnected={modalConn?.isConnected === true}
        initialActive={modalConn?.isActive !== false}
        initialConfig={typeof modalConn?.configJson === 'string' ? modalConn.configJson : '{}'}
        onSaved={() => {
          void load();
          onConnectionSaved?.();
        }}
      />
    </div>
  );
}

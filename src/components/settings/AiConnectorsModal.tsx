import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import AiAssistantLogos, {
  ClaudeLogo,
  CursorLogo,
  GeminiLogo,
  OpenAiLogo,
} from './AiAssistantLogos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ClientTab = 'claude' | 'chatgpt' | 'gemini' | 'cursor';

const ACCENT: Record<ClientTab, string> = {
  claude: '#D97757',
  chatgpt: '#10A37F',
  gemini: '#8E75B2',
  cursor: '#111827',
};

function mcpBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5047';
  return `${String(base).replace(/\/+$/, '')}/mcp`;
}

function readAccessToken(): string {
  return localStorage.getItem('nhAccessToken') || '';
}

function maskToken(token: string): string {
  if (!token) return '';
  if (token.length <= 16) return '••••••••';
  return `${token.slice(0, 10)}…${token.slice(-6)}`;
}

function CopyField({
  label,
  value,
  display,
  onCopy,
  copied,
  copyLabel,
  copiedLabel,
  trailing,
}: {
  label: string;
  value: string;
  display: string;
  onCopy: () => void;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  trailing?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
        {trailing}
      </div>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-[13px] text-dark-text shadow-sm">
          <span className="block truncate">{display}</span>
        </div>
        <button
          type="button"
          disabled={!value}
          onClick={onCopy}
          className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-dark-text shadow-sm hover:border-[#0077E6]/40 hover:bg-[#0077E6]/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </div>
  );
}

function StepRow({
  n,
  title,
  body,
  accent,
}: {
  n: number;
  title: string;
  body: string;
  accent: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: accent }}
      >
        {n}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold text-dark-text">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{body}</p>
      </div>
    </div>
  );
}

function VisualGuide({
  tab,
  mcpUrl,
  t,
}: {
  tab: ClientTab;
  mcpUrl: string;
  t: (key: string, opts?: Record<string, string>) => string;
}) {
  const accent = ACCENT[tab];
  const hostLabel = mcpUrl.replace(/^https?:\/\//, '').split('/')[0] || 'api';

  if (tab === 'cursor') {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-[#0B1220] text-white shadow-inner">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[11px] text-white/60">
          <span className="h-2 w-2 rounded-full bg-red-400/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          <span className="ml-2 font-mono">.cursor/mcp.json</span>
        </div>
        <div className="space-y-1 p-4 font-mono text-[11px] leading-5 text-emerald-200/90">
          <p className="text-white/40">{'{'}</p>
          <p className="pl-3">
            <span className="text-sky-300">&quot;mcpServers&quot;</span>
            <span className="text-white/50">: {'{'}</span>
          </p>
          <p className="pl-6">
            <span className="text-amber-300">&quot;nexthire&quot;</span>
            <span className="text-white/50">: {'{'}</span>
          </p>
          <p className="pl-9">
            <span className="text-sky-300">&quot;url&quot;</span>
            <span className="text-white/50">: </span>
            <span className="rounded bg-emerald-500/20 px-1 text-emerald-300">&quot;{mcpUrl}&quot;</span>
            <span className="text-white/50">,</span>
          </p>
          <p className="pl-9">
            <span className="text-sky-300">&quot;headers&quot;</span>
            <span className="text-white/50">: {'{ '}Authorization: Bearer …{'}'}</span>
          </p>
          <p className="pl-6 text-white/50">{'}'}</p>
          <p className="pl-3 text-white/50">{'}'}</p>
          <p className="text-white/40">{'}'}</p>
        </div>
        <div className="border-t border-white/10 px-4 py-2 text-[11px] text-white/50">
          {t('settings.aiConnectors.visual.cursorCaption')}
        </div>
      </div>
    );
  }

  const product =
    tab === 'claude' ? 'Claude' : tab === 'chatgpt' ? 'ChatGPT' : 'Gemini';
  const menuPath = t(`settings.aiConnectors.visual.${tab}.menu`);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          {tab === 'claude' ? <ClaudeLogo size={18} /> : null}
          {tab === 'chatgpt' ? <OpenAiLogo size={18} /> : null}
          {tab === 'gemini' ? <GeminiLogo size={18} /> : null}
          <span className="text-sm font-semibold text-dark-text">{product}</span>
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
          {t('settings.aiConnectors.visual.mockLabel')}
        </span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-[140px_1fr]">
        <div className="rounded-xl border border-dashed border-gray-200 bg-white/80 p-2 text-[11px] text-gray-500">
          <p className="mb-2 font-semibold text-gray-700">{t('settings.aiConnectors.visual.settings')}</p>
          <div className="space-y-1">
            <div className="rounded-md px-2 py-1">{t('settings.aiConnectors.visual.general')}</div>
            <div
              className="rounded-md px-2 py-1 font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {t('settings.aiConnectors.visual.connectors')}
            </div>
            <div className="rounded-md px-2 py-1">{t('settings.aiConnectors.visual.privacy')}</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <p className="text-xs font-semibold text-dark-text">{t('settings.aiConnectors.visual.addCustom')}</p>
          <p className="mt-1 text-[11px] text-gray-500">{menuPath}</p>
          <div className="mt-3 space-y-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {t('settings.aiConnectors.mcpUrl')}
              </p>
              <div
                className="truncate rounded-lg border-2 px-2.5 py-2 font-mono text-[11px]"
                style={{ borderColor: accent, backgroundColor: `${accent}14` }}
              >
                {hostLabel}/mcp
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                {t('settings.aiConnectors.accessToken')}
              </p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 font-mono text-[11px] text-gray-500">
                Bearer eyJhbGciOi…
              </div>
            </div>
            <div
              className="inline-flex rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {t('settings.aiConnectors.visual.save')}
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-100 px-4 py-2 text-[11px] text-gray-500">
        {t(`settings.aiConnectors.visual.${tab}.caption`)}
      </div>
    </div>
  );
}

export default function AiConnectorsModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<ClientTab>('claude');
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<'url' | 'token' | 'config' | null>(null);

  const mcpUrl = useMemo(() => mcpBaseUrl(), []);
  const token = useMemo(() => (isOpen ? readAccessToken() : ''), [isOpen]);
  const accent = ACCENT[tab];

  const configJson = useMemo(() => {
    const authHeader = token ? `Bearer ${token}` : 'Bearer YOUR_JWT';
    if (tab === 'cursor') {
      return JSON.stringify(
        {
          mcpServers: {
            nexthire: {
              url: mcpUrl,
              headers: { Authorization: authHeader },
            },
          },
        },
        null,
        2,
      );
    }
    return JSON.stringify(
      {
        name: 'NextHire',
        url: mcpUrl,
        headers: { Authorization: authHeader },
      },
      null,
      2,
    );
  }, [mcpUrl, tab, token]);

  const copy = async (kind: 'url' | 'token' | 'config', value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* ignore */
    }
  };

  const tabs: { id: ClientTab; label: string; icon: ReactNode }[] = [
    { id: 'claude', label: t('settings.aiConnectors.tabs.claude'), icon: <ClaudeLogo size={16} /> },
    { id: 'chatgpt', label: t('settings.aiConnectors.tabs.chatgpt'), icon: <OpenAiLogo size={16} /> },
    { id: 'gemini', label: t('settings.aiConnectors.tabs.gemini'), icon: <GeminiLogo size={16} /> },
    { id: 'cursor', label: t('settings.aiConnectors.tabs.cursor'), icon: <CursorLogo size={16} /> },
  ];

  const steps = [1, 2, 3, 4].map((n) => ({
    n,
    title: t(`settings.aiConnectors.steps.${tab}.${n}.title`),
    body: t(`settings.aiConnectors.steps.${tab}.${n}.body`),
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('settings.aiConnectors.title')}
      subtitle={t('settings.aiConnectors.subtitle')}
      titleIcon={<AiAssistantLogos size="md" />}
      width="xl"
      footer={
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          {t('common.actions.close')}
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#0077E6]/15 bg-gradient-to-br from-[#0077E6]/8 via-white to-[#00AAFF]/10 p-4 sm:p-5">
          <p className="text-sm text-gray-700">{t('settings.aiConnectors.intro')}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <CopyField
              label={t('settings.aiConnectors.mcpUrl')}
              value={mcpUrl}
              display={mcpUrl}
              onCopy={() => void copy('url', mcpUrl)}
              copied={copied === 'url'}
              copyLabel={t('settings.aiConnectors.copy')}
              copiedLabel={t('settings.aiConnectors.copied')}
            />
            <CopyField
              label={t('settings.aiConnectors.accessToken')}
              value={token}
              display={token ? (revealed ? token : maskToken(token)) : t('settings.aiConnectors.noToken')}
              onCopy={() => void copy('token', token)}
              copied={copied === 'token'}
              copyLabel={t('settings.aiConnectors.copy')}
              copiedLabel={t('settings.aiConnectors.copied')}
              trailing={
                <button
                  type="button"
                  disabled={!token}
                  onClick={() => setRevealed((v) => !v)}
                  className="text-xs font-medium text-[#0077E6] hover:underline disabled:opacity-40"
                >
                  {revealed ? t('settings.aiConnectors.hide') : t('settings.aiConnectors.show')}
                </button>
              }
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">{t('settings.aiConnectors.tokenHint')}</p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-dark-text">
            {t('settings.aiConnectors.pickAssistant')}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={
                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-all ' +
                    (active
                      ? 'border-transparent text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50')
                  }
                  style={active ? { backgroundColor: ACCENT[item.id] } : undefined}
                >
                  <span className={active ? 'brightness-0 invert' : ''}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <h3 className="text-sm font-semibold text-dark-text">
                {t(`settings.aiConnectors.steps.${tab}.heading`)}
              </h3>
            </div>
            <div className="space-y-4">
              {steps.map((step) => (
                <StepRow key={step.n} n={step.n} title={step.title} body={step.body} accent={accent} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-dark-text">
              {t('settings.aiConnectors.visualHeading')}
            </p>
            <VisualGuide tab={tab} mcpUrl={mcpUrl} t={t} />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-800 bg-[#0B1220]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
            <p className="text-xs font-medium text-white/70">{t('settings.aiConnectors.configSnippet')}</p>
            <button
              type="button"
              onClick={() => void copy('config', configJson)}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/15"
            >
              {copied === 'config' ? t('settings.aiConnectors.copied') : t('settings.aiConnectors.copyConfig')}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed text-emerald-100/90">{configJson}</pre>
        </div>
      </div>
    </Modal>
  );
}

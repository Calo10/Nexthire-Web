import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import type { AgentCatalogItem, AgentStatKind } from '../models/agentCatalog';
import {
  AgentOutputIcon,
  AgentStatIcon,
  AgentToolIcon,
  PlayIcon,
  PlusIcon,
  VolumeIcon,
  VolumeOffIcon,
} from './AgentIcons';

type Props = {
  agent: AgentCatalogItem | null;
  isOpen: boolean;
  hired?: boolean;
  hiring?: boolean;
  onClose: () => void;
  onPrimary: () => void;
};

const CAPABILITY_ICONS: Record<string, AgentStatKind[]> = {
  sourcing: ['search', 'score', 'users', 'list'],
  campaign: ['bolt', 'fire', 'users', 'list'],
  screening: ['mail', 'refresh', 'reply', 'users'],
  interview: ['calendar', 'mail', 'route', 'users'],
  offer: ['mail', 'list', 'score', 'refresh'],
};

type CapabilityItem = { title: string; detail: string };

function parseCapabilities(raw: unknown): CapabilityItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item === 'string' && item.trim()) return [{ title: item, detail: '' }];
    if (item && typeof item === 'object' && 'title' in item) {
      const title = String((item as { title?: unknown }).title ?? '').trim();
      const detail = String((item as { detail?: unknown }).detail ?? '').trim();
      return title ? [{ title, detail }] : [];
    }
    return [];
  });
}

const CAPABILITY_TONES = [
  'bg-sky-50 text-sky-600',
  'bg-violet-50 text-violet-600',
  'bg-amber-50 text-amber-600',
  'bg-emerald-50 text-emerald-600',
];

const STAT_TONES = [
  'bg-sky-50 text-sky-600',
  'bg-indigo-50 text-indigo-600',
  'bg-violet-50 text-violet-600',
];

export default function AgentPreviewModal({
  agent,
  isOpen,
  hired = false,
  hiring = false,
  onClose,
  onPrimary,
}: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  const capabilityList = parseCapabilities(
    t(`aiAgents.agents.${agent?.id ?? 'sourcing'}.preview.capabilities`, {
      returnObjects: true,
    }),
  );

  const stopAvatar = () => {
    const video = videoRef.current;
    if (!video) return;
    video.loop = false;
    video.pause();
  };

  const playAvatar = () => {
    const video = videoRef.current;
    if (!video) return;
    video.loop = true;
    video.currentTime = 0;
    void video.play().catch(() => undefined);
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    speechRef.current = null;
    setPlaying(false);
  };

  useEffect(() => {
    if (!isOpen || !agent) return;
    playAvatar();
    return () => {
      stopSpeech();
      stopAvatar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, agent?.id]);

  if (!agent) return null;

  const isFuture = agent.availability === 'future';
  const primaryLabel = hired
    ? t('aiAgents.badge.hired')
    : isFuture
      ? t('aiAgents.actions.comingSoon')
      : hiring
        ? t('aiAgents.actions.hiring')
        : t('aiAgents.actions.hire');

  const sceneImage = `/agents/${agent.id}-scene.jpg`;
  const previewVideo = `/agents/${agent.id}-preview.mp4`;
  const script = t(`aiAgents.agents.${agent.id}.preview.script`, { firstName: agent.firstName });
  const headline = t(`aiAgents.agents.${agent.id}.preview.headline`);
  const capabilityIcons = CAPABILITY_ICONS[agent.id] ?? ['search', 'users', 'list'];

  const replayVoice = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = 1;
    utterance.onend = () => {
      setPlaying(false);
      stopAvatar();
    };
    utterance.onerror = () => {
      setPlaying(false);
      stopAvatar();
    };
    speechRef.current = utterance;
    setMuted(false);
    setPlaying(true);
    playAvatar();
    window.speechSynthesis.speak(utterance);
  };

  const closeAndStop = () => {
    stopSpeech();
    stopAvatar();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAndStop}
      width="xl"
      title={agent.firstName}
      subtitle={t(`aiAgents.agents.${agent.id}.name`)}
      titleIcon={
        <img
          src={agent.avatar}
          alt=""
          className={`w-12 h-12 rounded-xl object-cover object-top ${agent.avatarBg}`}
        />
      }
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={closeAndStop} className="!text-sm">
            {t('common.actions.close')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onPrimary}
            disabled={hired || isFuture || hiring}
            className="!text-sm inline-flex items-center gap-1.5"
          >
            {!hired && !isFuture ? <PlusIcon className="w-4 h-4" /> : null}
            {primaryLabel}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:items-start">
        <div className="lg:sticky lg:top-0 space-y-3">
          <div
            className={`relative overflow-hidden rounded-2xl aspect-[3/4] max-h-[min(58vh,520px)] mx-auto w-full ${agent.avatarBg}`}
          >
            <img
              src={sceneImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-top"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = agent.avatar;
              }}
            />
            <video
              ref={videoRef}
              key={previewVideo}
              className="relative h-full w-full object-cover object-center"
              src={previewVideo}
              poster={sceneImage}
              muted
              playsInline
              preload="metadata"
            />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {agent.stats.map((stat, index) => (
              <div key={stat.id} className="rounded-xl border border-gray-100 bg-[#F8FAFC] px-2 py-2 text-center">
                <div
                  className={`mx-auto w-7 h-7 rounded-lg flex items-center justify-center ${STAT_TONES[index % STAT_TONES.length]}`}
                >
                  <AgentStatIcon kind={stat.icon} className="w-3.5 h-3.5" />
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-dark-text leading-snug">
                  {t(`aiAgents.catalog.capabilities.${agent.id}.${stat.id}`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 min-w-0">
          <p className="text-base font-semibold text-dark-text leading-snug">{headline}</p>

          <div className={`rounded-2xl border border-gray-100 px-4 py-3.5 ${agent.avatarBg}`}>
            <p className="text-sm text-dark-text leading-relaxed">{script}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={replayVoice}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-white bg-[#0077E6] hover:bg-[#0066CC]"
              >
                <PlayIcon className="w-3.5 h-3.5" />
                {playing ? t('aiAgents.preview.playingVoice') : t('aiAgents.preview.replayVoice')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !muted;
                  setMuted(next);
                  if (next) stopSpeech();
                }}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50"
              >
                {muted ? <VolumeOffIcon className="w-3.5 h-3.5" /> : <VolumeIcon className="w-3.5 h-3.5" />}
                {muted ? t('aiAgents.preview.unmuteVoice') : t('aiAgents.preview.muteVoice')}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-dark-text">{t('aiAgents.preview.tools')}</h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {agent.tools.map((tool) => (
                <span
                  key={tool.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-white shadow-sm text-sm text-dark-text"
                >
                  <AgentToolIcon kind={tool.kind} className="w-5 h-5" />
                  {t(`aiAgents.agents.${agent.id}.tools.${tool.id}`)}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-dark-text">{t('aiAgents.preview.capabilities')}</h3>
            <div className="mt-2.5 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
              <img
                src={sceneImage}
                alt=""
                className="w-full h-48 object-cover object-top"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = agent.avatar;
                }}
              />
            </div>
            <ul className="mt-3 space-y-2">
              {capabilityList.map((item, index) => (
                <li
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-[#F8FAFC] px-3 py-2.5"
                >
                  <span
                    className={`mt-0.5 inline-flex w-8 h-8 rounded-lg items-center justify-center shrink-0 ${CAPABILITY_TONES[index % CAPABILITY_TONES.length]}`}
                  >
                    <AgentStatIcon kind={capabilityIcons[index] ?? 'search'} className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-dark-text leading-snug">{item.title}</span>
                    {item.detail ? (
                      <span className="block mt-0.5 text-sm text-gray-600 leading-relaxed">{item.detail}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-dark-text">{t('aiAgents.preview.outputs')}</h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {agent.outputs.map((output) => (
                <span
                  key={output.id}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-white shadow-sm text-sm text-dark-text"
                >
                  <AgentOutputIcon outputId={output.id} className="w-4 h-4" />
                  {t(`aiAgents.agents.${agent.id}.outputs.${output.id}`)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

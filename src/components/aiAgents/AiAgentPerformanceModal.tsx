import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Card from '../Card';
import Button from '../Button';
import type { AiAgentsJobConfig } from '../../types/aiAgents';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobId: string;
  config: AiAgentsJobConfig | null;
}

function buildProjection(cfg: AiAgentsJobConfig, jobId: string) {
  const cap = Math.max(1, cfg.sourcing.maxProcessed);
  const conv = Math.min(100, Math.max(0, cfg.sourcing.autoConversionPercent)) / 100;
  const seed = jobId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const j = (i: number) => 0.94 + ((Math.sin(seed * 0.7 + i * 1.3) + 1) / 2) * 0.12;

  let n = cap * (2.2 + j(0) * 0.6);
  const funnel: { id: string; n: number }[] = [];
  funnel.push({ id: 'sourcing', n: Math.round(n) });
  n *= (0.12 + conv * 0.68) * j(1);
  funnel.push({ id: 'screening', n: Math.round(n) });
  n *= 0.48 * j(2);
  funnel.push({ id: 'interview', n: Math.round(n) });
  n *= 0.58 * j(3);
  const rawOffer = Math.round(n);
  const maxOffers = Math.max(1, cfg.offer.maxOffersToSend ?? 10);
  const offerN = Math.min(rawOffer, maxOffers);
  funnel.push({ id: 'offer', n: offerN });
  n = offerN * 0.42 * j(4);
  funnel.push({ id: 'hired', n: Math.max(0, Math.round(n)) });

  const base = funnel[0]?.n || cap;
  const series = Array.from({ length: 7 }, (_, d) => {
    const growth = 0.72 + (d / 6) * 0.38 + j(d + 5) * 0.08;
    return Math.round(base * growth * (0.55 + conv * 0.35));
  });

  const automationShare = Math.min(0.94, 0.52 + conv * 0.28 + j(6) * 0.08);
  const hoursSaved = Math.round(cap * (1.8 + j(7) * 1.2) * automationShare);

  return { funnel, series, automationShare: Math.round(automationShare * 100), hoursSaved };
}

function FunnelChart({
  funnel,
  labelFor,
}: {
  funnel: { id: string; n: number }[];
  labelFor: (id: string) => string;
}) {
  const max = Math.max(1, ...funnel.map((x) => x.n));
  return (
    <div className="space-y-2">
      {funnel.map((row) => {
        const w = Math.max(8, (row.n / max) * 100);
        return (
          <div key={row.id}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{labelFor(row.id)}</span>
              <span className="font-mono tabular-nums">{row.n.toLocaleString()}</span>
            </div>
            <div className="h-2.5 rounded-full bg-purple-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-purple-600 transition-all"
                style={{ width: `${w}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SparklineChart({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const w = 100;
  const h = 36;
  const pad = 4;
  const pts = values
    .map((v, i) => {
      const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14" preserveAspectRatio="none">
      <defs>
        <linearGradient id="aiPerfLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(124, 58, 237)" />
          <stop offset="100%" stopColor="rgb(147, 51, 234)" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="url(#aiPerfLine)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={pts} />
      {values.map((v, i) => {
        const x = pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r="2.2" className="fill-primary" />;
      })}
    </svg>
  );
}

function StageBars({
  funnel,
  labelFor,
}: {
  funnel: { id: string; n: number }[];
  labelFor: (id: string) => string;
}) {
  const stages = funnel.filter((x) => x.id !== 'hired');
  const max = Math.max(1, ...stages.map((x) => x.n));
  return (
    <div className="flex items-end justify-between gap-1 h-28 pt-2">
      {stages.map((s) => {
        const h = Math.max(12, (s.n / max) * 100);
        return (
          <div key={s.id} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="w-full flex flex-col justify-end h-20">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-violet-200 to-primary/80 mx-auto max-w-[2.5rem]"
                style={{ height: `${h}%` }}
                title={String(s.n)}
              />
            </div>
            <span className="text-[10px] text-gray-500 text-center leading-tight truncate w-full">{labelFor(s.id)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AiAgentPerformanceModal({ isOpen, onClose, jobTitle, jobId, config }: Props) {
  const { t } = useTranslation();
  const cfg = config ?? null;
  const projection = useMemo(() => {
    if (!cfg) return null;
    return buildProjection(cfg, jobId);
  }, [cfg, jobId]);

  const labelFor = (id: string) => {
    if (id === 'hired') return t('aiAgents.metrics.stageHired');
    return t(`aiAgents.tabs.${id as 'sourcing' | 'screening' | 'interview' | 'offer'}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('aiAgents.metrics.title')}
      subtitle={jobTitle ? `${jobTitle} · ${jobId}` : jobId}
      width="xl"
      footer={
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.actions.close')}
          </Button>
        </div>
      }
    >
      {!cfg || !projection ? (
        <p className="text-sm text-gray-600">{t('aiAgents.metrics.noConfig')}</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{t('aiAgents.metrics.disclaimer')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 border border-purple-100 shadow-none bg-white">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('aiAgents.metrics.kpiAutomation')}</p>
              <p className="text-2xl font-bold text-primary mt-1 tabular-nums">{projection.automationShare}%</p>
              <p className="text-xs text-gray-500 mt-1">{t('aiAgents.metrics.kpiAutomationHint')}</p>
            </Card>
            <Card className="p-4 border border-purple-100 shadow-none bg-white">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('aiAgents.metrics.kpiHours')}</p>
              <p className="text-2xl font-bold text-dark-text mt-1 tabular-nums">{projection.hoursSaved}</p>
              <p className="text-xs text-gray-500 mt-1">{t('aiAgents.metrics.kpiHoursHint')}</p>
            </Card>
            <Card className="p-4 border border-purple-100 shadow-none bg-white">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('aiAgents.metrics.kpiTargetConv')}</p>
              <p className="text-2xl font-bold text-dark-text mt-1 tabular-nums">{cfg.sourcing.autoConversionPercent}%</p>
              <p className="text-xs text-gray-500 mt-1">{t('aiAgents.metrics.kpiTargetConvHint')}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 border border-gray-100 shadow-none">
              <h3 className="text-sm font-semibold text-dark-text mb-3">{t('aiAgents.metrics.funnelTitle')}</h3>
              <FunnelChart funnel={projection.funnel} labelFor={labelFor} />
            </Card>
            <Card className="p-4 border border-gray-100 shadow-none">
              <h3 className="text-sm font-semibold text-dark-text mb-1">{t('aiAgents.metrics.trendTitle')}</h3>
              <p className="text-xs text-gray-500 mb-2">{t('aiAgents.metrics.trendSubtitle')}</p>
              <SparklineChart values={projection.series} />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
                {projection.series.map((_, i) => (
                  <span key={i}>D{i + 1}</span>
                ))}
              </div>
            </Card>
            <Card className="p-4 border border-gray-100 shadow-none lg:col-span-2">
              <h3 className="text-sm font-semibold text-dark-text mb-1">{t('aiAgents.metrics.volumeTitle')}</h3>
              <p className="text-xs text-gray-500 mb-3">{t('aiAgents.metrics.volumeSubtitle')}</p>
              <StageBars funnel={projection.funnel} labelFor={labelFor} />
            </Card>
          </div>
        </div>
      )}
    </Modal>
  );
}

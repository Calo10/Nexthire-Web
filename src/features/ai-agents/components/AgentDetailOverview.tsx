import { type ReactNode, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AgentDetailDto, AgentDetailTab } from '../models/agentDetail';
import { formatDelta, formatTokenCount } from '../models/agentHome';
import { AgentStatIcon, ChevronRightIcon, PlayIcon } from './AgentIcons';

type Props = {
  detail: AgentDetailDto;
  onTab: (tab: AgentDetailTab) => void;
  mode?: 'full' | 'usage';
  jobLabel?: string;
};

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-4 ${className}`}>
      {children}
    </section>
  );
}

function CardHead({
  icon,
  iconClass,
  title,
  action,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-8 h-8 rounded-lg inline-flex items-center justify-center shrink-0 ${iconClass}`}>
          {icon}
        </span>
        <h3 className="text-sm font-semibold text-dark-text">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function TrendChart({ labels, runs, results }: { labels: string[]; runs: number[]; results: number[] }) {
  const width = 520;
  const height = 168;
  const padX = 8;
  const padY = 12;
  const values = [...runs, ...results];
  const max = Math.max(1, ...values);
  const min = Math.min(...values) * 0.35;
  const toCoords = (points: number[]) =>
    points.map((value, index) => {
      const x = padX + (index / Math.max(points.length - 1, 1)) * (width - padX * 2);
      const y = height - padY - ((value - min) / Math.max(max - min, 1)) * (height - padY * 2);
      return { x, y };
    });
  const runCoords = toCoords(runs);
  const resultCoords = toCoords(results);
  const toLine = (coords: { x: number; y: number }[]) => coords.map((point) => `${point.x},${point.y}`).join(' ');
  const toArea = (coords: { x: number; y: number }[]) =>
    `${padX},${height - padY} ${toLine(coords)} ${width - padX},${height - padY}`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[168px]" aria-hidden>
        <defs>
          <linearGradient id="detailRunFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {runCoords.length ? <polygon points={toArea(runCoords)} fill="url(#detailRunFill)" /> : null}
        <polyline
          points={toLine(runCoords)}
          fill="none"
          stroke="#7C3AED"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <polyline
          points={toLine(resultCoords)}
          fill="none"
          stroke="#38BDF8"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {runCoords.length ? (
          <circle cx={runCoords[runCoords.length - 1].x} cy={runCoords[runCoords.length - 1].y} r="3.5" fill="#7C3AED" />
        ) : null}
        {resultCoords.length ? (
          <circle
            cx={resultCoords[resultCoords.length - 1].x}
            cy={resultCoords[resultCoords.length - 1].y}
            r="3.5"
            fill="#38BDF8"
          />
        ) : null}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-gray-400 px-0.5">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function UsageDonut({ slices, total }: { slices: AgentDetailDto['usage']; total: number }) {
  const size = 132;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const safeTotal = Math.max(total, 1);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
      {slices.map((slice) => {
        const length = (slice.tokens / safeTotal) * circumference;
        const circle = (
          <circle
            key={slice.id}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={stroke}
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += length;
        return circle;
      })}
    </svg>
  );
}

export default function AgentDetailOverview({ detail, onTab, mode = 'full', jobLabel }: Props) {
  const { t } = useTranslation();
  const { agent, kpis } = detail;
  const usageTotal = detail.usage.reduce((sum, slice) => sum + slice.tokens, 0);
  const isSourcing = agent.id === 'sourcing';
  const isCampaign = agent.id === 'campaign';
  const isMessaging = agent.id === 'screening' || agent.id === 'interview' || agent.id === 'offer';

  const tags = useMemo(() => {
    const items: string[] = [];
    if (agent.context?.cadence) items.push(t(`aiAgents.cadence.${agent.context.cadence}`, { defaultValue: agent.context.cadence }));
    if (isSourcing && agent.context?.autoConversionPercent != null) {
      items.push(t('aiAgents.detail.tags.conversion', { percent: agent.context.autoConversionPercent }));
    }
    if (isSourcing && agent.context?.maxProcessed != null) {
      items.push(t('aiAgents.detail.tags.maxProcessed', { count: agent.context.maxProcessed }));
    }
    if (isCampaign && agent.context?.campaignDailyBudget != null) {
      items.push(t('aiAgents.detail.tags.budget', { amount: agent.context.campaignDailyBudget }));
    }
    if (isCampaign && agent.context?.channel) {
      items.push(t(`aiAgents.campaign.platforms.${agent.context.channel}`, { defaultValue: agent.context.channel }));
    }
    if (isMessaging && agent.context?.channel) {
      items.push(t(`aiAgents.channel.${agent.context.channel}`, { defaultValue: agent.context.channel }));
    }
    if (isMessaging && agent.context?.responseWaitHours != null) {
      items.push(t('aiAgents.detail.tags.waitHours', { hours: agent.context.responseWaitHours }));
    }
    if (isMessaging && agent.context?.maxProcessed != null) {
      items.push(t('aiAgents.detail.tags.maxProcessed', { count: agent.context.maxProcessed }));
    }
    if (jobLabel) items.push(jobLabel);
    return items;
  }, [agent.context, isCampaign, isMessaging, isSourcing, jobLabel, t]);

  const hasBrief = Boolean(
    agent.context?.notes?.trim() ||
      agent.context?.jobId ||
      (isMessaging && (agent.context?.templateId || agent.context?.stageId)),
  );

  const objective =
    agent.context?.notes?.trim() ||
    t(`aiAgents.detail.agents.${agent.id}.objective`, {
      defaultValue: t(`aiAgents.agents.${agent.id}.summary`),
    });

  const resultsLabel = t(`aiAgents.detail.kpis.results.${agent.id}`, {
    defaultValue: t('aiAgents.detail.kpis.results.default'),
  });

  const kpisRow = [
    {
      id: 'runs',
      label: t('aiAgents.detail.kpis.runs'),
      value: kpis.runs.toLocaleString(),
      delta: kpis.runsDelta,
      iconBg: 'bg-emerald-50 text-emerald-600',
      icon: <PlayIcon className="w-4 h-4" />,
      hint: kpis.runs === 0 ? t('aiAgents.detail.kpis.runsEmpty') : undefined,
    },
    {
      id: 'results',
      label: resultsLabel,
      value: kpis.results.toLocaleString(),
      delta: kpis.resultsDelta,
      iconBg: 'bg-emerald-50 text-emerald-600',
      icon: <AgentStatIcon kind="users" className="w-4 h-4" />,
      hint:
        kpis.resultsHint ||
        (kpis.results === 0 ? t('aiAgents.detail.kpis.resultsEmpty') : undefined),
    },
    {
      id: 'tokens',
      label: t('aiAgents.detail.kpis.tokens'),
      value: formatTokenCount(kpis.tokens),
      delta: kpis.tokensDelta,
      iconBg: 'bg-violet-50 text-violet-600',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      ),
    },
    {
      id: 'workflows',
      label: t('aiAgents.detail.kpis.workflows'),
      value: kpis.workflows.toLocaleString(),
      delta: kpis.workflowsDelta,
      iconBg: 'bg-emerald-50 text-emerald-600',
      icon: <AgentStatIcon kind="bolt" className="w-4 h-4" />,
    },
  ];

  const trendCard = (
    <Card>
      <CardHead
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 16l5-5 4 4 7-8" />
          </svg>
        }
        iconClass="bg-violet-50 text-violet-600"
        title={t('aiAgents.detail.activityTrend')}
        action={
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              {t('aiAgents.detail.legendRuns')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              {resultsLabel}
            </span>
          </div>
        }
      />
      <p className="text-xs text-gray-500 -mt-1 mb-2">{t('aiAgents.detail.activityTrendHint')}</p>
      <TrendChart labels={detail.trend.labels} runs={detail.trend.runs} results={detail.trend.results} />
    </Card>
  );

  const usageCard = (
    <Card>
      <CardHead
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
          </svg>
        }
        iconClass="bg-violet-50 text-violet-600"
        title={t('aiAgents.detail.resourceUsage')}
        action={
          <span className="text-[11px] font-medium text-[#4F46E5] bg-[#EEF2FF] h-6 px-2 rounded-md inline-flex items-center">
            7d
          </span>
        }
      />
      <div className="flex items-center gap-3">
        <div className="relative">
          <UsageDonut slices={detail.usage} total={usageTotal} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-sm font-bold text-dark-text leading-none">{formatTokenCount(kpis.tokens)}</p>
            <p className="mt-1 text-[10px] text-gray-400 leading-tight max-w-[4.5rem]">
              {t('aiAgents.detail.tokensUsed')}
            </p>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {detail.usage.map((slice) => (
            <li key={slice.id} className="flex items-center justify-between gap-2 text-[11px] text-gray-600">
              <span className="inline-flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="truncate">
                  {t(`aiAgents.detail.usageSlices.${slice.labelKey}`)}
                  {usageTotal ? ` (${Math.round((slice.tokens / Math.max(usageTotal, 1)) * 100)}%)` : ''}
                </span>
              </span>
              <span className="font-medium text-dark-text shrink-0">{formatTokenCount(slice.tokens)}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );

  if (mode === 'usage') {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)] gap-4">
        {trendCard}
        {usageCard}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpisRow.map((kpi) => (
          <Card key={kpi.id} className="p-3.5">
            <div className="flex items-center gap-2.5">
              <span className={`w-9 h-9 rounded-xl inline-flex items-center justify-center ${kpi.iconBg}`}>
                {kpi.icon}
              </span>
              <p className="text-[11px] text-gray-500 leading-tight">{kpi.label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-dark-text leading-none">{kpi.value}</p>
            {kpi.hint ? (
              <p className="mt-1.5 text-[11px] font-medium text-gray-500">{kpi.hint}</p>
            ) : kpi.delta ? (
              <p className="mt-1.5 text-[11px] font-medium text-emerald-600">
                {formatDelta(kpi.delta)}{' '}
                <span className="text-gray-400 font-normal">{t('aiAgents.home.vsPrior')}</span>
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-gray-400">&nbsp;</p>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)] gap-4">
        {trendCard}

        <div className="space-y-4">
          <Card>
            <CardHead
              icon={<AgentStatIcon kind="search" className="w-4 h-4" />}
              iconClass="bg-violet-50 text-violet-600"
              title={t('aiAgents.detail.currentObjective')}
              action={
                <button
                  type="button"
                  onClick={() => onTab('context')}
                  className="text-xs font-medium text-[#0077E6] hover:text-[#0066CC]"
                >
                  {t('aiAgents.detail.edit')}
                </button>
              }
            />
            <p className="text-sm text-gray-600 leading-relaxed">{objective}</p>
            {hasBrief && tags.length > 0 ? (
              <div className="mt-3">
                <p className="text-[11px] font-medium text-gray-400 mb-1.5">{t('aiAgents.detail.focus')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded-md bg-[#F5F3FF] text-[11px] font-medium text-[#5B4BDB]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onTab('context')}
                className="mt-3 text-left text-sm text-gray-500 hover:text-[#0077E6]"
              >
                {t(`aiAgents.detail.emptyContext.${agent.id}`, {
                  defaultValue: t('aiAgents.detail.emptyContext.default'),
                })}
              </button>
            )}
          </Card>

          <Card>
            <CardHead
              icon={<AgentStatIcon kind="list" className="w-4 h-4" />}
              iconClass="bg-sky-50 text-sky-600"
              title={t('aiAgents.detail.destinations')}
            />
            <ul className="space-y-1">
              {detail.destinations.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-gray-50 ${
                      item.pending ? 'text-amber-700' : 'text-dark-text'
                    }`}
                  >
                    <span>
                      {t(`aiAgents.detail.destinationNames.${agent.id}.${item.id}`, {
                        defaultValue: t(`aiAgents.detail.destinationNames.shared.${item.id}`, {
                          defaultValue: item.id,
                        }),
                      })}
                      {item.pending ? (
                        <span className="ml-1 text-xs text-amber-600">
                          — {t('aiAgents.detail.destinationPending')}
                        </span>
                      ) : null}
                    </span>
                    <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

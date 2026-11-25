import { useTranslation } from 'react-i18next';
import type { HrAgentHireStatus } from '../lib/hrAgentHireStore';
import type { HrAgentCatalogItem } from '../models/hrAgentCatalog';

export type HrHiredAgentView = HrAgentCatalogItem & {
  status: HrAgentHireStatus;
  runs: number;
  tokens: number;
};

type Props = {
  agent: HrHiredAgentView;
  onOpen: () => void;
  onRemove: () => void;
};

const STATUS_TONES: Record<HrAgentHireStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  paused: 'bg-slate-100 text-slate-600',
  busy: 'bg-amber-50 text-amber-700',
  inactive: 'bg-gray-100 text-gray-500',
};

const STATUS_DOT: Record<HrAgentHireStatus, string> = {
  active: 'bg-emerald-500',
  paused: 'bg-slate-400',
  busy: 'bg-amber-500',
  inactive: 'bg-gray-400',
};

function formatTokenCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1000)}K`;
  return String(value);
}

export default function HrHiredAgentCard({ agent, onOpen, onRemove }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <article className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <img
          src={agent.avatar}
          alt=""
          className={`w-14 h-14 rounded-2xl object-cover object-top shrink-0 ${agent.avatarBg}`}
        />
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-[11px] font-medium ${STATUS_TONES[agent.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[agent.status]}`} />
            {t(`coreHrAiAgents.home.status.${agent.status}`)}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 inline-flex items-center justify-center"
            aria-label={t('coreHrAiAgents.actions.remove')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-dark-text leading-tight">{agent.firstName}</h3>
      <p className="mt-0.5 text-[11px] font-medium text-teal-700">{t(`coreHrAiAgents.agents.${agent.id}.name`)}</p>
      <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
        {t(`coreHrAiAgents.agents.${agent.id}.description`)}
      </p>

      <div className="mt-auto pt-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 mr-1.5">{t('coreHrAiAgents.home.runs')}</span>
            <span className="font-semibold text-dark-text">{agent.runs.toLocaleString(i18n.language)}</span>
          </span>
          <span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 mr-1.5">{t('coreHrAiAgents.home.tokens')}</span>
            <span className="font-semibold text-dark-text">{formatTokenCount(agent.tokens)}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 w-full h-9 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600"
        >
          {t('coreHrAiAgents.actions.open')}
        </button>
      </div>
    </article>
  );
}

import { useTranslation } from 'react-i18next';
import type { AgentHireStatus } from '../api/aiAgentsApi';
import type { HiredAgentView } from '../models/agentHome';
import { formatTokenCount } from '../models/agentHome';

type Props = {
  agent: HiredAgentView;
  onOpen: () => void;
  onViewActivity: () => void;
  onConfigure: () => void;
  onRemove: () => void;
};

const STATUS_TONES: Record<AgentHireStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  paused: 'bg-slate-100 text-slate-600',
  busy: 'bg-amber-50 text-amber-700',
  inactive: 'bg-gray-100 text-gray-500',
};

const STATUS_DOT: Record<AgentHireStatus, string> = {
  active: 'bg-emerald-500',
  paused: 'bg-slate-400',
  busy: 'bg-amber-500',
  inactive: 'bg-gray-400',
};

export default function HiredAgentCard({ agent, onOpen, onViewActivity, onConfigure, onRemove }: Props) {
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
          <span
            className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full text-[11px] font-medium ${STATUS_TONES[agent.status]}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[agent.status]}`} />
            {t(`aiAgents.home.status.${agent.status}`)}
          </span>
          <button
            type="button"
            onClick={onRemove}
            className="w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 inline-flex items-center justify-center"
            aria-label={t('aiAgents.actions.remove')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="mt-3 text-sm font-semibold text-dark-text leading-tight">{agent.firstName}</h3>
      <p className="mt-0.5 text-[11px] font-medium text-[#0077E6]">{t(`aiAgents.agents.${agent.id}.name`)}</p>
      <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
        {t(`aiAgents.agents.${agent.id}.description`)}
      </p>

      <div className="mt-auto pt-3">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 mr-1.5">
              {t('aiAgents.home.runs')}
            </span>
            <span className="font-semibold text-dark-text">{agent.runs.toLocaleString(i18n.language)}</span>
          </span>
          <span>
            <span className="text-[10px] uppercase tracking-wide text-gray-400 mr-1.5">
              {t('aiAgents.home.tokens')}
            </span>
            <span className="font-semibold text-dark-text">{formatTokenCount(agent.tokens)}</span>
          </span>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpen}
            className="flex-1 h-8 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-[#0077E6] to-[#00AAFF] hover:from-[#0066CC] hover:to-[#0099EE]"
          >
            {t('aiAgents.home.open')}
          </button>
          <button
            type="button"
            onClick={onViewActivity}
            className="flex-1 h-8 rounded-lg text-xs font-medium text-dark-text border border-gray-200 bg-white hover:bg-gray-50"
          >
            {t('aiAgents.home.viewActivity')}
          </button>
          <button
            type="button"
            onClick={onConfigure}
            className="flex-1 h-8 rounded-lg text-xs font-medium text-dark-text border border-gray-200 bg-white hover:bg-gray-50"
          >
            {t('aiAgents.actions.configure')}
          </button>
        </div>
      </div>
    </article>
  );
}

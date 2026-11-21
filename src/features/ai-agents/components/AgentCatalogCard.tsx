import { useTranslation } from 'react-i18next';
import type { AgentCatalogItem } from '../models/agentCatalog';

type Props = {
  agent: AgentCatalogItem;
  selected: boolean;
  hired: boolean;
  hiring?: boolean;
  onSelect: () => void;
  onPrimary: () => void;
  onPreview: () => void;
};

export default function AgentCatalogCard({
  agent,
  selected,
  hired,
  hiring = false,
  onSelect,
  onPrimary,
  onPreview,
}: Props) {
  const { t } = useTranslation();
  const isFuture = agent.availability === 'future';
  const canHire = !isFuture;
  const primaryLabel = hired
    ? t('aiAgents.badge.hired')
    : isFuture
      ? t('aiAgents.actions.comingSoon')
      : hiring
        ? t('aiAgents.actions.hiring')
        : t('aiAgents.actions.hire');

  return (
    <article
      className={`flex flex-col h-full bg-white rounded-2xl border overflow-hidden transition-all ${
        selected
          ? 'border-2 border-[#0077E6] shadow-sm'
          : 'border-2 border-gray-200 hover:border-[#0077E6]/40 hover:shadow-sm'
      }`}
    >
      <button type="button" onClick={onSelect} className="text-left flex-1">
        <div className={`relative aspect-[4/3] overflow-hidden ${hired ? 'bg-gray-200' : agent.avatarBg}`}>
          <img
            src={agent.avatar}
            alt={agent.firstName}
            className={`w-full h-full object-cover object-top ${hired ? 'grayscale opacity-80' : ''}`}
          />
          {hired ? (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide bg-emerald-600 text-white">
              {t('aiAgents.badge.hired')}
            </span>
          ) : null}
          <span
            className={`absolute top-2.5 right-2.5 max-w-[calc(100%-1.25rem)] px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide truncate ${
              isFuture ? 'bg-slate-500 text-white' : 'bg-[#1E3A5F] text-white'
            }`}
          >
            {t(`aiAgents.badge.${agent.availability}`)}
          </span>
        </div>
        <div className="px-3.5 pt-3 pb-2">
          <h3 className="text-sm font-semibold text-dark-text leading-tight">{agent.firstName}</h3>
          <p className="mt-1 text-[11px] font-medium text-[#0077E6]">{t(`aiAgents.agents.${agent.id}.name`)}</p>
          <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {t(`aiAgents.agents.${agent.id}.description`)}
          </p>
        </div>
      </button>
      <div className="px-3.5 pb-3.5 mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onPrimary}
          disabled={hired || !canHire || hiring}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-[#0077E6] to-[#00AAFF] hover:from-[#0066CC] hover:to-[#0099EE] shadow-sm disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:shadow-none"
        >
          {!hired && canHire ? (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          ) : null}
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium text-dark-text border border-gray-200 bg-white hover:bg-gray-50"
        >
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {t('aiAgents.actions.preview')}
        </button>
      </div>
    </article>
  );
}

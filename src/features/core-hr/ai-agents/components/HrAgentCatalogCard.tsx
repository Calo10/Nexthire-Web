import { useTranslation } from 'react-i18next';
import type { HrAgentCatalogItem } from '../models/hrAgentCatalog';

type Props = {
  agent: HrAgentCatalogItem;
  selected: boolean;
  hired: boolean;
  hiring?: boolean;
  onSelect: () => void;
  onPrimary: () => void;
  onPreview: () => void;
};

export default function HrAgentCatalogCard({
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
    ? t('coreHrAiAgents.badge.hired')
    : isFuture
      ? t('coreHrAiAgents.actions.comingSoon')
      : hiring
        ? t('coreHrAiAgents.actions.hiring')
        : t('coreHrAiAgents.actions.hire');

  return (
    <article
      className={`flex flex-col h-full bg-white rounded-2xl border overflow-hidden transition-all ${
        selected
          ? 'border-2 border-teal-600 shadow-sm'
          : 'border-2 border-gray-200 hover:border-teal-600/40 hover:shadow-sm'
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
              {t('coreHrAiAgents.badge.hired')}
            </span>
          ) : null}
          <span
            className={`absolute top-2.5 right-2.5 max-w-[calc(100%-1.25rem)] px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide truncate ${
              isFuture ? 'bg-slate-500 text-white' : 'bg-teal-900 text-white'
            }`}
          >
            {t(`coreHrAiAgents.badge.${agent.availability}`)}
          </span>
        </div>
        <div className="px-3.5 pt-3 pb-2">
          <h3 className="text-sm font-semibold text-dark-text leading-tight">{agent.firstName}</h3>
          <p className="mt-1 text-[11px] font-medium text-teal-700">{t(`coreHrAiAgents.agents.${agent.id}.name`)}</p>
          <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
            {t(`coreHrAiAgents.agents.${agent.id}.description`)}
          </p>
        </div>
      </button>
      <div className="px-3.5 pb-3.5 mt-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onPrimary}
          disabled={hired || !canHire || hiring}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-sm disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:shadow-none"
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
          className="h-8 px-2.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50"
        >
          {t('coreHrAiAgents.actions.preview')}
        </button>
      </div>
    </article>
  );
}

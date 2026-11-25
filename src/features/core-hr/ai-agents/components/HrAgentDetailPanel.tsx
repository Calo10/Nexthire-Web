import { useTranslation } from 'react-i18next';
import type { HrAgentCatalogItem } from '../models/hrAgentCatalog';

type Props = {
  agent: HrAgentCatalogItem;
  hired: boolean;
  hiring?: boolean;
  onHire: () => void;
};

export default function HrAgentDetailPanel({ agent, hired, hiring = false, onHire }: Props) {
  const { t } = useTranslation();
  const isFuture = agent.availability === 'future';

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className={`relative aspect-[5/3] ${agent.avatarBg}`}>
        <img src={agent.avatar} alt="" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-10">
          <p className="text-lg font-semibold text-white">{agent.firstName}</p>
          <p className="text-sm text-white/85">{t(`coreHrAiAgents.agents.${agent.id}.name`)}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('coreHrAiAgents.catalog.about')}</p>
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{t(`coreHrAiAgents.agents.${agent.id}.summary`)}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('coreHrAiAgents.catalog.bestFor')}</p>
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{t(`coreHrAiAgents.agents.${agent.id}.bestFor`)}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t('coreHrAiAgents.catalog.capabilities')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {agent.capabilities.map((cap) => (
              <span
                key={cap}
                className="inline-flex items-center rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-medium text-teal-800"
              >
                {t(`coreHrAiAgents.agents.${agent.id}.capabilities.${cap}`)}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onHire}
          disabled={hired || isFuture || hiring}
          className="w-full h-10 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500"
        >
          {hired
            ? t('coreHrAiAgents.badge.hired')
            : isFuture
              ? t('coreHrAiAgents.actions.comingSoon')
              : hiring
                ? t('coreHrAiAgents.actions.hiring')
                : t('coreHrAiAgents.actions.hire')}
        </button>
      </div>
    </aside>
  );
}

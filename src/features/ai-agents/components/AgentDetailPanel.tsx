import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { AgentCatalogItem } from '../models/agentCatalog';
import {
  AgentOutputIcon,
  AgentSectionIcon,
  AgentStatIcon,
  AgentTabIcon,
  AgentToolIcon,
  ChevronIcon,
  PlusIcon,
  type AgentTabId,
} from './AgentIcons';

type TabId = AgentTabId;

type Props = {
  agent: AgentCatalogItem;
  hired?: boolean;
  hiring?: boolean;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onHire?: () => void;
};

const TABS: TabId[] = ['overview', 'context', 'knowledge', 'tools', 'settings'];

const STAT_TONES = [
  { wrap: 'bg-sky-50 text-sky-600' },
  { wrap: 'bg-indigo-50 text-indigo-600' },
  { wrap: 'bg-violet-50 text-violet-600' },
];

function SectionCard({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: 'context' | 'tools' | 'outputs' | 'knowledge' | 'settings';
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left"
      >
        <span className="inline-flex items-center gap-2.5 min-w-0">
          <AgentSectionIcon id={icon} />
          <span className="text-sm font-semibold text-dark-text">{title}</span>
        </span>
        <ChevronIcon open={open} className="w-4 h-4 text-gray-300 shrink-0" />
      </button>
      {open ? <div className="px-3.5 pb-3.5">{children}</div> : null}
    </section>
  );
}

export default function AgentDetailPanel({
  agent,
  hired = false,
  hiring = false,
  activeTab,
  onTabChange,
  onHire,
}: Props) {
  const { t } = useTranslation();
  const isFuture = agent.availability === 'future';
  const roleName = t(`aiAgents.agents.${agent.id}.name`);
  const badge = t(`aiAgents.badge.${agent.availability}`);
  const statusKey = isFuture
    ? 'aiAgents.settings.statusFuture'
    : hired
      ? 'aiAgents.settings.statusHired'
      : 'aiAgents.settings.statusReady';

  return (
    <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <img
            src={agent.avatar}
            alt=""
            className={`w-16 h-16 rounded-2xl object-cover object-top shrink-0 ${
              hired ? 'grayscale opacity-80 bg-gray-200' : agent.avatarBg
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-dark-text leading-tight">{agent.firstName}</h2>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      isFuture ? 'bg-slate-500 text-white' : 'bg-[#1E3A5F] text-white'
                    }`}
                  >
                    {badge}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-[#0077E6] flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {roleName}
                </p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 flex items-center justify-center"
                aria-label={t('aiAgents.actions.more')}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {t(`aiAgents.agents.${agent.id}.summary`)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {agent.stats.map((stat, index) => (
            <div key={stat.id} className="rounded-xl border border-gray-100 bg-[#F8FAFC] px-2.5 py-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${STAT_TONES[index % STAT_TONES.length].wrap}`}
              >
                <AgentStatIcon kind={stat.icon} className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-gray-600 mt-2 leading-snug">
                {t(`aiAgents.catalog.capabilities.${agent.id}.${stat.id}`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-2 pt-2 border-b border-gray-100 overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-[#0077E6] text-[#0077E6]'
                    : 'border-transparent text-gray-400 hover:text-dark-text'
                }`}
              >
                <AgentTabIcon id={tab} className="w-3.5 h-3.5" />
                {t(`aiAgents.tabs.${tab}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div key={agent.id} className="p-4 space-y-3 flex-1">
        {activeTab === 'overview' || activeTab === 'context' ? (
          <SectionCard icon="context" title={t('aiAgents.sections.context')}>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {t(`aiAgents.agents.${agent.id}.context`)}
            </p>
          </SectionCard>
        ) : null}

        {activeTab === 'overview' || activeTab === 'tools' ? (
          <SectionCard icon="tools" title={t('aiAgents.catalog.availableTools')}>
            <div className="flex flex-wrap gap-2">
              {agent.tools.map((tool) => (
                <span
                  key={tool.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-100 bg-[#F8FAFC] text-xs text-dark-text"
                >
                  <AgentToolIcon kind={tool.kind} className="w-3.5 h-3.5" />
                  {t(`aiAgents.agents.${agent.id}.tools.${tool.id}`)}
                </span>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {activeTab === 'overview' ? (
          <SectionCard icon="outputs" title={t('aiAgents.catalog.produces')}>
            <div className="flex flex-wrap gap-2">
              {agent.outputs.map((output) => (
                <span
                  key={output.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-100 bg-[#F8FAFC] text-xs text-dark-text"
                >
                  <AgentOutputIcon outputId={output.id} className="w-3.5 h-3.5" />
                  {t(`aiAgents.agents.${agent.id}.outputs.${output.id}`)}
                </span>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {activeTab === 'knowledge' ? (
          <SectionCard icon="knowledge" title={t('aiAgents.sections.knowledge')}>
            <ul className="space-y-2">
              {agent.knowledge.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-[#F8FAFC] px-3 py-2.5 text-sm text-gray-700"
                >
                  {t(`aiAgents.agents.${agent.id}.knowledge.${item.id}`)}
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        {activeTab === 'settings' ? (
          <SectionCard icon="settings" title={t('aiAgents.sections.settings')}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500">{t('aiAgents.settings.version')}</dt>
                <dd className="mt-0.5 font-medium text-dark-text">{badge}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t('aiAgents.settings.availability')}</dt>
                <dd className="mt-0.5 font-medium text-dark-text">{t(`aiAgents.badge.${agent.availability}`)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-gray-500">{t('aiAgents.settings.status')}</dt>
                <dd className="mt-0.5 font-medium text-dark-text">{t(statusKey)}</dd>
              </div>
            </dl>
          </SectionCard>
        ) : null}
      </div>

      <div className="p-4 pt-0">
        <div className="rounded-2xl bg-gradient-to-r from-[#EEF4FF] to-[#F4F0FF] border border-[#E0E7FF] px-4 py-4">
          <p className="text-sm font-semibold text-dark-text">
            {hired
              ? t('aiAgents.catalog.hiredTitle', { name: roleName })
              : isFuture
                ? t('aiAgents.actions.comingSoon')
                : t('aiAgents.catalog.hireTitle', { name: roleName })}
          </p>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            {hired
              ? t('aiAgents.catalog.hiredHint')
              : isFuture
                ? t('aiAgents.catalog.futureHint')
                : t(`aiAgents.agents.${agent.id}.launchHint`)}
          </p>
          <button
            type="button"
            disabled={hired || isFuture || hiring}
            onClick={() => onHire?.()}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#0077E6] to-[#00AAFF] hover:from-[#0066CC] hover:to-[#0099EE] shadow-sm disabled:from-gray-300 disabled:to-gray-300 disabled:text-gray-500 disabled:shadow-none"
          >
            {hired ? (
              t('aiAgents.badge.hired')
            ) : isFuture ? (
              t('aiAgents.actions.comingSoon')
            ) : (
              <>
                <PlusIcon className="w-3.5 h-3.5" />
                {hiring ? t('aiAgents.actions.hiring') : t('aiAgents.actions.hire')}
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

export type { TabId };

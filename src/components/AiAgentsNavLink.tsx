import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Props = {
  onNavigate?: () => void;
};

export default function AiAgentsNavLink({ onNavigate }: Props) {
  const { t } = useTranslation();

  return (
    <NavLink
      to="/app/ai-agents"
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all',
          'bg-gradient-to-r from-[#0077E6] to-[#7C3AED] text-white shadow-md shadow-[#7C3AED]/25',
          'hover:brightness-105 hover:shadow-lg hover:shadow-[#7C3AED]/30',
          isActive ? 'ring-2 ring-white/40 ring-offset-1 ring-offset-transparent' : '',
        ].join(' ')
      }
    >
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"
          />
        </svg>
      </span>
      <span className="flex-1 text-sm font-semibold tracking-tight">
        {t('navigation.aiAgents')}
      </span>
      <span className="inline-flex items-center rounded-md bg-white/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        AI
      </span>
    </NavLink>
  );
}

import type { AgentCatalogItem } from '../models/agentCatalog';

export default function AgentAvatar({
  agent,
  className = 'w-14 h-14 rounded-2xl',
  textClassName = 'text-lg',
}: {
  agent: Pick<AgentCatalogItem, 'firstName' | 'avatar' | 'avatarBg'>;
  className?: string;
  textClassName?: string;
}) {
  if (agent.avatar) {
    return (
      <img
        src={agent.avatar}
        alt=""
        className={`${className} object-cover object-top shrink-0 ${agent.avatarBg}`}
      />
    );
  }

  return (
    <span
      className={`${className} ${agent.avatarBg} inline-flex items-center justify-center font-bold text-dark-text shrink-0 border border-white/60`}
      aria-hidden
    >
      <span className={textClassName}>{agent.firstName.slice(0, 1)}</span>
    </span>
  );
}

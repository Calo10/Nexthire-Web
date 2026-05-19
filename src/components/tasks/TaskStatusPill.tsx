import { useTranslation } from 'react-i18next';

interface TaskStatusPillProps {
  status: string;
  className?: string;
}

export default function TaskStatusPill({ status, className = '' }: TaskStatusPillProps) {
  // Keep this component as the single source of truth for:
  // - task status colors
  // - task status display labels
  // so the table/kanban/detail views stay consistent.
  // (Uses i18n keys already present for Tasks.)
  const { t } = useTranslation();

  const normalized = (status || '').toLowerCase();

  const color = (() => {
    if (normalized === 'done' || normalized === 'completed') return 'bg-green-100 text-green-700';
    if (normalized === 'in_progress' || normalized === 'in progress') return 'bg-orange-100 text-orange-700';
    if (normalized === 'open' || normalized === 'todo') return 'bg-yellow-100 text-yellow-700';
    if (normalized === 'blocked') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  })();

  const label = (() => {
    if (normalized === 'in_progress' || normalized === 'in progress') return t('tasks.kanban.inProgress');
    if (normalized === 'done' || normalized === 'completed') return t('tasks.kanban.done');
    if (normalized === 'blocked') return t('tasks.kanban.blocked');
    if (normalized === 'open' || normalized === 'todo') return t('tasks.kanban.todo');
    // Fallback: title-case-ish
    if (!status) return '';
    const raw = String(status);
    return raw
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  })();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}


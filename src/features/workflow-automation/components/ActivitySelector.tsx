import {
  ACTIVITY_CATALOG,
  ACTIVITY_CATEGORIES,
  type ActivityDescriptor,
} from '../models/activityCatalog';
import ActivityIcon from './ActivityIcon';

type Props = {
  disabled?: boolean;
  onAdd: (descriptor: ActivityDescriptor) => void;
};

export default function ActivitySelector({ disabled = false, onAdd }: Props) {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-dark-text">Activities</h2>
        <p className="text-xs text-gray-500 mt-0.5">Add a step to the canvas</p>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-subtle p-3 space-y-4">
        {ACTIVITY_CATEGORIES.map((category) => {
          const items = ACTIVITY_CATALOG.filter((a) => a.category === category);
          if (items.length === 0) return null;
          return (
            <div key={category}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
                {category}
              </p>
              <ul className="space-y-1.5">
                {items.map((activity) => (
                  <li key={activity.type}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onAdd(activity)}
                      className="w-full text-left rounded-lg border border-gray-200 hover:border-[#00AAFF]/50 hover:bg-sky-50/40 px-2.5 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-[#0077E6]">
                          <ActivityIcon icon={activity.icon} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-dark-text truncate">
                            {activity.name}
                          </span>
                          <span className="block text-[11px] text-gray-500 line-clamp-2 mt-0.5">
                            {activity.description}
                          </span>
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

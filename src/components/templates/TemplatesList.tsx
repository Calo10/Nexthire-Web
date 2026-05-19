import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Template, TemplateChannel } from '../../types/templates';

function formatDaysAgo(dateString: string | null | undefined) {
  if (!dateString) return null;
  const ts = new Date(dateString).getTime();
  if (Number.isNaN(ts)) return null;
  const days = Math.max(0, Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000)));
  return days;
}

function bodyPreview(raw: string, max = 90) {
  const txt = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!txt) return '';
  return txt.length > max ? `${txt.slice(0, max)}…` : txt;
}

function SkeletonList() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-full mt-3 animate-pulse" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mt-2 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export default function TemplatesList({
  channel,
  templates,
  selectedId,
  isLoading,
  onSelect,
  onVariableClick,
}: {
  channel: TemplateChannel;
  templates: Template[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onVariableClick: (variable: string) => void;
}) {
  const { t } = useTranslation();

  const vars = useMemo(
    () => ['{{candidate_name}}', '{{job_title}}', '{{company_name}}', '{{current_user_name}}'],
    []
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Left header */}
      <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-dark-text">{t('templates.list.title')}</p>
          <p className="text-xs text-gray-600">{channel === 'email' ? t('templates.tabs.email') : t('templates.tabs.whatsapp')}</p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <SkeletonList />
        ) : templates.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-dark-text">{t('templates.empty.title')}</p>
            <p className="text-sm text-gray-600 mt-1">{t('templates.empty.subtitle')}</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {templates.map((tpl) => {
              const isSelected = tpl.id === selectedId;
              const daysAgo = formatDaysAgo(tpl.updatedAt || tpl.createdAt || null);
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => onSelect(tpl.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors bg-white hover:bg-gray-50 ${
                    isSelected ? 'border-primary/40 ring-2 ring-primary/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-dark-text truncate">{tpl.name}</p>
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">{bodyPreview(tpl.body)}</p>
                      {typeof daysAgo === 'number' ? (
                        <p className="mt-2 text-[11px] text-gray-500">{t('templates.list.daysAgo', { count: daysAgo })}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center flex-shrink-0"
                      aria-label={t('templates.list.actions')}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h.01M12 12h.01M12 18h.01" />
                      </svg>
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Variables */}
      <div className="border-t border-gray-200 p-5 bg-white/60 backdrop-blur-md">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">{t('templates.variables.title')}</p>
        <div className="flex flex-wrap gap-2">
          {vars.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onVariableClick(v)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              title={t('templates.variables.clickToCopy')}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CandidateTag } from '../../types/candidates';
import { formatTagLabel } from '../../lib/candidateTagStyle';

export default function TagFilterSelect({
  tags,
  selectedIds,
  onChange,
  className = '',
}: {
  tags: CandidateTag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const summary = useMemo(() => {
    const selected = tags.filter((tag) => selectedIds.includes(tag.id));
    if (selected.length === 0) return t('candidates.filters.tagsAll');
    if (selected.length === 1) return formatTagLabel(selected[0].name);
    return t('candidates.filters.tagsSelected', { count: selected.length });
  }, [selectedIds, t, tags]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  return (
    <div className="relative w-full" ref={rootRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{t('candidates.filters.tags')}</label>
      <button
        type="button"
        className={`flex h-12 w-full items-center justify-between gap-2 border border-gray-300 rounded-lg bg-white px-4 text-left text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${className}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{summary}</span>
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {tags.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">{t('candidates.filters.tagsEmpty')}</p>
          ) : (
            tags.map((tag) => {
              const checked = selectedIds.includes(tag.id);
              return (
                <label key={tag.id} className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(tag.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="truncate">{formatTagLabel(tag.name)}</span>
                </label>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

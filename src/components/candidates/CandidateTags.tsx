import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import TagPill from './TagPill';
import { formatTagLabel } from '../../lib/candidateTagStyle';
import { candidatesApi } from '../../api/candidatesApi';
import type { CandidateTag } from '../../types/candidates';

interface CandidateTagsProps {
  candidateId: string;
  tags: CandidateTag[];
  onChanged: () => void;
  onError: (message: string) => void;
}

export default function CandidateTags({ candidateId, tags, onChanged, onError }: CandidateTagsProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<CandidateTag[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    candidatesApi
      .listTags()
      .then((items) => {
        if (!cancelled) setSuggestions(items);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId, tags]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const assigned = new Set(tags.map((tag) => tag.name.toLowerCase()));
  const available = suggestions.filter((tag) => !assigned.has(tag.name.toLowerCase()));
  const query = name.trim().toLowerCase();
  const matches = available.filter((tag) => !query || formatTagLabel(tag.name).includes(query));
  const showCreate = query.length > 0 && !available.some((tag) => formatTagLabel(tag.name) === query);

  const pick = (value: string) => {
    setOpen(false);
    void add(value);
  };

  const add = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await candidatesApi.addTag(candidateId, trimmed);
      setName('');
      onChanged();
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : t('candidates.errors.saveChanges');
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (tag: CandidateTag) => {
    if (saving) return;
    setSaving(true);
    try {
      await candidatesApi.removeTag(candidateId, tag.id);
      onChanged();
    } catch (e) {
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: unknown }).message)
          : t('candidates.errors.saveChanges');
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  const tagPills = tags.map((tag) => (
    <TagPill
      key={tag.id}
      name={tag.name}
      className="px-2.5 py-1 text-xs"
      removeLabel={t('candidates.tags.remove', { name: formatTagLabel(tag.name) })}
      onRemove={saving ? undefined : remove.bind(null, tag)}
    />
  ));

  return (
    <div className="pt-2">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('candidates.fields.tags')}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.length === 0 ? (
          <span className="text-sm text-gray-500">{t('candidates.tags.empty')}</span>
        ) : (
          tagPills
        )}
      </div>
      <div className="relative" ref={rootRef}>
        <form
          className="flex overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-primary"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            setOpen(false);
            void add(name);
          }}
        >
          <input
            value={name}
            maxLength={40}
            disabled={saving}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setName(e.target.value);
              setOpen(true);
            }}
            placeholder={t('candidates.placeholders.tag')}
            className="min-w-0 flex-1 border-0 px-3 py-2 text-sm focus:outline-none focus:ring-0"
          />
          <Button type="submit" variant="outline" size="sm" className="rounded-none border-0 border-l border-gray-300" disabled={saving || !name.trim()}>
            {t('candidates.tags.add')}
          </Button>
        </form>
        {open && (matches.length > 0 || showCreate) ? (
          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {matches.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-dark-text hover:bg-gray-50"
                onClick={pick.bind(null, tag.name)}
              >
                {formatTagLabel(tag.name)}
              </button>
            ))}
            {showCreate ? (
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm font-medium text-primary hover:bg-gray-50"
                onClick={pick.bind(null, name.trim())}
              >
                {t('candidates.tags.create', { name: formatTagLabel(name) })}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

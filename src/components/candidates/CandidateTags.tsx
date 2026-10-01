import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
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
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<CandidateTag[]>([]);

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

  const assigned = new Set(tags.map((tag) => tag.name.toLowerCase()));
  const available = suggestions.filter((tag) => !assigned.has(tag.name.toLowerCase()));

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

  return (
    <div className="pt-2">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('candidates.fields.tags')}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.length === 0 ? (
          <span className="text-sm text-gray-500">{t('candidates.tags.empty')}</span>
        ) : (
          tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800"
            >
              {tag.name}
              <button
                type="button"
                className="leading-none text-purple-700 hover:text-purple-950 disabled:opacity-50"
                aria-label={t('candidates.tags.remove', { name: tag.name })}
                onClick={() => void remove(tag)}
                disabled={saving}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void add(name);
        }}
      >
        <input
          list="candidate-org-tags"
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('candidates.placeholders.tag')}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <Button type="submit" variant="outline" size="sm" disabled={saving || !name.trim()}>
          {t('candidates.tags.add')}
        </Button>
      </form>
      <datalist id="candidate-org-tags">
        {available.map((tag) => (
          <option key={tag.id} value={tag.name} />
        ))}
      </datalist>
    </div>
  );
}

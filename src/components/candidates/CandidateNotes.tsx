import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import { candidatesApi } from '../../api/candidatesApi';
import type { CandidateNote } from '../../types/candidates';

interface CandidateNotesProps {
  candidateId: string;
  onError: (message: string) => void;
}

function formatNoteDate(value: string, locale: string) {
  try {
    return new Date(value).toLocaleString(locale || 'en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function CandidateNotes({ candidateId, onError }: CandidateNotesProps) {
  const { t, i18n } = useTranslation();
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    candidatesApi
      .listNotes(candidateId)
      .then((items) => {
        if (!cancelled) setNotes(items);
      })
      .catch((e) => {
        if (cancelled) return;
        setNotes([]);
        const message =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: unknown }).message)
            : t('candidates.errors.loadCandidate');
        onError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId, onError, t]);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const created = await candidatesApi.addNote(candidateId, trimmed);
      setNotes((current) => [created, ...current]);
      setBody('');
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

  const remove = async (noteId: string) => {
    if (saving) return;
    setSaving(true);
    try {
      await candidatesApi.deleteNote(candidateId, noteId);
      setNotes((current) => current.filter((note) => note.id !== noteId));
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
    <div className="pt-2 border-t border-gray-200">
      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('candidates.notes.title')}</p>

      {loading ? (
        <div className="space-y-2 mb-3">
          <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-gray-500 mb-3">{t('candidates.notes.empty')}</p>
      ) : (
        <div className="space-y-3 mb-3">
          {notes.map((note) => {
            const author = note.createdByName || note.createdByEmail;
            return (
              <div key={note.id} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {author ? <p className="text-sm font-semibold text-dark-text truncate">{author}</p> : null}
                    <p className="text-xs text-gray-500 mt-0.5">{formatNoteDate(note.createdAt, i18n.language || 'en')}</p>
                  </div>
                  <button
                    type="button"
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    aria-label={t('candidates.notes.remove')}
                    onClick={() => void remove(note.id)}
                    disabled={saving}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{note.body}</p>
              </div>
            );
          })}
        </div>
      )}

      <form className="space-y-2" onSubmit={(event) => void add(event)}>
        <textarea
          value={body}
          maxLength={4000}
          rows={3}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('candidates.notes.placeholder')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <div className="flex justify-end">
          <Button type="submit" variant="outline" size="sm" disabled={saving || !body.trim()}>
            {t('candidates.notes.add')}
          </Button>
        </div>
      </form>
    </div>
  );
}

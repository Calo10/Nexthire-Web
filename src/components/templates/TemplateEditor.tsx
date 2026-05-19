import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import TextField from '../TextField';
import TextareaField from '../TextareaField';
import type { Template, TemplateChannel } from '../../types/templates';

function ChannelChip({ channel }: { channel: TemplateChannel }) {
  const label = channel === 'email' ? 'Email' : 'WhatsApp';
  const color = channel === 'email' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>{label}</span>;
}

function EditorSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-7 bg-gray-200 rounded w-2/3 animate-pulse" />
      <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
      <div className="h-12 bg-gray-200 rounded animate-pulse" />
      <div className="h-56 bg-gray-200 rounded-2xl animate-pulse" />
    </div>
  );
}

function surroundSelection(
  el: HTMLTextAreaElement,
  left: string,
  right: string = left
): { next: string; selectionStart: number; selectionEnd: number } {
  const value = el.value ?? '';
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);
  const next = `${before}${left}${selected}${right}${after}`;
  const selectionStart = start + left.length;
  const selectionEnd = end + left.length;
  return { next, selectionStart, selectionEnd };
}

function prefixLines(el: HTMLTextAreaElement, prefix: string): { next: string; selectionStart: number; selectionEnd: number } {
  const value = el.value ?? '';
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;

  // Expand to full lines
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEndIdx = value.indexOf('\n', end);
  const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

  const before = value.slice(0, lineStart);
  const block = value.slice(lineStart, lineEnd);
  const after = value.slice(lineEnd);

  const lines = block.split('\n');
  const nextBlock = lines.map((l) => (l.trim().length ? `${prefix}${l}` : l)).join('\n');
  const next = `${before}${nextBlock}${after}`;

  const addedChars = lines.reduce((acc, l) => (l.trim().length ? acc + prefix.length : acc), 0);
  return { next, selectionStart: start + prefix.length, selectionEnd: end + addedChars };
}

export default function TemplateEditor({
  template,
  isLoading,
  draft,
  isDirty,
  isSaving,
  subjectRef,
  bodyRef,
  onFocusField,
  onChangeDraft,
  onSave,
  onDelete,
}: {
  template: Template | null;
  isLoading: boolean;
  draft: { name: string; subject: string; body: string };
  isDirty: boolean;
  isSaving: boolean;
  subjectRef: React.RefObject<HTMLInputElement>;
  bodyRef: React.RefObject<HTMLTextAreaElement>;
  onFocusField: (field: 'subject' | 'body') => void;
  onChangeDraft: (next: { name: string; subject: string; body: string }) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const effectiveChannel: TemplateChannel = (template?.channel || 'email') as TemplateChannel;

  const toolbar = useMemo(
    () => [
      { key: 'bold', label: 'B' },
      { key: 'italic', label: 'I' },
      { key: 'link', label: 'Link' },
      { key: 'list', label: '• List' },
    ],
    []
  );

  const applyBodyAction = async (action: 'bold' | 'italic' | 'link' | 'list') => {
    const el = bodyRef.current;
    if (!el) return;
    el.focus();

    if (action === 'bold') {
      const { next, selectionStart, selectionEnd } = surroundSelection(el, '**', '**');
      onChangeDraft({ ...draft, body: next });
      requestAnimationFrame(() => el.setSelectionRange(selectionStart, selectionEnd));
      return;
    }

    if (action === 'italic') {
      const { next, selectionStart, selectionEnd } = surroundSelection(el, '*', '*');
      onChangeDraft({ ...draft, body: next });
      requestAnimationFrame(() => el.setSelectionRange(selectionStart, selectionEnd));
      return;
    }

    if (action === 'list') {
      const { next, selectionStart, selectionEnd } = prefixLines(el, '- ');
      onChangeDraft({ ...draft, body: next });
      requestAnimationFrame(() => el.setSelectionRange(selectionStart, selectionEnd));
      return;
    }

    // link
    const url = window.prompt(t('templates.editor.linkPrompt'), 'https://');
    if (!url) return;
    const value = el.value ?? '';
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || t('templates.editor.linkText');
    const before = value.slice(0, start);
    const after = value.slice(end);
    const insert = `[${selected}](${url})`;
    const next = `${before}${insert}${after}`;
    onChangeDraft({ ...draft, body: next });
    const caret = before.length + insert.length;
    requestAnimationFrame(() => el.setSelectionRange(caret, caret));
  };

  if (isLoading) return <EditorSkeleton />;

  if (!template) {
    return <div className="p-10 text-sm text-gray-600">{t('templates.editor.noSelection')}</div>;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-dark-text truncate">{draft.name || t('templates.editor.untitled')}</h2>
          <div className="mt-2">
            <ChannelChip channel={effectiveChannel} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            className="bg-red-600 hover:bg-red-700 from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-600"
            onClick={onDelete}
            disabled={isSaving}
          >
            {t('common.actions.delete')}
          </Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={isSaving || !isDirty}>
            {isSaving ? t('common.actions.saving') : t('templates.editor.save')}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <TextField
          label={t('templates.fields.name')}
          value={draft.name}
          onChange={(e) => onChangeDraft({ ...draft, name: e.target.value })}
          placeholder={t('templates.placeholders.name')}
        />

        {effectiveChannel === 'email' ? (
          <div>
            <TextField
              ref={subjectRef}
              label={t('templates.fields.subject')}
              value={draft.subject}
              onFocus={() => onFocusField('subject')}
              onChange={(e) => onChangeDraft({ ...draft, subject: e.target.value })}
              placeholder={t('templates.placeholders.subject')}
            />
          </div>
        ) : null}

        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">{t('templates.fields.body')}</p>
          <div className="flex items-center gap-2 rounded-t-xl border border-gray-200 bg-gray-50 px-3 py-2">
            {toolbar.map((b) => (
              <button
                key={b.key}
                type="button"
                className="px-2 py-1 text-xs font-semibold text-gray-600 hover:text-dark-text hover:bg-white rounded-md border border-transparent hover:border-gray-200 transition-colors"
                aria-label={b.key}
                onClick={() => {
                  void applyBodyAction(b.key as any);
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
          <textarea
            ref={bodyRef}
            rows={14}
            value={draft.body}
            onFocus={() => onFocusField('body')}
            onChange={(e) => onChangeDraft({ ...draft, body: e.target.value })}
            placeholder={t('templates.placeholders.body')}
            className="w-full px-4 py-3 border border-gray-200 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
}


import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pipelineStagesApi } from '../../api/pipelineStagesApi';
import type { ApiError } from '../../lib/api';
import type { PipelineStageSettings } from '../../types/pipelineStages';
import Button from '../Button';
import Card from '../Card';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';

const ERROR_KEYS: Record<string, string> = {
  name_required: 'settings.pipelineStages.errors.nameRequired',
  name_too_long: 'settings.pipelineStages.errors.nameTooLong',
  duplicate_name: 'settings.pipelineStages.errors.duplicateName',
  not_found: 'settings.pipelineStages.errors.notFound',
  in_use: 'settings.pipelineStages.errors.inUse',
  history: 'settings.pipelineStages.errors.history',
  last_stage: 'settings.pipelineStages.errors.lastStage',
  order_mismatch: 'settings.pipelineStages.errors.orderMismatch',
};

function moveItem(stages: PipelineStageSettings[], from: number, to: number): PipelineStageSettings[] {
  const next = [...stages];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function PipelineStagesSection() {
  const { t } = useTranslation();
  const [stages, setStages] = useState<PipelineStageSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const errorText = useCallback((err: ApiError, fallback: string) => {
    const code = typeof err.details?.code === 'string' ? err.details.code : '';
    const key = ERROR_KEYS[code];
    return key ? t(key) : err.message || fallback;
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const rows = await pipelineStagesApi.list();
        if (cancelled) return;
        setStages(rows);
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as ApiError;
        if (apiErr.status === 403) {
          setForbidden(true);
          return;
        }
        setError(errorText(apiErr, t('settings.pipelineStages.errors.load')));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [errorText, t]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (adding) addInputRef.current?.focus();
  }, [adding]);

  const countLabel = (count: number) => {
    if (count <= 0) return t('settings.pipelineStages.empty');
    if (count === 1) return t('settings.pipelineStages.oneCandidate');
    return t('settings.pipelineStages.manyCandidates', { count });
  };

  const blockedTitle = (stage: PipelineStageSettings) => {
    if (stage.canDelete || !stage.deleteBlockedReason) return t('common.actions.delete');
    return t(`settings.pipelineStages.blocked.${stage.deleteBlockedReason}`);
  };

  const persistOrder = async (next: PipelineStageSettings[]) => {
    const previous = stages;
    setStages(next);
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await pipelineStagesApi.reorder(next.map((stage) => stage.id));
      setStages(saved);
      setSuccess(t('settings.pipelineStages.toast.reordered'));
    } catch (err) {
      setStages(previous);
      setError(errorText(err as ApiError, t('settings.pipelineStages.errors.reorder')));
    } finally {
      setBusy(false);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (busy || target < 0 || target >= stages.length) return;
    void persistOrder(moveItem(stages, index, target));
  };

  const startEdit = (stage: PipelineStageSettings) => {
    setAdding(false);
    setConfirmDeleteId(null);
    setEditingId(stage.id);
    setDraftName(stage.name);
  };

  const saveName = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!editingId || busy) return;
    const name = draftName.trim();
    if (!name) {
      setError(t('settings.pipelineStages.errors.nameRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await pipelineStagesApi.rename(editingId, name);
      setStages(saved);
      setEditingId(null);
      setDraftName('');
      setSuccess(t('settings.pipelineStages.toast.renamed'));
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 403) {
        setForbidden(true);
        return;
      }
      setError(errorText(apiErr, t('settings.pipelineStages.errors.save')));
    } finally {
      setBusy(false);
    }
  };

  const createStage = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const name = newName.trim();
    if (!name) {
      setError(t('settings.pipelineStages.errors.nameRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await pipelineStagesApi.create(name);
      setStages(saved);
      setNewName('');
      setAdding(false);
      setSuccess(t('settings.pipelineStages.toast.created'));
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 403) {
        setForbidden(true);
        return;
      }
      setError(errorText(apiErr, t('settings.pipelineStages.errors.save')));
    } finally {
      setBusy(false);
    }
  };

  const deleteStage = async (stage: PipelineStageSettings) => {
    if (busy || !stage.canDelete) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await pipelineStagesApi.remove(stage.id);
      setStages(saved);
      setConfirmDeleteId(null);
      setSuccess(t('settings.pipelineStages.toast.deleted'));
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 403) {
        setForbidden(true);
        return;
      }
      setError(errorText(apiErr, t('settings.pipelineStages.errors.delete')));
    } finally {
      setBusy(false);
    }
  };

  const dropOn = (targetId: string) => {
    const sourceId = dragId;
    setDragId(null);
    setOverId(null);
    if (!sourceId || sourceId === targetId || busy) return;
    const from = stages.findIndex((stage) => stage.id === sourceId);
    const to = stages.findIndex((stage) => stage.id === targetId);
    if (from < 0 || to < 0) return;
    void persistOrder(moveItem(stages, from, to));
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-56 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-gray-200" />
          <div className="h-14 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-14 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </Card>
    );
  }

  if (forbidden) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-dark-text mb-2">{t('settings.pipelineStages.title')}</h3>
        <p className="text-sm text-gray-600">{t('settings.pipelineStages.forbidden')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-dark-text mb-2">{t('settings.pipelineStages.title')}</h3>
          <p className="text-sm text-gray-600 max-w-2xl">{t('settings.pipelineStages.description')}</p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={busy}
          onClick={() => {
            setEditingId(null);
            setConfirmDeleteId(null);
            setAdding(true);
          }}
        >
          {t('settings.pipelineStages.add')}
        </Button>
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      ) : null}
      {success ? (
        <div className="mb-4">
          <SuccessMessage message={success} />
        </div>
      ) : null}

      <div className="space-y-2">
        {stages.map((stage, index) => {
          const isEditing = editingId === stage.id;
          const isConfirming = confirmDeleteId === stage.id;
          return (
            <div
              key={stage.id}
              onDragOver={(event) => {
                if (!dragId || busy) return;
                event.preventDefault();
                setOverId(stage.id);
              }}
              onDrop={(event) => {
                event.preventDefault();
                dropOn(stage.id);
              }}
              className={`rounded-xl border px-3 py-3 ${
                overId === stage.id && dragId !== stage.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200'
              } ${dragId === stage.id ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  draggable={!busy && !isEditing}
                  aria-label={t('settings.pipelineStages.drag')}
                  title={t('settings.pipelineStages.drag')}
                  onDragStart={(event) => {
                    setDragId(stage.id);
                    setConfirmDeleteId(null);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', stage.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing disabled:cursor-not-allowed"
                  disabled={busy || isEditing}
                >
                  <GripIcon />
                </button>
                <span className="w-5 text-sm tabular-nums text-gray-400">{index + 1}</span>

                {isEditing ? (
                  <form onSubmit={saveName} className="flex min-w-0 flex-1 items-center gap-2">
                    <input
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      maxLength={60}
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button type="submit" variant="primary" size="sm" disabled={busy}>
                      {t('settings.pipelineStages.rename')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(null);
                        setDraftName('');
                      }}
                    >
                      {t('common.actions.cancel')}
                    </Button>
                  </form>
                ) : (
                  <>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{stage.name}</p>
                    <p className="shrink-0 text-sm text-gray-500">{countLabel(stage.applicationCount)}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      <IconButton
                        label={t('settings.pipelineStages.moveUp')}
                        disabled={busy || index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ChevronIcon direction="up" />
                      </IconButton>
                      <IconButton
                        label={t('settings.pipelineStages.moveDown')}
                        disabled={busy || index === stages.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ChevronIcon direction="down" />
                      </IconButton>
                      <IconButton
                        label={t('common.actions.edit')}
                        disabled={busy}
                        onClick={() => startEdit(stage)}
                      >
                        <PencilIcon />
                      </IconButton>
                      <IconButton
                        label={blockedTitle(stage)}
                        disabled={busy || !stage.canDelete}
                        danger={stage.canDelete}
                        onClick={() => {
                          setEditingId(null);
                          setAdding(false);
                          setConfirmDeleteId(stage.id);
                        }}
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </>
                )}
              </div>

              {isConfirming ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2">
                  <p className="text-sm text-red-700">
                    {t('settings.pipelineStages.deleteConfirm', { name: stage.name })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      {t('common.actions.cancel')}
                    </Button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void deleteStage(stage)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {t('settings.pipelineStages.confirmDelete')}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {adding ? (
        <form onSubmit={createStage} className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={addInputRef}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            maxLength={60}
            placeholder={t('settings.pipelineStages.addPlaceholder')}
            className="min-w-[220px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button type="submit" variant="primary" size="sm" disabled={busy}>
            {busy ? t('common.actions.creating') : t('settings.pipelineStages.add')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => {
              setAdding(false);
              setNewName('');
            }}
          >
            {t('common.actions.cancel')}
          </Button>
        </form>
      ) : null}

      <p className="mt-4 text-xs text-gray-500">{t('settings.pipelineStages.deleteHint')}</p>
    </Card>
  );
}

function IconButton({
  label,
  disabled,
  danger,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg p-2 disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  );
}

function GripIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <circle cx="7" cy="5" r="1.2" />
      <circle cx="13" cy="5" r="1.2" />
      <circle cx="7" cy="10" r="1.2" />
      <circle cx="13" cy="10" r="1.2" />
      <circle cx="7" cy="15" r="1.2" />
      <circle cx="13" cy="15" r="1.2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M4 20h4.5L19.5 9a1.5 1.5 0 000-2.121L17.121 4.5a1.5 1.5 0 00-2.121 0L4 15.5V20z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={direction === 'up' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
      />
    </svg>
  );
}

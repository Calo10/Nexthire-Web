import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Card from '../components/Card';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import type { TemplateChannel, Template } from '../types/templates';
import { templatesApi } from '../api/templatesApi';
import { useTemplate, useTemplatesList } from '../hooks/useTemplatesApi';
import TemplatesList from '../components/templates/TemplatesList';
import TemplateEditor from '../components/templates/TemplateEditor';
import TemplateModal from '../components/templates/TemplateModal';

function sameDraft(a: { name: string; subject: string; body: string }, b: { name: string; subject: string; body: string }) {
  return a.name === b.name && a.subject === b.subject && a.body === b.body;
}

function insertAtCursor(input: HTMLInputElement | HTMLTextAreaElement | null, text: string) {
  if (!input) return;
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const next = input.value.slice(0, start) + text + input.value.slice(end);
  input.value = next;
  const caret = start + text.length;
  input.setSelectionRange(caret, caret);
}

export default function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const shouldFetch = isAuthenticated && !authLoading;

  const [channel, setChannel] = useState<TemplateChannel>('email');
  const { data: templates, setData: setTemplates, isLoading: listLoading, error: listError, refetch: refetchList } = useTemplatesList(
    shouldFetch,
    channel
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: selectedTemplate, setData: setSelectedTemplate, isLoading: detailLoading, error: detailError, refetch: refetchDetail } =
    useTemplate(shouldFetch, selectedId);

  const [draft, setDraft] = useState({ name: '', subject: '', body: '' });
  const initialDraft = useMemo(() => {
    return {
      name: selectedTemplate?.name || '',
      subject: selectedTemplate?.subject ? String(selectedTemplate.subject) : '',
      body: selectedTemplate?.body || '',
    };
  }, [selectedTemplate]);
  const isDirty = useMemo(() => !sameDraft(draft, initialDraft), [draft, initialDraft]);

  const [activeField, setActiveField] = useState<'subject' | 'body'>('body');
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [toastError, setToastError] = useState<string | null>(null);
  const [toastSuccess, setToastSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Keep selection valid when list changes
  useEffect(() => {
    if (listLoading) return;
    if (!templates.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !templates.some((t) => t.id === selectedId)) {
      setSelectedId(templates[0].id);
    }
  }, [templates, selectedId, listLoading]);

  // Sync draft when template loads
  useEffect(() => {
    if (!selectedTemplate) return;
    setDraft({
      name: selectedTemplate.name || '',
      subject: selectedTemplate.subject ? String(selectedTemplate.subject) : '',
      body: selectedTemplate.body || '',
    });
  }, [selectedTemplate?.id]);

  // 401 handling (redirect to login)
  useEffect(() => {
    const err = listError || detailError;
    if (!err) return;
    if ((err as any).status === 401) {
      logout();
      navigate('/login', { replace: true });
      return;
    }
  }, [listError, detailError, logout, navigate]);

  // Auto-clear toasts
  useEffect(() => {
    if (!toastError) return;
    const h = window.setTimeout(() => setToastError(null), 3500);
    return () => window.clearTimeout(h);
  }, [toastError]);
  useEffect(() => {
    if (!toastSuccess) return;
    const h = window.setTimeout(() => setToastSuccess(null), 2500);
    return () => window.clearTimeout(h);
  }, [toastSuccess]);

  const requestSwitchChannel = (next: TemplateChannel) => {
    if (next === channel) return;
    if (isDirty) {
      const ok = window.confirm(t('templates.confirm.discard'));
      if (!ok) return;
    }
    setChannel(next);
    setSelectedId(null);
    setSelectedTemplate(null);
    setDraft({ name: '', subject: '', body: '' });
  };

  const requestSelect = (id: string) => {
    if (id === selectedId) return;
    if (isDirty) {
      const ok = window.confirm(t('templates.confirm.discard'));
      if (!ok) return;
    }
    setSelectedId(id);
  };

  const handleVariableClick = async (variable: string) => {
    try {
      await navigator.clipboard.writeText(variable);
      setToastSuccess(t('templates.variables.copied'));
    } catch {
      // ignore clipboard failure
    }

    // Insert into focused field
    if (activeField === 'subject') {
      const el = subjectRef.current;
      if (el) {
        insertAtCursor(el, variable);
        setDraft((prev) => ({ ...prev, subject: el.value }));
      }
      return;
    }
    const el = bodyRef.current;
    if (el) {
      insertAtCursor(el, variable);
      setDraft((prev) => ({ ...prev, body: el.value }));
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    const effectiveChannel: TemplateChannel = (selectedTemplate.channel || channel) as TemplateChannel;
    setToastError(null);
    setToastSuccess(null);
    if (!draft.name.trim()) {
      setToastError(t('templates.validation.nameRequired'));
      return;
    }
    setIsSaving(true);
    try {
      const updated = await templatesApi.update(selectedTemplate.id, {
        name: draft.name.trim(),
        subject: effectiveChannel === 'email' ? draft.subject : null,
        body: draft.body,
      });

      setSelectedTemplate(updated);
      setDraft({
        name: updated.name || '',
        subject: updated.subject ? String(updated.subject) : '',
        body: updated.body || '',
      });

      // Update list item in-place (better UX)
      setTemplates((prev) =>
        prev.map((x) =>
          x.id === updated.id
            ? ({
                ...x,
                name: updated.name,
                subject: updated.subject ?? x.subject,
                body: updated.body ?? x.body,
                updatedAt: updated.updatedAt ?? new Date().toISOString(),
              } as Template)
            : x
        )
      );

      setToastSuccess(t('templates.toast.saved'));
      setTimeout(() => {
        refetchList();
        refetchDetail();
      }, 200);
    } catch (e) {
      if ((e as any)?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setToastError((e as any)?.message || t('templates.errors.save'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!isDirty) return;
    const ok = window.confirm(t('templates.confirm.discard'));
    if (!ok) return;
    setDraft(initialDraft);
  };

  const handleCreate = async (payload: { name: string; channel: TemplateChannel; subject?: string }) => {
    const created = await templatesApi.create({
      name: payload.name,
      channel: payload.channel,
      subject: payload.channel === 'email' ? (payload.subject ?? t('templates.defaults.subject')) : null,
      body: t('templates.defaults.body'),
    });

    // Switch to created channel if needed
    if (payload.channel !== channel) {
      setChannel(payload.channel);
    }

    setToastSuccess(t('templates.toast.created'));
    refetchList();
    setSelectedId(created.id);
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    setToastError(null);
    try {
      await templatesApi.delete(selectedTemplate.id);
      setIsDeleteOpen(false);
      setToastSuccess(t('templates.toast.deleted'));
      setSelectedId(null);
      setSelectedTemplate(null);
      setDraft({ name: '', subject: '', body: '' });
      refetchList();
    } catch (e) {
      if ((e as any)?.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setToastError((e as any)?.message || t('templates.errors.delete'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <TopBar />

      <div className="p-8">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-dark-text">{t('templates.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('templates.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/70 backdrop-blur border border-gray-200 rounded-lg p-1 flex">
              <button
                type="button"
                onClick={() => requestSwitchChannel('email')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  channel === 'email' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                {t('templates.tabs.email')}
              </button>
              <button
                type="button"
                onClick={() => requestSwitchChannel('whatsapp')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  channel === 'whatsapp' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                {t('templates.tabs.whatsapp')}
              </button>
            </div>

            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('templates.new')}
              </span>
            </Button>
          </div>
        </div>

        {toastError ? (
          <div className="mb-6">
            <ErrorMessage message={toastError} />
          </div>
        ) : null}
        {toastSuccess ? (
          <div className="mb-6">
            <SuccessMessage message={toastSuccess} />
          </div>
        ) : null}

        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] lg:h-[calc(100vh-220px)]">
            <div className="h-full min-h-0 border-r border-gray-200 bg-white/60 backdrop-blur-md">
              <TemplatesList
                channel={channel}
                templates={templates}
                selectedId={selectedId}
                isLoading={listLoading}
                onSelect={requestSelect}
                onVariableClick={handleVariableClick}
              />
            </div>

            <div className="h-full min-h-0 bg-white">
              <TemplateEditor
                template={selectedTemplate}
                isLoading={detailLoading}
                draft={draft}
                isDirty={isDirty}
                isSaving={isSaving}
                subjectRef={subjectRef}
                bodyRef={bodyRef}
                onFocusField={setActiveField}
                onChangeDraft={setDraft}
                onSave={handleSave}
                onDelete={() => setIsDeleteOpen(true)}
              />
            </div>
          </div>
        </Card>
      </div>

      <TemplateModal
        isOpen={isCreateOpen}
        defaultChannel={channel}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreate}
      />

      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={t('templates.delete.title')}
        subtitle={t('templates.delete.subtitle')}
        width="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-600"
              onClick={handleDelete}
            >
              {t('common.actions.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-700">{t('templates.delete.body')}</p>
      </Modal>
    </div>
  );
}


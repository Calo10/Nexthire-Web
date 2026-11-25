import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import Badge from '../../../components/ui/Badge';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { offboardingTemplatesApi } from '../api/offboardingTemplatesApi';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';
import HrToast, { type HrToastState } from '../components/HrToast';
import TemplateEditorModal from '../components/offboarding/TemplateEditorModal';
import { useHrLookups } from '../hooks/useHrLookups';
import { useOffboardingCapabilities } from '../hooks/useOffboardingCapabilities';
import { useOffboardingLookups } from '../hooks/useOffboardingLookups';
import {
  OFFBOARDING_PERMISSIONS,
  type OffboardingTemplateDetail,
  type OffboardingTemplateListItem,
} from '../models/offboarding';
import { detailToRequest } from '../models/offboardingTemplateForm';
import { apiErrorMessage } from '../utils/employeeFormat';

export default function CoreHrOffboardingTemplatesPage() {
  const { t } = useTranslation();
  const caps = useOffboardingCapabilities();
  const hrLookups = useHrLookups(!caps.denied);
  const lookups = useOffboardingLookups(!caps.denied);
  const canManage = caps.can(OFFBOARDING_PERMISSIONS.ManageTemplates);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [items, setItems] = useState<OffboardingTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [editor, setEditor] = useState<{ template: OffboardingTemplateDetail | null } | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<OffboardingTemplateListItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<HrToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    const id = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const reqId = useRef(0);
  useEffect(() => {
    if (!caps.ready) return;
    if (caps.denied) {
      setLoading(false);
      setForbidden(true);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    offboardingTemplatesApi
      .list({ search: search || undefined, includeArchived })
      .then((res) => {
        if (id === reqId.current) setItems(res);
      })
      .catch((err: unknown) => {
        if (id !== reqId.current) return;
        if ((err as { status?: number })?.status === 403) setForbidden(true);
        else setError(apiErrorMessage(err, t('coreHr.offboarding.templates.loadError')));
      })
      .finally(() => {
        if (id === reqId.current) setLoading(false);
      });
  }, [search, includeArchived, reloadKey, caps.ready, caps.denied, t]);

  const reload = () => {
    setReloadKey((k) => k + 1);
    void lookups.reload();
  };

  const openEditor = async (item: OffboardingTemplateListItem | null) => {
    if (!item) {
      setEditor({ template: null });
      return;
    }
    setOpeningId(item.id);
    try {
      setEditor({ template: await offboardingTemplatesApi.get(item.id) });
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.offboarding.templates.openError')) });
    } finally {
      setOpeningId(null);
    }
  };

  const duplicate = async (item: OffboardingTemplateListItem) => {
    setBusy(true);
    try {
      const copy = await offboardingTemplatesApi.duplicate(
        item.id,
        t('coreHr.offboarding.templates.copyName', { name: item.name }),
      );
      setToast({ tone: 'success', text: t('coreHr.offboarding.templates.duplicated', { name: copy.name }) });
      reload();
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.offboarding.templates.duplicateError')) });
    } finally {
      setBusy(false);
    }
  };

  const setDefault = async (item: OffboardingTemplateListItem) => {
    setBusy(true);
    try {
      const detail = await offboardingTemplatesApi.get(item.id);
      await offboardingTemplatesApi.update(item.id, detailToRequest(detail, { isDefault: true, isActive: true }));
      setToast({ tone: 'success', text: t('coreHr.offboarding.templates.defaultSet', { name: item.name }) });
      reload();
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.offboarding.templates.defaultError')) });
    } finally {
      setBusy(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setBusy(true);
    try {
      await offboardingTemplatesApi.archive(archiveTarget.id);
      setToast({ tone: 'success', text: t('coreHr.offboarding.templates.archived', { name: archiveTarget.name }) });
      reload();
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.offboarding.templates.archiveError')) });
    } finally {
      setBusy(false);
      setArchiveTarget(null);
    }
  };

  const breadcrumbs = useMemo(
    () => [
      { label: t('modules.coreHr'), to: '/app/hr/dashboard' },
      { label: t('coreHr.offboarding.title'), to: '/app/hr/offboarding' },
      { label: t('coreHr.offboarding.templates.title') },
    ],
    [t],
  );

  if (forbidden) {
    return (
      <CoreHrPageShell title={t('coreHr.offboarding.templates.title')} breadcrumbs={breadcrumbs}>
        <CoreHrEmptyState title={t('coreHr.offboarding.forbiddenTitle')} description={t('coreHr.offboarding.forbiddenDescription')} />
      </CoreHrPageShell>
    );
  }

  return (
    <CoreHrPageShell
      title={t('coreHr.offboarding.templates.title')}
      subtitle={t('coreHr.offboarding.templates.subtitle')}
      breadcrumbs={breadcrumbs}
      actions={
        canManage ? (
          <Button size="sm" onClick={() => void openEditor(null)}>
            + {t('coreHr.offboarding.templates.new')}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('coreHr.offboarding.templates.searchPlaceholder')}
            aria-label={t('coreHr.offboarding.templates.searchPlaceholder')}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 sm:max-w-sm"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            {t('coreHr.offboarding.templates.showArchived')}
          </label>
        </div>

        {error ? (
          <div className="space-y-3">
            <ErrorMessage message={error} />
            <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
              {t('coreHr.offboarding.retry')}
            </Button>
          </div>
        ) : loading && items.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl border border-gray-200 bg-white" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <CoreHrEmptyState
            title={search ? t('coreHr.offboarding.templates.noResultsTitle') : t('coreHr.offboarding.templates.emptyTitle')}
            description={search ? t('coreHr.offboarding.templates.noResultsDescription') : t('coreHr.offboarding.templates.emptyDescription')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((tpl) => (
              <article
                key={tpl.id}
                className={`flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${tpl.isArchived ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="min-w-0 truncate text-base font-semibold text-dark-text">{tpl.name}</h2>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {tpl.isDefault ? <Badge tone="blue">{t('coreHr.offboarding.templates.default')}</Badge> : null}
                    {tpl.isArchived ? (
                      <Badge tone="gray">{t('coreHr.offboarding.templates.archivedBadge')}</Badge>
                    ) : !tpl.isActive ? (
                      <Badge tone="yellow">{t('coreHr.offboarding.templates.inactive')}</Badge>
                    ) : null}
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-gray-500">{tpl.description || '—'}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <dt className="text-gray-400">{t('coreHr.offboarding.templates.tasks')}</dt>
                    <dd className="font-medium text-dark-text">{tpl.taskCount}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">{t('coreHr.offboarding.templates.duration')}</dt>
                    <dd className="font-medium text-dark-text">
                      {tpl.estimatedDurationDays
                        ? t('coreHr.offboarding.templates.durationDays', { count: tpl.estimatedDurationDays })
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">{t('coreHr.offboarding.templates.appliesTo')}</dt>
                    <dd className="truncate font-medium text-dark-text">
                      {[
                        tpl.separationType ? t(`coreHr.offboarding.separationType.${tpl.separationType}`, { defaultValue: tpl.separationType }) : null,
                        tpl.jobTitle || tpl.department,
                      ]
                        .filter(Boolean)
                        .join(' · ') || t('coreHr.offboarding.templates.everyone')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">{t('coreHr.offboarding.templates.version')}</dt>
                    <dd className="font-medium text-dark-text">v{tpl.version}</dd>
                  </div>
                </dl>
                {canManage && !tpl.isArchived ? (
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-sm font-medium">
                    <button
                      type="button"
                      disabled={openingId === tpl.id || busy}
                      onClick={() => void openEditor(tpl)}
                      className="text-teal-700 hover:text-teal-900 disabled:opacity-50"
                    >
                      {openingId === tpl.id ? t('common.loading') : t('common.actions.edit')}
                    </button>
                    <button type="button" disabled={busy} onClick={() => void duplicate(tpl)} className="text-teal-700 hover:text-teal-900 disabled:opacity-50">
                      {t('coreHr.offboarding.templates.duplicate')}
                    </button>
                    {!tpl.isDefault ? (
                      <button type="button" disabled={busy} onClick={() => void setDefault(tpl)} className="text-teal-700 hover:text-teal-900 disabled:opacity-50">
                        {t('coreHr.offboarding.templates.setDefault')}
                      </button>
                    ) : null}
                    <button type="button" disabled={busy} onClick={() => setArchiveTarget(tpl)} className="text-red-600 hover:text-red-800 disabled:opacity-50">
                      {t('coreHr.offboarding.templates.archive')}
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>

      <TemplateEditorModal
        isOpen={!!editor}
        template={editor?.template ?? null}
        hrLookups={hrLookups}
        lookups={lookups}
        onClose={() => setEditor(null)}
        onSaved={(saved, mode) => {
          setEditor(null);
          setToast({
            tone: 'success',
            text: t(mode === 'created' ? 'coreHr.offboarding.templates.created' : 'coreHr.offboarding.templates.updated', {
              name: saved.name,
            }),
          });
          reload();
        }}
      />

      <ConfirmModal
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
        tone="danger"
        busy={busy}
        title={t('coreHr.offboarding.templates.archiveTitle')}
        description={t('coreHr.offboarding.templates.archiveDescription', { name: archiveTarget?.name ?? '' })}
        confirmLabel={t('coreHr.offboarding.templates.archive')}
      />

      <HrToast toast={toast} onDismiss={dismissToast} />
    </CoreHrPageShell>
  );
}

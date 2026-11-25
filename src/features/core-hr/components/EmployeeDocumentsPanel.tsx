import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import SelectField from '../../../components/SelectField';
import TextField from '../../../components/TextField';
import Badge from '../../../components/ui/Badge';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { employeesApi } from '../api/employeesApi';
import { DOCUMENT_CATEGORIES, type EmployeeDocument } from '../models/employee';
import { apiErrorMessage, daysUntil, formatDate, isSafeUrl } from '../utils/employeeFormat';

export function DocumentExpiryBadge({ expiresAt }: { expiresAt?: string | null }) {
  const { t } = useTranslation();
  const days = daysUntil(expiresAt);
  if (days === null) return null;
  if (days < 0) return <Badge tone="red">{t('coreHr.employees.documents.expired')}</Badge>;
  if (days <= 30) return <Badge tone="yellow">{t('coreHr.employees.documents.expiresInDays', { count: days })}</Badge>;
  return null;
}

type Props = {
  employeeId: string;
  canManage: boolean;
  locale: string;
  /** Called after a document is added/removed so parents can refresh derived data (e.g. expirations). */
  onChanged?: () => void;
};

export default function EmployeeDocumentsPanel({ employeeId, canManage, locale, onChanged }: Props) {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState<EmployeeDocument | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ category: DOCUMENT_CATEGORIES[0] as string, name: '', externalUrl: '', expiresAt: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDocs(await employeesApi.documents(employeeId));
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.employees.documents.loadError')));
    } finally {
      setLoading(false);
    }
  }, [employeeId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setForm({ category: DOCUMENT_CATEGORIES[0], name: '', externalUrl: '', expiresAt: '' });
    setFormError(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setFormError(t('coreHr.employees.documents.nameRequired'));
      return;
    }
    if (form.externalUrl.trim() && !isSafeUrl(form.externalUrl.trim())) {
      setFormError(t('coreHr.employees.documents.urlInvalid'));
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await employeesApi.addDocument(employeeId, {
        category: form.category,
        name: form.name.trim(),
        externalUrl: form.externalUrl.trim() || null,
        expiresAt: form.expiresAt || null,
      });
      setModalOpen(false);
      await load();
      onChanged?.();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('coreHr.employees.documents.saveError')));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await employeesApi.deleteDocument(employeeId, toDelete.id);
      setToDelete(null);
      await load();
      onChanged?.();
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.employees.documents.deleteError')));
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          {t('coreHr.employees.documents.title')}
        </h3>
        {canManage ? (
          <Button size="sm" variant="outline" onClick={openAdd}>
            {t('coreHr.employees.documents.add')}
          </Button>
        ) : null}
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
          {t('coreHr.employees.documents.empty')}
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {docs.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-dark-text">{d.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <Badge tone="gray">{t(`coreHr.employees.documents.categories.${d.category}`, { defaultValue: d.category })}</Badge>
                  {d.expiresAt ? (
                    <span>
                      {t('coreHr.employees.documents.expiresOn', { date: formatDate(d.expiresAt, locale) })}
                    </span>
                  ) : null}
                  <DocumentExpiryBadge expiresAt={d.expiresAt} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {isSafeUrl(d.externalUrl) ? (
                  <a
                    href={d.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-teal-700 hover:text-teal-800"
                  >
                    {t('coreHr.employees.documents.open')}
                  </a>
                ) : null}
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => setToDelete(d)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    {t('coreHr.employees.documents.remove')}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => (busy ? undefined : setModalOpen(false))}
        title={t('coreHr.employees.documents.addTitle')}
        width="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => setModalOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button size="sm" disabled={busy} onClick={() => void save()}>
              {busy ? t('common.actions.saving') : t('coreHr.employees.documents.save')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? <ErrorMessage message={formError} /> : null}
          <SelectField
            label={t('coreHr.employees.documents.category')}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            options={DOCUMENT_CATEGORIES.map((c) => ({
              value: c,
              label: t(`coreHr.employees.documents.categories.${c}`),
            }))}
          />
          <TextField
            label={t('coreHr.employees.documents.name')}
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label={t('coreHr.employees.documents.url')}
            type="url"
            placeholder={t('common.placeholders.url')}
            value={form.externalUrl}
            onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
          />
          <TextField
            label={t('coreHr.employees.documents.expiresAt')}
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => void remove()}
        tone="danger"
        busy={busy}
        title={t('coreHr.employees.documents.removeTitle')}
        description={t('coreHr.employees.documents.removeDescription', { name: toDelete?.name ?? '' })}
        confirmLabel={t('coreHr.employees.documents.remove')}
      />
    </div>
  );
}

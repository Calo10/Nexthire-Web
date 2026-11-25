import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import Badge from '../../../../components/ui/Badge';
import { hrDocumentsApi } from '../../api/hrDocumentsApi';
import { DOCUMENT_CATEGORIES } from '../../models/employee';
import type { HrDocumentRequest } from '../../models/hrDocument';
import { apiErrorMessage, formatDate } from '../../utils/employeeFormat';
import EmployeeAvatar from '../EmployeeAvatar';
import EmployeePicker from './EmployeePicker';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  canManage: boolean;
  locale: string;
  /** Called after any request mutation so the page can refresh the badge count. */
  onChanged: () => void;
};

const isOpenStatus = (s: string) => s.toLowerCase() === 'open' || s.toLowerCase() === 'overdue';

export default function HrDocumentRequestsModal({ isOpen, onClose, canManage, locale, onChanged }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<HrDocumentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ employeeId: '', category: DOCUMENT_CATEGORIES[0] as string, title: '', dueDate: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await hrDocumentsApi.requests(showAll ? 'all' : undefined));
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.documentsHub.requests.loadError')));
    } finally {
      setLoading(false);
    }
  }, [t, showAll]);

  useEffect(() => {
    if (isOpen) setCreating(false);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen, load]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setError(null);
    try {
      await fn();
      await load();
      onChanged();
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.documentsHub.requests.actionError')));
    } finally {
      setBusyId(null);
    }
  };

  const create = async () => {
    if (!form.employeeId) {
      setFormError(t('coreHr.documentsHub.upload.employeeRequired'));
      return;
    }
    setBusyId('new');
    setFormError(null);
    try {
      await hrDocumentsApi.createRequest({
        employeeId: form.employeeId,
        category: form.category,
        title: form.title.trim() || null,
        dueAt: form.dueDate || null,
      });
      setCreating(false);
      setForm({ employeeId: '', category: DOCUMENT_CATEGORIES[0], title: '', dueDate: '' });
      await load();
      onChanged();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('coreHr.documentsHub.requests.createError')));
    } finally {
      setBusyId(null);
    }
  };

  const visible = items;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('coreHr.documentsHub.requests.title')}
      subtitle={t('coreHr.documentsHub.requests.subtitle')}
      width="md"
      footer={
        <Button variant="secondary" size="sm" onClick={onClose}>
          {t('common.actions.close')}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            {t('coreHr.documentsHub.requests.showAll')}
          </label>
          {canManage && !creating ? (
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
              {t('coreHr.documentsHub.requests.new')}
            </Button>
          ) : null}
        </div>

        {creating ? (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            {formError ? <ErrorMessage message={formError} /> : null}
            <EmployeePicker
              label={t('coreHr.documentsHub.upload.employee')}
              value={form.employeeId}
              onChange={(id) => setForm((f) => ({ ...f, employeeId: id }))}
              disabled={busyId === 'new'}
            />
            <SelectField
              label={t('coreHr.employees.documents.category')}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              options={DOCUMENT_CATEGORIES.map((c) => ({
                value: c,
                label: t(`coreHr.employees.documents.categories.${c}`, { defaultValue: c }),
              }))}
            />
            <TextField
              label={t('coreHr.documentsHub.requests.requestTitle')}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={200}
            />
            <TextField
              label={t('coreHr.documentsHub.requests.dueDate')}
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" disabled={busyId === 'new'} onClick={() => setCreating(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button size="sm" disabled={busyId === 'new'} onClick={() => void create()}>
                {busyId === 'new' ? t('common.actions.saving') : t('coreHr.documentsHub.requests.create')}
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <ErrorMessage message={error} /> : null}

        {loading && items.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            {t('coreHr.documentsHub.requests.empty')}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {visible.map((r) => (
              <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                <EmployeeAvatar name={r.employeeName || '?'} seed={r.employeeId} url={r.employeeAvatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-dark-text">
                    {r.title || t(`coreHr.employees.documents.categories.${r.category}`, { defaultValue: r.category })}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {r.employeeName}
                    {r.dueAt ? ` · ${t('coreHr.documentsHub.requests.due', { date: formatDate(r.dueAt, locale) })}` : ''}
                  </p>
                  <div className="mt-1">
                    <Badge tone={r.status.toLowerCase() === 'overdue' ? 'red' : isOpenStatus(r.status) ? 'yellow' : r.status.toLowerCase() === 'fulfilled' ? 'green' : 'gray'}>
                      {t(`coreHr.documentsHub.requests.status.${r.status}`, { defaultValue: r.status })}
                    </Badge>
                  </div>
                </div>
                {canManage && isOpenStatus(r.status) ? (
                  <div className="flex shrink-0 gap-3 text-sm">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void act(r.id, () => hrDocumentsApi.fulfillRequest(r.id))}
                      className="font-medium text-teal-700 hover:text-teal-800 disabled:opacity-50"
                    >
                      {t('coreHr.documentsHub.requests.fulfill')}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void act(r.id, () => hrDocumentsApi.cancelRequest(r.id))}
                      className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {t('coreHr.documentsHub.requests.cancel')}
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

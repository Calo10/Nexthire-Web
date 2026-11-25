import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import SelectField from '../../../components/SelectField';
import TextField from '../../../components/TextField';
import TextareaField from '../../../components/TextareaField';
import Badge from '../../../components/ui/Badge';
import { employeesApi } from '../api/employeesApi';
import { PAY_FREQUENCIES, type Compensation } from '../models/employee';
import { apiErrorMessage, formatDate, formatMoney } from '../utils/employeeFormat';

type Props = {
  employeeId: string;
  canManage: boolean;
  locale: string;
  onChanged?: () => void;
};

const emptyForm = () => ({
  amount: '',
  currency: 'USD',
  payFrequency: 'Monthly' as string,
  effectiveDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  notes: '',
});

export default function EmployeeCompensationPanel({ employeeId, canManage, locale, onChanged }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<Compensation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await employeesApi.compensation(employeeId);
      setItems([...list].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)));
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.employees.compensation.loadError')));
    } finally {
      setLoading(false);
    }
  }, [employeeId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    const amount = Number(form.amount);
    if (!form.amount.trim() || !Number.isFinite(amount) || amount < 0) {
      setFormError(t('coreHr.employees.compensation.amountInvalid'));
      return;
    }
    if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) {
      setFormError(t('coreHr.employees.compensation.currencyInvalid'));
      return;
    }
    if (!form.effectiveDate) {
      setFormError(t('coreHr.employees.compensation.effectiveRequired'));
      return;
    }
    if (form.endDate && form.endDate < form.effectiveDate) {
      setFormError(t('coreHr.employees.compensation.endBeforeStart'));
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await employeesApi.addCompensation(employeeId, {
        amount,
        currency: form.currency.trim().toUpperCase(),
        payFrequency: form.payFrequency,
        effectiveDate: form.effectiveDate,
        endDate: form.endDate || null,
        notes: form.notes.trim() || null,
      });
      setOpen(false);
      await load();
      onChanged?.();
    } catch (err) {
      setFormError(apiErrorMessage(err, t('coreHr.employees.compensation.saveError')));
    } finally {
      setBusy(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const isCurrent = (c: Compensation) =>
    c.effectiveDate.slice(0, 10) <= today && (!c.endDate || c.endDate.slice(0, 10) >= today);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
          {t('coreHr.employees.compensation.title')}
        </h3>
        {canManage ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setForm(emptyForm());
              setFormError(null);
              setOpen(true);
            }}
          >
            {t('coreHr.employees.compensation.add')}
          </Button>
        ) : null}
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
          {t('coreHr.employees.compensation.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('coreHr.employees.compensation.amount')}</th>
                <th className="px-4 py-3 font-semibold">{t('coreHr.employees.compensation.frequency')}</th>
                <th className="px-4 py-3 font-semibold">{t('coreHr.employees.compensation.effective')}</th>
                <th className="px-4 py-3 font-semibold">{t('coreHr.employees.compensation.end')}</th>
                <th className="px-4 py-3 font-semibold">{t('coreHr.employees.compensation.notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-dark-text">
                    {formatMoney(c.amount, c.currency, locale)}
                    {isCurrent(c) ? (
                      <Badge tone="green" className="ml-2">
                        {t('coreHr.employees.compensation.current')}
                      </Badge>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {t(`coreHr.employees.compensation.frequencies.${c.payFrequency}`, { defaultValue: c.payFrequency })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(c.effectiveDate, locale)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {c.endDate ? formatDate(c.endDate, locale) : '—'}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-600">{c.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={open}
        onClose={() => (busy ? undefined : setOpen(false))}
        title={t('coreHr.employees.compensation.addTitle')}
        width="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => setOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button size="sm" disabled={busy} onClick={() => void save()}>
              {busy ? t('common.actions.saving') : t('common.actions.saveChanges')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? <ErrorMessage message={formError} /> : null}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <TextField
                label={t('coreHr.employees.compensation.amount')}
                required
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <TextField
              label={t('coreHr.employees.compensation.currency')}
              required
              maxLength={3}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
            />
          </div>
          <SelectField
            label={t('coreHr.employees.compensation.frequency')}
            value={form.payFrequency}
            onChange={(e) => setForm({ ...form, payFrequency: e.target.value })}
            options={PAY_FREQUENCIES.map((f) => ({ value: f, label: t(`coreHr.employees.compensation.frequencies.${f}`) }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t('coreHr.employees.compensation.effective')}
              required
              type="date"
              value={form.effectiveDate}
              onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
            />
            <TextField
              label={t('coreHr.employees.compensation.end')}
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <TextareaField
            label={t('coreHr.employees.compensation.notes')}
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SelectField from '../../../../components/SelectField';
import { apiErrorMessage } from '../../utils/employeeFormat';
import type { HrLookup } from '../../models/employee';

const NEW_VALUE = '__new__';

type Props = {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: HrLookup[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** When provided, an "Add new…" option lets the user create a lookup value inline. */
  onCreate?: (name: string) => Promise<HrLookup>;
};

export default function LookupSelect({ label, value, onChange, options, error, required, disabled, onCreate }: Props) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectOptions = useMemo(() => {
    const visible = options.filter((o) => o.isActive || o.id === value);
    const list = [
      { value: '', label: t('coreHr.employees.form.selectPlaceholder') },
      ...visible.map((o) => ({ value: o.id, label: o.name })),
    ];
    if (onCreate) list.push({ value: NEW_VALUE, label: t('coreHr.employees.form.addNew') });
    return list;
  }, [options, value, onCreate, t]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || !onCreate) return;
    setBusy(true);
    setCreateError(null);
    try {
      const created = await onCreate(trimmed);
      onChange(created.id);
      setAdding(false);
      setName('');
    } catch (err) {
      setCreateError(apiErrorMessage(err, t('coreHr.employees.form.addNewFailed')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SelectField
        label={label}
        required={required}
        disabled={disabled}
        error={error}
        value={adding ? NEW_VALUE : value}
        options={selectOptions}
        onChange={(e) => {
          if (e.target.value === NEW_VALUE) {
            setAdding(true);
            return;
          }
          setAdding(false);
          onChange(e.target.value);
        }}
      />
      {adding ? (
        <div className="mt-2 rounded-lg border border-teal-200 bg-teal-50/50 p-3">
          <div className="flex gap-2">
            <input
              autoFocus
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder={t('coreHr.employees.form.addNewPlaceholder')}
              className="h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              disabled={busy || !name.trim()}
              onClick={() => void submit()}
              className="h-10 rounded-lg bg-teal-600 px-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {busy ? t('common.loading') : t('coreHr.employees.form.add')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setAdding(false);
                setName('');
                setCreateError(null);
              }}
              className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
            >
              {t('common.actions.cancel')}
            </button>
          </div>
          {createError ? <p className="mt-2 text-sm text-red-600">{createError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

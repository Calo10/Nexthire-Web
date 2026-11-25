import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { employeesApi } from '../../api/employeesApi';
import type { EmployeeListItem } from '../../models/employee';
import { employeeName } from '../../utils/employeeFormat';

type Props = {
  label: string;
  value: string;
  onChange: (id: string, employee: EmployeeListItem | null) => void;
  error?: string;
  disabled?: boolean;
  /** Shows the required marker. Defaults to true. */
  required?: boolean;
  /** Label for the current `value` when it is not part of the fetched options (e.g. an existing assignment). */
  fallbackLabel?: string | null;
};

/** Searchable employee select backed by `GET /api/employees` (no hardcoded lists). */
export default function EmployeePicker({ label, value, onChange, error, disabled, required = true, fallbackLabel }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<EmployeeListItem[]>([]);
  const [selected, setSelected] = useState<EmployeeListItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      setLoading(true);
      employeesApi
        .list({ search: search.trim() || undefined, page: 1, pageSize: 50, sort: 'name', dir: 'asc' })
        .then((r) => {
          if (!cancelled) setItems(r.items);
        })
        .catch(() => {
          if (!cancelled) setItems([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [search]);

  const options = selected && !items.some((i) => i.id === selected.id) ? [selected, ...items] : items;

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <input
        type="search"
        value={search}
        disabled={disabled}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('coreHr.documentsHub.upload.employeeSearch')}
        aria-label={t('coreHr.documentsHub.upload.employeeSearch')}
        className="mb-2 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const next = options.find((o) => o.id === e.target.value) ?? null;
          setSelected(next);
          onChange(e.target.value, next);
        }}
        className={`h-12 w-full rounded-lg border bg-white px-4 focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
      >
        <option value="">{loading ? t('common.loading') : t('coreHr.documentsHub.upload.employeePlaceholder')}</option>
        {value && fallbackLabel && !options.some((o) => o.id === value) ? (
          <option value={value}>{fallbackLabel}</option>
        ) : null}
        {options.map((e) => (
          <option key={e.id} value={e.id}>
            {employeeName(e)}
            {e.jobTitle ? ` — ${e.jobTitle}` : ''}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

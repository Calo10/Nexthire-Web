import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchableSelect, { type SearchableSelectOption } from '../../../../components/SearchableSelect';
import { employeesApi } from '../../api/employeesApi';
import { employeeName } from '../../utils/employeeFormat';

type Props = {
  label: string;
  value: string;
  onChange: (id: string, label: string) => void;
  /** Display name for the currently selected manager (so the label shows before options load). */
  selectedLabel?: string | null;
  /** Employee that must not be selectable (an employee cannot manage themselves). */
  excludeId?: string;
  disabled?: boolean;
  error?: string;
};

/** Searchable manager picker backed by `GET /api/employees?search=` (no local employee list). */
export default function ManagerSelect({ label, value, onChange, selectedLabel, excludeId, disabled, error }: Props) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [knownLabels, setKnownLabels] = useState<Record<string, string>>({});
  const reqId = useRef(0);

  const search = useCallback(
    async (query: string) => {
      const id = ++reqId.current;
      setLoading(true);
      try {
        const res = await employeesApi.list({ search: query, pageSize: 50, sort: 'name', dir: 'asc' });
        if (id !== reqId.current) return;
        const next = res.items
          .filter((e) => e.id !== excludeId)
          .map((e) => ({ value: e.id, label: employeeName(e) }));
        setOptions(next);
        setKnownLabels((prev) => ({ ...prev, ...Object.fromEntries(next.map((o) => [o.value, o.label])) }));
      } catch {
        if (id === reqId.current) setOptions([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [excludeId],
  );

  useEffect(() => {
    void search('');
  }, [search]);

  // Resolve the label of a preselected manager that is not in the first page of options.
  useEffect(() => {
    if (!value || selectedLabel || knownLabels[value] || options.some((o) => o.value === value)) return;
    let cancelled = false;
    employeesApi
      .get(value)
      .then((e) => {
        if (!cancelled) setKnownLabels((prev) => ({ ...prev, [value]: employeeName(e) }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [value, selectedLabel, knownLabels, options]);

  const merged = useMemo(() => {
    const list: SearchableSelectOption[] = [{ value: '', label: t('coreHr.employees.form.noManager') }];
    const label = value ? selectedLabel || knownLabels[value] : null;
    if (value && label && !options.some((o) => o.value === value)) list.push({ value, label });
    return [...list, ...options];
  }, [options, value, selectedLabel, knownLabels, t]);

  return (
    <SearchableSelect
      label={label}
      value={value}
      onChange={(v, option) => onChange(v, v ? option.label : '')}
      options={merged}
      loading={loading}
      disabled={disabled}
      error={error}
      placeholder={t('coreHr.employees.form.noManager')}
      searchPlaceholder={t('coreHr.employees.form.searchEmployees')}
      emptyText={t('coreHr.employees.form.noResults')}
      loadingText={t('common.loading')}
      onSearchQueryChange={(q) => void search(q)}
    />
  );
}

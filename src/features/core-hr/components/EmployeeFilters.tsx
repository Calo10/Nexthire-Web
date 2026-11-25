import { useTranslation } from 'react-i18next';
import TextField from '../../../components/TextField';
import type { HrLookupsState } from '../hooks/useHrLookups';
import { EMPLOYMENT_STATUSES } from '../models/employee';
import { activeFilterCount, type EmployeeFilterState } from '../models/employeeFilters';
import ManagerSelect from './form/ManagerSelect';

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-10 min-w-[140px] rounded-lg border bg-white px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500 ${
        value ? 'border-teal-300 text-dark-text' : 'border-gray-300 text-gray-600'
      }`}
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

type Props = {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filters: EmployeeFilterState;
  onFiltersChange: (patch: Partial<EmployeeFilterState>) => void;
  onClear: () => void;
  lookups: HrLookupsState;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  total?: number;
};

export default function EmployeeFilters({
  searchInput,
  onSearchChange,
  filters,
  onFiltersChange,
  onClear,
  lookups,
  advancedOpen,
  onToggleAdvanced,
}: Props) {
  const { t } = useTranslation();
  const activeCount = activeFilterCount(filters);
  const hasAny = activeCount > 0 || searchInput.trim() !== '';
  const active = (list: { id: string; name: string; isActive: boolean }[], selected: string) =>
    list.filter((o) => o.isActive || o.id === selected).map((o) => ({ value: o.id, label: o.name }));

  // Advanced-only filters count toward the badge on the toggle.
  const advancedCount = [filters.jobTitleId, filters.managerId, filters.hireFrom, filters.hireTo].filter(Boolean).length +
    (filters.includeArchived ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('coreHr.employees.filters.searchPlaceholder')}
            aria-label={t('coreHr.employees.filters.searchPlaceholder')}
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <FilterSelect
          label={t('coreHr.employees.filters.department')}
          value={filters.departmentId}
          onChange={(v) => onFiltersChange({ departmentId: v })}
          options={active(lookups.departments, filters.departmentId)}
        />
        <FilterSelect
          label={t('coreHr.employees.filters.location')}
          value={filters.workLocationId}
          onChange={(v) => onFiltersChange({ workLocationId: v })}
          options={active(lookups.locations, filters.workLocationId)}
        />
        <FilterSelect
          label={t('coreHr.employees.filters.status')}
          value={filters.employmentStatus}
          onChange={(v) => onFiltersChange({ employmentStatus: v })}
          options={EMPLOYMENT_STATUSES.map((s) => ({ value: s, label: t(`coreHr.employees.status.${s}`) }))}
        />
        <FilterSelect
          label={t('coreHr.employees.filters.employmentType')}
          value={filters.employmentTypeId}
          onChange={(v) => onFiltersChange({ employmentTypeId: v })}
          options={active(lookups.employmentTypes, filters.employmentTypeId)}
        />
        <button
          type="button"
          onClick={onToggleAdvanced}
          aria-expanded={advancedOpen}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4h18M6 12h12m-9 8h6"
            />
          </svg>
          {t('coreHr.employees.filters.advanced')}
          {advancedCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1.5 text-[11px] font-semibold text-white">
              {advancedCount}
            </span>
          ) : null}
        </button>
        {hasAny ? (
          <button
            type="button"
            onClick={onClear}
            className="h-10 px-2 text-sm font-medium text-teal-700 hover:text-teal-900"
          >
            {t('coreHr.employees.filters.clear')}
          </button>
        ) : null}
      </div>

      {advancedOpen ? (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            label={t('coreHr.employees.filters.hireFrom')}
            type="date"
            value={filters.hireFrom}
            max={filters.hireTo || undefined}
            onChange={(e) => onFiltersChange({ hireFrom: e.target.value })}
          />
          <TextField
            label={t('coreHr.employees.filters.hireTo')}
            type="date"
            value={filters.hireTo}
            min={filters.hireFrom || undefined}
            onChange={(e) => onFiltersChange({ hireTo: e.target.value })}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{t('coreHr.employees.filters.jobTitle')}</label>
            <select
              value={filters.jobTitleId}
              onChange={(e) => onFiltersChange({ jobTitleId: e.target.value })}
              className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t('coreHr.employees.filters.anyJobTitle')}</option>
              {active(lookups.jobTitles, filters.jobTitleId).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <ManagerSelect
            label={t('coreHr.employees.filters.manager')}
            value={filters.managerId}
            onChange={(id) => onFiltersChange({ managerId: id })}
          />
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 sm:col-span-2 lg:col-span-4">
            <input
              type="checkbox"
              checked={filters.includeArchived}
              onChange={(e) => onFiltersChange({ includeArchived: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            {t('coreHr.employees.filters.includeArchived')}
          </label>
        </div>
      ) : null}
    </div>
  );
}

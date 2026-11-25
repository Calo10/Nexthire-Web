import { useTranslation } from 'react-i18next';
import type { HrLookupsState } from '../../hooks/useHrLookups';
import type { OffboardingLookups } from '../../hooks/useOffboardingLookups';
import {
  activeOffboardingFilterCount,
  OFFBOARDING_STATUSES,
  SEPARATION_TYPES,
  type OffboardingFilterState,
} from '../../models/offboarding';

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
  filters: OffboardingFilterState;
  onFiltersChange: (patch: Partial<OffboardingFilterState>) => void;
  onClear: () => void;
  hrLookups: HrLookupsState;
  lookups: OffboardingLookups;
  /** Status filter only makes sense in the list view (the pipeline has one column per status). */
  showStatus: boolean;
};

export default function OffboardingFilters({
  searchInput,
  onSearchChange,
  filters,
  onFiltersChange,
  onClear,
  hrLookups,
  lookups,
  showStatus,
}: Props) {
  const { t } = useTranslation();
  const hasAny = activeOffboardingFilterCount(filters) > 0 || searchInput.trim() !== '';

  return (
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
          placeholder={t('coreHr.offboarding.filters.searchPlaceholder')}
          aria-label={t('coreHr.offboarding.filters.searchPlaceholder')}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>
      <FilterSelect
        label={t('coreHr.offboarding.filters.department')}
        value={filters.departmentId}
        onChange={(v) => onFiltersChange({ departmentId: v })}
        options={hrLookups.departments
          .filter((d) => d.isActive || d.id === filters.departmentId)
          .map((d) => ({ value: d.id, label: d.name }))}
      />
      <FilterSelect
        label={t('coreHr.offboarding.filters.owner')}
        value={filters.ownerUserId}
        onChange={(v) => onFiltersChange({ ownerUserId: v })}
        options={lookups.owners.map((o) => ({ value: o.id, label: o.name }))}
      />
      <FilterSelect
        label={t('coreHr.offboarding.filters.template')}
        value={filters.templateId}
        onChange={(v) => onFiltersChange({ templateId: v })}
        options={lookups.templates.map((tpl) => ({ value: tpl.id, label: tpl.name }))}
      />
      <FilterSelect
        label={t('coreHr.offboarding.filters.separationType')}
        value={filters.separationType}
        onChange={(v) => onFiltersChange({ separationType: v })}
        options={SEPARATION_TYPES.map((s) => ({ value: s, label: t(`coreHr.offboarding.separationType.${s}`) }))}
      />
      {showStatus ? (
        <FilterSelect
          label={t('coreHr.offboarding.filters.status')}
          value={filters.status}
          onChange={(v) => onFiltersChange({ status: v })}
          options={OFFBOARDING_STATUSES.map((s) => ({ value: s, label: t(`coreHr.offboarding.status.${s}`) }))}
        />
      ) : null}
      <label
        className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium ${
          filters.overdueOnly ? 'border-red-300 text-red-700' : 'border-gray-300 text-gray-600'
        }`}
      >
        <input
          type="checkbox"
          checked={filters.overdueOnly}
          onChange={(e) => onFiltersChange({ overdueOnly: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
        />
        {t('coreHr.offboarding.filters.overdue')}
      </label>
      {hasAny ? (
        <button type="button" onClick={onClear} className="h-10 px-2 text-sm font-medium text-teal-700 hover:text-teal-900">
          {t('coreHr.offboarding.filters.clear')}
        </button>
      ) : null}
    </div>
  );
}

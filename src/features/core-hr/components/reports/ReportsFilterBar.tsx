import { useTranslation } from 'react-i18next';
import type { HrLookupsState } from '../../hooks/useHrLookups';
import { COMPARISON_MODES, DATE_PRESETS, type ComparisonMode, type DatePreset, type ReportsFilters } from '../../models/hrReports';

const selectCls =
  'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-dark-text focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500';

type Props = {
  /** `primary`: date range + comparison (page header). `secondary`: org dimension filters (under the tabs). */
  part: 'primary' | 'secondary';
  filters: ReportsFilters;
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  onFiltersChange: (patch: Partial<ReportsFilters>) => void;
  onClear?: () => void;
  lookups?: HrLookupsState;
};

export default function ReportsFilterBar({ part, filters, preset, onPresetChange, onFiltersChange, onClear, lookups }: Props) {
  const { t } = useTranslation();

  if (part === 'primary') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label={t('coreHr.reports.filters.preset')}
          value={preset}
          onChange={(e) => onPresetChange(e.target.value as DatePreset)}
          className={selectCls}
        >
          {DATE_PRESETS.map((p) => (
            <option key={p} value={p}>
              {t(`coreHr.reports.filters.presets.${p}`)}
            </option>
          ))}
        </select>
        {preset === 'custom' ? (
          <>
            <input
              type="date"
              aria-label={t('coreHr.reports.filters.from')}
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) => onFiltersChange({ from: e.target.value })}
              className={selectCls}
            />
            <input
              type="date"
              aria-label={t('coreHr.reports.filters.to')}
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) => onFiltersChange({ to: e.target.value })}
              className={selectCls}
            />
          </>
        ) : null}
        <select
          aria-label={t('coreHr.reports.filters.comparison')}
          value={filters.comparison}
          onChange={(e) => onFiltersChange({ comparison: e.target.value as ComparisonMode })}
          className={selectCls}
        >
          {COMPARISON_MODES.map((c) => (
            <option key={c} value={c}>
              {t(`coreHr.reports.filters.comparisonModes.${c}`)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const hasDimension = !!(filters.departmentId || filters.workLocationId || filters.employmentTypeId || filters.employmentStatus);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label={t('coreHr.reports.filters.department')}
        value={filters.departmentId}
        onChange={(e) => onFiltersChange({ departmentId: e.target.value })}
        className={selectCls}
      >
        <option value="">{t('coreHr.reports.filters.allDepartments')}</option>
        {(lookups?.departments ?? [])
          .filter((d) => d.isActive || d.id === filters.departmentId)
          .map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
      </select>
      <select
        aria-label={t('coreHr.reports.filters.location')}
        value={filters.workLocationId}
        onChange={(e) => onFiltersChange({ workLocationId: e.target.value })}
        className={selectCls}
      >
        <option value="">{t('coreHr.reports.filters.allLocations')}</option>
        {(lookups?.locations ?? [])
          .filter((l) => l.isActive || l.id === filters.workLocationId)
          .map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
      </select>
      <select
        aria-label={t('coreHr.reports.filters.employmentType')}
        value={filters.employmentTypeId}
        onChange={(e) => onFiltersChange({ employmentTypeId: e.target.value })}
        className={selectCls}
      >
        <option value="">{t('coreHr.reports.filters.allTypes')}</option>
        {(lookups?.employmentTypes ?? [])
          .filter((x) => x.isActive || x.id === filters.employmentTypeId)
          .map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
      </select>
      {hasDimension && onClear ? (
        <button type="button" onClick={onClear} className="text-sm font-medium text-violet-700 hover:underline">
          {t('coreHr.reports.filters.clear')}
        </button>
      ) : null}
    </div>
  );
}

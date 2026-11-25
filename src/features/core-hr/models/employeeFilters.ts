export type EmployeeFilterState = {
  departmentId: string;
  workLocationId: string;
  employmentStatus: string;
  employmentTypeId: string;
  jobTitleId: string;
  managerId: string;
  hireFrom: string;
  hireTo: string;
  includeArchived: boolean;
};

export const EMPTY_FILTERS: EmployeeFilterState = {
  departmentId: '',
  workLocationId: '',
  employmentStatus: '',
  employmentTypeId: '',
  jobTitleId: '',
  managerId: '',
  hireFrom: '',
  hireTo: '',
  includeArchived: false,
};

export function activeFilterCount(f: EmployeeFilterState): number {
  return Object.entries(f).filter(([, v]) => (typeof v === 'boolean' ? v : v !== '')).length;
}

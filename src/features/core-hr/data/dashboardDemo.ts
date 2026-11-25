/** Demo figures matching the Core HR People Dashboard mock — replace with API later. */

export const hrDashboardMetrics = {
  activeEmployees: { value: 328, delta: '+4.1%' },
  newHires: { value: 12, delta: '+50%' },
  onboardingInProgress: { value: 8 },
  docsExpiring: { value: 14 },
} as const;

export const hrHeadcountTrend = [
  { label: 'Sep', value: 278 },
  { label: 'Oct', value: 292 },
  { label: 'Nov', value: 305 },
  { label: 'Dic', value: 318 },
  { label: 'Ene', value: 328 },
];

export const hrAreaSlices = [
  { key: 'operations', percent: 36, color: '#8B5CF6' },
  { key: 'sales', percent: 18, color: '#A78BFA' },
  { key: 'admin', percent: 15, color: '#C4B5FD' },
  { key: 'hospitality', percent: 14, color: '#DDD6FE' },
  { key: 'it', percent: 7, color: '#EDE9FE' },
  { key: 'other', percent: 10, color: '#F5F3FF' },
] as const;

export const hrProcesses = [
  { key: 'onboarding', count: 8, countKey: 'employees' as const },
  { key: 'dataUpdate', count: 5, countKey: 'employees' as const },
  { key: 'signatures', count: 6, countKey: 'documents' as const },
] as const;

export const hrUpcomingEvents: {
  key: string;
  dateKey: string;
  celebrate?: boolean;
}[] = [
  { key: 'onboardingsEnd', dateKey: 'jan28' },
  { key: 'contractsExpire', dateKey: 'jan30' },
  { key: 'birthdays', dateKey: 'feb03', celebrate: true },
];

export const hrIncludesKeys = [
  'digitalFile',
  'onboardingChecklists',
  'docsAndSignatures',
  'orgChart',
  'peopleReports',
  'employeePortal',
] as const;

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

/** Same palette as Recruitment dashboard charts (BarChart / LineChart). */
export const hrAreaSlices = [
  { key: 'operations', percent: 36, color: '#8B5CF6' },
  { key: 'sales', percent: 18, color: '#3B82F6' },
  { key: 'admin', percent: 15, color: '#F97316' },
  { key: 'hospitality', percent: 14, color: '#F59E0B' },
  { key: 'it', percent: 7, color: '#10B981' },
  { key: 'other', percent: 10, color: '#EC4899' },
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


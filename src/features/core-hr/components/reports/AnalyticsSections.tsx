import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import { hrReportsApi } from '../../api/hrReportsApi';
import { useOrgResource, type OrgResource } from '../../hooks/useOrgResource';
import type { ReportsFilters } from '../../models/hrReports';
import AnalyticsKpiStrip from './AnalyticsKpiStrip';
import ChartPanel, { PanelSkeleton } from './ChartPanel';
import DualSeriesChart from './DualSeriesChart';
import HeadcountEvolutionChart from './HeadcountEvolutionChart';
import NamedBarChart from './NamedBarChart';
import WorkforceDonutChart from './WorkforceDonutChart';

type SectionProps = {
  filters: ReportsFilters;
  reloadKey: number;
  /** Whether the user may see the retention block (Reports.ViewRetention). */
  canViewRetention?: boolean;
};

/** Shared loading / error / content wrapper for a section resource. */
function Resource<T>({ res, children }: { res: OrgResource<T>; children: (data: T) => ReactNode }) {
  const { t } = useTranslation();
  if (res.error && !res.data) {
    return (
      <div className="space-y-3">
        <ErrorMessage message={res.error} />
        <Button variant="outline" size="sm" onClick={res.reload}>
          {t('coreHr.reports.actions.retry')}
        </Button>
      </div>
    );
  }
  if (!res.data) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <PanelSkeleton key={i} height={92} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelSkeleton height={300} />
          <PanelSkeleton height={300} />
        </div>
      </div>
    );
  }
  return (
    <div className={`space-y-4 ${res.loading ? 'opacity-70 transition-opacity' : ''}`}>
      {res.error ? <ErrorMessage message={res.error} /> : null}
      {children(res.data)}
    </div>
  );
}

const Grid = ({ children }: { children: ReactNode }) => <div className="grid gap-4 lg:grid-cols-2">{children}</div>;

/* ------------------------------------------------------------------ */

export function WorkforceSection({ filters, reloadKey, canViewRetention }: SectionProps) {
  const { t } = useTranslation();
  const k = 'coreHr.reports.kpi';
  const a = 'coreHr.reports.analytics';
  const res = useOrgResource(() => hrReportsApi.workforce(filters), true, reloadKey, t('coreHr.reports.analytics.loadError'));
  const retention = useOrgResource(() => hrReportsApi.retention(filters), !!canViewRetention, reloadKey, t('coreHr.reports.analytics.loadError'));

  return (
    <div className="space-y-8">
      <Resource res={res}>
        {(d) => (
          <>
            <AnalyticsKpiStrip
              items={[
                { key: 'total', label: t(`${k}.totalEmployees`), metric: d.totalEmployees },
                { key: 'active', label: t(`${k}.activeEmployees`), metric: d.activeEmployees },
                { key: 'leave', label: t(`${k}.onLeave`), metric: d.onLeave, risingIsGood: false },
                { key: 'hires', label: t(`${k}.newHires`), metric: d.newHires },
                { key: 'departures', label: t(`${k}.departures`), metric: d.departures, risingIsGood: false },
                { key: 'net', label: t(`${k}.netGrowth`), metric: d.netGrowth },
                { key: 'tenure', label: t(`${k}.avgTenure`), metric: d.averageTenureYears, format: 'years' },
                { key: 'retention', label: t(`${k}.retentionRate`), metric: d.retentionRate, format: 'percent' },
              ]}
            />
            <Grid>
              <ChartPanel title={t('coreHr.reports.overview.headcountEvolution')}>
                <HeadcountEvolutionChart data={d.headcountEvolution} name={t(`${k}.totalEmployees`)} />
              </ChartPanel>
              <ChartPanel title={t(`${a}.arrivalsVsDepartures`)}>
                <DualSeriesChart a={d.arrivals} b={d.departuresSeries} aName={t(`${k}.newHires`)} bName={t(`${k}.departures`)} />
              </ChartPanel>
              <ChartPanel title={t('coreHr.reports.overview.byDepartment')}>
                <WorkforceDonutChart slices={d.byDepartment} centerLabel={t('coreHr.reports.overview.employees')} />
              </ChartPanel>
              <ChartPanel title={t(`${a}.byLocation`)}>
                <NamedBarChart data={d.byLocation} name={t(`${k}.totalEmployees`)} />
              </ChartPanel>
              <ChartPanel title={t(`${a}.byEmploymentType`)}>
                <WorkforceDonutChart slices={d.byEmploymentType} centerLabel={t('coreHr.reports.overview.employees')} />
              </ChartPanel>
              <ChartPanel title={t(`${a}.byStatus`)}>
                <NamedBarChart data={d.byStatus} name={t(`${k}.totalEmployees`)} multiColor />
              </ChartPanel>
              <ChartPanel title={t(`${a}.byWorkModality`)}>
                <WorkforceDonutChart slices={d.byWorkModality} centerLabel={t('coreHr.reports.overview.employees')} />
              </ChartPanel>
              <ChartPanel title={t(`${a}.tenureBuckets`)}>
                <NamedBarChart data={d.tenureBuckets} name={t(`${k}.totalEmployees`)} layout="vertical" />
              </ChartPanel>
            </Grid>
          </>
        )}
      </Resource>

      {canViewRetention ? (
        <section className="space-y-4" aria-labelledby="retention-heading">
          <h2 id="retention-heading" className="text-lg font-semibold text-dark-text">
            {t(`${a}.retentionHeading`)}
          </h2>
          <Resource res={retention}>
            {(r) => (
              <>
                <AnalyticsKpiStrip
                  items={[
                    { key: 'turnover', label: t(`${k}.turnoverRate`), metric: r.turnoverRate, format: 'percent', risingIsGood: false },
                    { key: 'retention', label: t(`${k}.retentionRate`), metric: r.retentionRate, format: 'percent' },
                    { key: 'departures', label: t(`${k}.departures`), value: r.departuresInPeriod },
                    { key: 'tenureDep', label: t(`${k}.tenureAtDeparture`), metric: r.averageTenureAtDeparture, format: 'years', risingIsGood: false },
                  ]}
                />
                <Grid>
                  <ChartPanel title={t(`${a}.monthlyTurnover`)}>
                    <HeadcountEvolutionChart data={r.monthlyTurnover} name={t(`${k}.turnoverRate`)} variant="line" color="#EF4444" valueSuffix="%" />
                  </ChartPanel>
                  <ChartPanel title={t(`${a}.departuresByDepartment`)}>
                    <NamedBarChart data={r.departuresByDepartment} name={t(`${k}.departures`)} color="#EF4444" />
                  </ChartPanel>
                  <ChartPanel title={t(`${a}.departuresByEmploymentType`)}>
                    <WorkforceDonutChart slices={r.departuresByEmploymentType} centerLabel={t(`${k}.departures`)} />
                  </ChartPanel>
                  <ChartPanel title={t(`${a}.separationReasons`)}>
                    {r.separationReasonsRestricted ? (
                      <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm text-amber-800">
                        {t(`${a}.separationReasonsRestricted`)}
                      </p>
                    ) : (
                      <NamedBarChart data={r.separationReasons} name={t(`${k}.departures`)} />
                    )}
                  </ChartPanel>
                  <ChartPanel title={t(`${a}.retentionMilestones`)}>
                    <NamedBarChart data={r.retentionMilestones} name={t(`${k}.retentionRate`)} layout="vertical" color="#0D9488" />
                  </ChartPanel>
                </Grid>
              </>
            )}
          </Resource>
        </section>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function OnboardingSection({ filters, reloadKey }: SectionProps) {
  const { t } = useTranslation();
  const k = 'coreHr.reports.kpi';
  const a = 'coreHr.reports.analytics';
  const res = useOrgResource(() => hrReportsApi.onboarding(filters), true, reloadKey, t(`${a}.loadError`));
  return (
    <Resource res={res}>
      {(d) => (
        <>
          <AnalyticsKpiStrip
            items={[
              { key: 'completion', label: t(`${k}.completion`), value: d.performance.completionPct, format: 'percent' },
              { key: 'days', label: t(`${k}.avgCompletionDays`), value: d.performance.averageCompletionDays, format: 'days' },
              { key: 'progress', label: t(`${k}.avgProgress`), value: d.averageProgressPercent, format: 'percent' },
              { key: 'active', label: t(`${k}.activeProcesses`), value: d.performance.active },
              { key: 'completed', label: t(`${k}.completedInPeriod`), value: d.performance.completedInPeriod },
              { key: 'overdueTasks', label: t(`${k}.overdueTasks`), value: d.overdueTasks, tone: d.overdueTasks > 0 ? 'warning' : 'default' },
              { key: 'overdueProc', label: t(`${k}.overdueProcesses`), value: d.overdueOnboardings, tone: d.overdueOnboardings > 0 ? 'danger' : 'default' },
            ]}
          />
          <Grid>
            <ChartPanel title={t(`${a}.completionTrend`)}>
              <HeadcountEvolutionChart data={d.completionTrend} name={t(`${k}.completion`)} variant="line" color="#0D9488" valueSuffix="%" />
            </ChartPanel>
            <ChartPanel title={t(`${a}.byStatusProcess`)}>
              <WorkforceDonutChart slices={d.byStatus} centerLabel={t(`${k}.activeProcesses`)} />
            </ChartPanel>
            <ChartPanel title={t('coreHr.reports.overview.byDepartment')} className="lg:col-span-2">
              <NamedBarChart data={d.byDepartment} name={t(`${k}.activeProcesses`)} />
            </ChartPanel>
          </Grid>
        </>
      )}
    </Resource>
  );
}

export function OffboardingSection({ filters, reloadKey }: SectionProps) {
  const { t } = useTranslation();
  const k = 'coreHr.reports.kpi';
  const a = 'coreHr.reports.analytics';
  const res = useOrgResource(() => hrReportsApi.offboarding(filters), true, reloadKey, t(`${a}.loadError`));
  return (
    <Resource res={res}>
      {(d) => (
        <>
          <AnalyticsKpiStrip
            items={[
              { key: 'completion', label: t(`${k}.completion`), value: d.performance.completionPct, format: 'percent' },
              { key: 'days', label: t(`${k}.avgCompletionDays`), value: d.performance.averageCompletionDays, format: 'days' },
              { key: 'active', label: t(`${k}.activeProcesses`), value: d.performance.active },
              { key: 'completed', label: t(`${k}.completedInPeriod`), value: d.performance.completedInPeriod },
              { key: 'assets', label: t(`${k}.pendingAssets`), value: d.pendingAssetReturns, tone: d.pendingAssetReturns > 0 ? 'warning' : 'default' },
              { key: 'access', label: t(`${k}.pendingAccess`), value: d.pendingAccessRevocations, tone: d.pendingAccessRevocations > 0 ? 'danger' : 'default' },
              { key: 'clearance', label: t(`${k}.pendingClearance`), value: d.pendingClearance, tone: d.pendingClearance > 0 ? 'warning' : 'default' },
            ]}
          />
          <Grid>
            <ChartPanel title={t(`${a}.completionTrend`)}>
              <HeadcountEvolutionChart data={d.completionTrend} name={t(`${k}.completion`)} variant="line" color="#F59E0B" valueSuffix="%" />
            </ChartPanel>
            <ChartPanel title={t(`${a}.byStatusProcess`)}>
              <WorkforceDonutChart slices={d.byStatus} centerLabel={t(`${k}.activeProcesses`)} />
            </ChartPanel>
            <ChartPanel title={t(`${a}.bySeparationType`)}>
              <NamedBarChart data={d.bySeparationType} name={t(`${k}.departures`)} multiColor />
            </ChartPanel>
            <ChartPanel title={t('coreHr.reports.overview.byDepartment')}>
              <NamedBarChart data={d.byDepartment} name={t(`${k}.activeProcesses`)} />
            </ChartPanel>
          </Grid>
        </>
      )}
    </Resource>
  );
}

export function OrganizationSection({ filters, reloadKey }: SectionProps) {
  const { t } = useTranslation();
  const k = 'coreHr.reports.kpi';
  const a = 'coreHr.reports.analytics';
  const res = useOrgResource(() => hrReportsApi.organization(filters), true, reloadKey, t(`${a}.loadError`));
  return (
    <Resource res={res}>
      {(d) => (
        <>
          <AnalyticsKpiStrip
            items={[
              { key: 'depts', label: t(`${k}.departments`), value: d.totalDepartments },
              { key: 'teams', label: t(`${k}.teams`), value: d.totalTeams },
              { key: 'positions', label: t(`${k}.positions`), value: d.totalPositions },
              { key: 'approved', label: t(`${k}.approvedHeadcount`), value: d.approvedHeadcount },
              { key: 'actual', label: t(`${k}.actualHeadcount`), value: d.actualHeadcount },
              { key: 'vacant', label: t(`${k}.vacantPositions`), value: d.vacantPositions, hint: t(`${k}.occupiedHint`, { count: d.occupiedPositions }) },
              { key: 'util', label: t(`${k}.utilization`), value: d.headcountUtilizationPct, format: 'percent' },
              { key: 'span', label: t(`${k}.spanOfControl`), value: d.averageSpanOfControl, format: 'days', hint: t(`${k}.depthHint`, { count: d.organizationalDepth }) },
              { key: 'noManager', label: t(`${k}.withoutManager`), value: d.employeesWithoutManager, tone: d.employeesWithoutManager > 0 ? 'warning' : 'default' },
              { key: 'noPosition', label: t(`${k}.withoutPosition`), value: d.employeesWithoutPosition, tone: d.employeesWithoutPosition > 0 ? 'warning' : 'default' },
            ]}
          />
          <Grid>
            <ChartPanel title={t(`${a}.utilizationByDepartment`)}>
              <NamedBarChart data={d.utilizationByDepartment} name={t(`${k}.utilization`)} valueSuffix="%" />
            </ChartPanel>
            <ChartPanel title={t(`${a}.vacanciesByDepartment`)}>
              <NamedBarChart data={d.vacanciesByDepartment} name={t(`${k}.vacantPositions`)} color="#F59E0B" />
            </ChartPanel>
          </Grid>
        </>
      )}
    </Resource>
  );
}

export function DocumentsSection({ filters, reloadKey }: SectionProps) {
  const { t } = useTranslation();
  const k = 'coreHr.reports.kpi';
  const a = 'coreHr.reports.analytics';
  const res = useOrgResource(() => hrReportsApi.documents(filters), true, reloadKey, t(`${a}.loadError`));
  return (
    <Resource res={res}>
      {(d) => (
        <>
          <AnalyticsKpiStrip
            items={[
              { key: 'complete', label: t(`${k}.completeness`), value: d.compliance.completenessPct, format: 'percent' },
              { key: 'total', label: t(`${k}.totalDocuments`), value: d.compliance.totalDocuments },
              { key: 'valid', label: t(`${k}.validDocuments`), value: d.compliance.validDocuments },
              { key: 'expired', label: t(`${k}.expired`), value: d.compliance.expired, tone: d.compliance.expired > 0 ? 'danger' : 'default' },
              { key: 'e7', label: t(`${k}.expiring7`), value: d.expiringIn7Days, tone: d.expiringIn7Days > 0 ? 'danger' : 'default' },
              { key: 'e30', label: t(`${k}.expiring30`), value: d.compliance.expiringIn30Days, tone: d.compliance.expiringIn30Days > 0 ? 'warning' : 'default' },
              { key: 'e60', label: t(`${k}.expiring60`), value: d.expiringIn60Days },
              { key: 'requests', label: t(`${k}.openRequests`), value: d.compliance.openRequests },
            ]}
          />
          <Grid>
            <ChartPanel title={t(`${a}.byCategory`)}>
              <WorkforceDonutChart slices={d.byCategory} centerLabel={t(`${k}.totalDocuments`)} />
            </ChartPanel>
            <ChartPanel title={t(`${a}.completenessByDepartment`)}>
              <NamedBarChart data={d.completenessByDepartment} name={t(`${k}.completeness`)} valueSuffix="%" color="#0D9488" />
            </ChartPanel>
          </Grid>
        </>
      )}
    </Resource>
  );
}

export function CompensationSection({ filters, reloadKey }: SectionProps) {
  const { t } = useTranslation();
  const k = 'coreHr.reports.kpi';
  const a = 'coreHr.reports.analytics';
  const res = useOrgResource(() => hrReportsApi.compensation(filters), true, reloadKey, t(`${a}.loadError`));
  return (
    <Resource res={res}>
      {(d) =>
        !d.available ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
            <h3 className="text-base font-semibold text-dark-text">{t(`${a}.compensationUnavailable`)}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{d.unavailableReason || t(`${a}.compensationUnavailableHint`)}</p>
          </div>
        ) : (
          <>
            {d.restrictedByCohortSize ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{t(`${a}.cohortRestricted`)}</p>
            ) : null}
            <AnalyticsKpiStrip
              items={[
                { key: 'count', label: t(`${k}.employeesIncluded`), value: d.employeeCount },
                { key: 'avg', label: t(`${k}.averageSalary`), value: d.averageAnnualized, format: 'currency', currency: d.currency },
                { key: 'median', label: t(`${k}.medianSalary`), value: d.medianAnnualized, format: 'currency', currency: d.currency },
              ]}
            />
            <Grid>
              <ChartPanel title={t(`${a}.compByDepartment`)}>
                <NamedBarChart data={d.byDepartment} name={t(`${k}.averageSalary`)} />
              </ChartPanel>
              <ChartPanel title={t(`${a}.compByJobTitle`)}>
                <NamedBarChart data={d.byJobTitle} name={t(`${k}.averageSalary`)} color="#0D9488" />
              </ChartPanel>
            </Grid>
          </>
        )
      }
    </Resource>
  );
}

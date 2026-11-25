import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { organizationApi } from '../../api/organizationApi';
import type {
  DepartmentChart,
  DepartmentNode,
  DepartmentSummary,
  OrgPosition,
  OrgPersonRef,
  OrgSelection,
  PeopleChart,
  PeopleChartNode,
} from '../../models/organization';
import { OCCUPANCY_CLASSES, positionStatusTone, safeColor, tintColor } from '../../utils/organizationFormat';
import EmployeeAvatar from '../EmployeeAvatar';
import OrgDeptIcon from './OrgDeptIcon';

export type OrgInspectorPermissions = {
  manageDepartments: boolean;
  managePositions: boolean;
  manageReporting: boolean;
  assignEmployees: boolean;
  viewPeople: boolean;
};

type Props = {
  selection: OrgSelection | null;
  departmentChart: DepartmentChart | null;
  peopleChart: PeopleChart | null;
  /** Bumped by the page after mutations so lazily-loaded detail refreshes. */
  reloadKey: number;
  permissions: OrgInspectorPermissions;
  onClose: () => void;
  onEditDepartment: (id: string) => void;
  onArchiveDepartment: (dept: DepartmentNode) => void;
  onAddPosition: (departmentId: string) => void;
  onEditPosition: (position: OrgPosition) => void;
  onArchivePosition: (position: OrgPosition) => void;
  onAssignPosition: (position: OrgPosition) => void;
  onUnassignPosition: (position: OrgPosition, occupant: OrgPersonRef) => void;
  onChangeManager: (person: { id: string; name: string }) => void;
};

function findDept(list: DepartmentNode[], id: string): DepartmentNode | null {
  for (const d of list) {
    if (d.id === id) return d;
    const hit = findDept(d.children, id);
    if (hit) return hit;
  }
  return null;
}

function findPerson(list: PeopleChartNode[], id: string): PeopleChartNode | null {
  for (const p of list) {
    if (p.employeeId === id) return p;
    const hit = findPerson(p.children, id);
    if (hit) return hit;
  }
  return null;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-dark-text">{children}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-lg font-bold leading-tight text-dark-text">{value}</p>
      <p className="text-[11px] text-gray-500">{label}</p>
    </div>
  );
}

function PersonLine({ person, action }: { person: OrgPersonRef; action?: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 py-1.5">
      <EmployeeAvatar name={person.name} seed={person.id} url={person.photoUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-dark-text">{person.name}</p>
        {person.jobTitle ? <p className="truncate text-xs text-gray-500">{person.jobTitle}</p> : null}
      </div>
      {action}
    </li>
  );
}

const outlineBtn =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-dark-text hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50';
const dangerBtn =
  'w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500';

export default function OrgInspector({
  selection,
  departmentChart,
  peopleChart,
  reloadKey,
  permissions,
  onClose,
  onEditDepartment,
  onArchiveDepartment,
  onAddPosition,
  onEditPosition,
  onArchivePosition,
  onAssignPosition,
  onUnassignPosition,
  onChangeManager,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [deptSummary, setDeptSummary] = useState<DepartmentSummary | null>(null);
  const [position, setPosition] = useState<OrgPosition | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);

  const selKey = selection ? (selection.kind === 'company' ? 'company' : `${selection.kind}:${selection.id}`) : null;

  // Reopen when a new node is picked.
  useEffect(() => {
    if (selKey) setOpen(true);
  }, [selKey]);

  useEffect(() => {
    setDeptSummary(null);
    setPosition(null);
    setDetailError(false);
    if (!selection || (selection.kind !== 'department' && selection.kind !== 'position')) {
      setDetailLoading(false);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    const req =
      selection.kind === 'department'
        ? organizationApi.getDepartmentSummary(selection.id).then((s) => !cancelled && setDeptSummary(s))
        : organizationApi.getPosition(selection.id).then((p) => !cancelled && setPosition(p));
    req
      .catch(() => {
        if (!cancelled) setDetailError(true);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selection, reloadKey]);

  if (!open) {
    return (
      <aside className="flex w-10 shrink-0 flex-col items-center border-l border-gray-200 bg-white py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('coreHr.organization.inspector.expand')}
          title={t('coreHr.organization.inspector.expand')}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    );
  }

  const dept = selection?.kind === 'department' && departmentChart ? findDept(departmentChart.departments, selection.id) : null;
  const person = selection?.kind === 'person' && peopleChart ? findPerson(peopleChart.roots, selection.id) : null;

  let body: ReactNode = (
    <p className="px-4 py-10 text-center text-sm text-gray-500">{t('coreHr.organization.inspector.empty')}</p>
  );

  if (selection?.kind === 'company' && departmentChart) {
    const r = departmentChart.root;
    body = (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <OrgDeptIcon name="building" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-dark-text">{r.name}</p>
            <p className="text-xs text-gray-500">{t('coreHr.organization.inspector.company')}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label={t('coreHr.organization.kpi.employees')} value={r.totalEmployees} />
          <Stat label={t('coreHr.organization.kpi.departments')} value={r.totalDepartments} />
        </div>
      </div>
    );
  } else if (selection?.kind === 'department') {
    if (!dept) {
      body = <p className="px-4 py-10 text-center text-sm text-gray-500">{t('coreHr.organization.inspector.notFound')}</p>;
    } else {
      const color = safeColor(dept.color);
      const s = deptSummary;
      const util = s?.utilizationPercent ?? dept.utilizationPercent;
      body = (
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: tintColor(color), color }}>
              <OrgDeptIcon name={dept.icon} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-dark-text">{dept.name}</p>
              <p className="text-xs text-gray-500">
                {dept.code ? `${dept.code} · ` : ''}
                {t('coreHr.organization.inspector.department')}
              </p>
            </div>
          </div>
          {dept.description ? <p className="text-sm text-gray-600">{dept.description}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Stat label={t('coreHr.organization.inspector.employees')} value={s?.employeeCount ?? dept.employeeCount} />
            <Stat label={t('coreHr.organization.inspector.positions')} value={s?.positionCount ?? dept.positionCount} />
            <Stat label={t('coreHr.organization.inspector.openPositions')} value={s?.openPositionCount ?? dept.openPositionCount} />
            <Stat label={t('coreHr.organization.inspector.subDepartments')} value={s?.subDepartmentCount ?? dept.children.length} />
          </div>
          {util != null ? (
            <div>
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>{t('coreHr.organization.inspector.utilization')}</span>
                <span className="font-medium text-dark-text">{Math.round(util)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-valuenow={Math.round(util)} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, Math.max(0, util))}%` }} />
              </div>
            </div>
          ) : null}
          <dl className="divide-y divide-gray-100 border-t border-gray-100">
            <Row label={t('coreHr.organization.inspector.head')}>{dept.headName ?? t('coreHr.organization.chart.noHead')}</Row>
            <Row label={t('coreHr.organization.inspector.location')}>{dept.locationName ?? t('common.none')}</Row>
            {s?.averageSpanOfControl != null ? (
              <Row label={t('coreHr.organization.inspector.span')}>{s.averageSpanOfControl.toFixed(1)}</Row>
            ) : null}
            {dept.budgetedHeadcount != null ? (
              <Row label={t('coreHr.organization.inspector.budget')}>{dept.budgetedHeadcount}</Row>
            ) : null}
          </dl>
          {dept.members.length > 0 ? (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('coreHr.organization.inspector.members')}</h4>
              <ul className="divide-y divide-gray-100">
                {dept.members.slice(0, 6).map((m) => (
                  <PersonLine key={m.id || m.name} person={m} />
                ))}
              </ul>
            </div>
          ) : null}
          {detailError ? <p className="text-xs text-amber-700">{t('coreHr.organization.inspector.detailError')}</p> : null}
          {permissions.manageDepartments || permissions.managePositions ? (
            <div className="space-y-2 border-t border-gray-100 pt-3">
              {permissions.managePositions ? (
                <button type="button" className={outlineBtn} onClick={() => onAddPosition(dept.id)}>
                  + {t('coreHr.organization.inspector.addPosition')}
                </button>
              ) : null}
              {permissions.manageDepartments ? (
                <>
                  <button type="button" className={outlineBtn} onClick={() => onEditDepartment(dept.id)}>
                    {t('coreHr.organization.inspector.editDepartment')}
                  </button>
                  <button type="button" className={dangerBtn} onClick={() => onArchiveDepartment(dept)}>
                    {t('coreHr.organization.inspector.archiveDepartment')}
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    }
  } else if (selection?.kind === 'person') {
    if (!person) {
      body = <p className="px-4 py-10 text-center text-sm text-gray-500">{t('coreHr.organization.inspector.notFound')}</p>;
    } else {
      body = (
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-3">
            <EmployeeAvatar name={person.name} seed={person.employeeId} url={person.photoUrl} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-dark-text">{person.name}</p>
              <p className="truncate text-sm text-gray-500">{person.jobTitle || t('common.none')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label={t('coreHr.organization.inspector.directReports')} value={person.directReports} />
            <Stat label={t('coreHr.organization.inspector.totalReports')} value={person.totalReports} />
          </div>
          <dl className="divide-y divide-gray-100 border-t border-gray-100">
            <Row label={t('coreHr.organization.inspector.department')}>{person.departmentName ?? t('common.none')}</Row>
          </dl>
          <div className="space-y-2 border-t border-gray-100 pt-3">
            <Link to={`/app/hr/employees/${person.employeeId}`} className={`${outlineBtn} block text-center`}>
              {t('coreHr.organization.inspector.viewProfile')}
            </Link>
            {permissions.manageReporting ? (
              <button type="button" className={outlineBtn} onClick={() => onChangeManager({ id: person.employeeId, name: person.name })}>
                {t('coreHr.organization.inspector.changeManager')}
              </button>
            ) : null}
          </div>
        </div>
      );
    }
  } else if (selection?.kind === 'position') {
    if (detailLoading && !position) {
      body = <p className="px-4 py-10 text-center text-sm text-gray-500">{t('common.loading')}</p>;
    } else if (!position) {
      body = (
        <p className="px-4 py-10 text-center text-sm text-gray-500">
          {detailError ? t('coreHr.organization.inspector.detailError') : t('coreHr.organization.inspector.notFound')}
        </p>
      );
    } else {
      const tone = positionStatusTone(position);
      body = (
        <div className="space-y-4 p-4">
          <div>
            <p className="text-base font-semibold text-dark-text">{position.title}</p>
            <p className="text-xs text-gray-500">
              {[position.code, position.departmentName].filter(Boolean).join(' · ') || t('coreHr.organization.inspector.position')}
            </p>
            <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${OCCUPANCY_CLASSES[tone]}`}>
              {t('coreHr.organization.positions.occupancy', { filled: position.filledCount, total: position.headcount })}
            </span>
          </div>
          {position.description ? <p className="text-sm text-gray-600">{position.description}</p> : null}
          <dl className="divide-y divide-gray-100 border-t border-gray-100">
            <Row label={t('coreHr.organization.positions.level')}>{position.levelName ?? t('common.none')}</Row>
            <Row label={t('coreHr.organization.positions.location')}>{position.locationName ?? t('common.none')}</Row>
            <Row label={t('coreHr.organization.positions.reportsTo')}>{position.reportsToPositionName ?? t('common.none')}</Row>
          </dl>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('coreHr.organization.inspector.occupants')}</h4>
            {position.occupants.length === 0 ? (
              <p className="text-sm text-gray-500">{t('coreHr.organization.inspector.noOccupants')}</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {position.occupants.map((o) => (
                  <PersonLine
                    key={o.id}
                    person={o}
                    action={
                      permissions.assignEmployees ? (
                        <button
                          type="button"
                          onClick={() => onUnassignPosition(position, o)}
                          className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700 focus:outline-none focus:underline"
                        >
                          {t('coreHr.organization.inspector.unassign')}
                        </button>
                      ) : null
                    }
                  />
                ))}
              </ul>
            )}
          </div>
          {permissions.assignEmployees || permissions.managePositions ? (
            <div className="space-y-2 border-t border-gray-100 pt-3">
              {permissions.assignEmployees ? (
                <button type="button" className={outlineBtn} onClick={() => onAssignPosition(position)} disabled={position.openCount <= 0 && position.headcount > 0}>
                  {t('coreHr.organization.inspector.assign')}
                </button>
              ) : null}
              {permissions.managePositions ? (
                <>
                  <button type="button" className={outlineBtn} onClick={() => onEditPosition(position)}>
                    {t('coreHr.organization.inspector.editPosition')}
                  </button>
                  <button type="button" className={dangerBtn} onClick={() => onArchivePosition(position)}>
                    {t('coreHr.organization.inspector.archivePosition')}
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    }
  }

  return (
    <aside
      aria-label={t('coreHr.organization.inspector.title')}
      className="flex w-[320px] max-w-[45%] shrink-0 flex-col border-l border-gray-200 bg-white"
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-dark-text">{t('coreHr.organization.inspector.title')}</h3>
        <div className="flex items-center gap-1">
          {selection ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {t('coreHr.organization.inspector.clear')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('coreHr.organization.inspector.collapse')}
            title={t('coreHr.organization.inspector.collapse')}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
    </aside>
  );
}


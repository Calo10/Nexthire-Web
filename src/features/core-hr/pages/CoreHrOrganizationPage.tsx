import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { organizationApi } from '../api/organizationApi';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';
import HrToast, { type HrToastState } from '../components/HrToast';
import OrgAddDepartmentModal from '../components/organization/OrgAddDepartmentModal';
import OrgAddPositionModal from '../components/organization/OrgAddPositionModal';
import OrgAssignPositionModal from '../components/organization/OrgAssignPositionModal';
import OrgChangeManagerModal from '../components/organization/OrgChangeManagerModal';
import OrgChartCanvas from '../components/organization/OrgChartCanvas';
import OrgDepartmentsGrid from '../components/organization/OrgDepartmentsGrid';
import OrgInspector from '../components/organization/OrgInspector';
import OrgKpiStrip from '../components/organization/OrgKpiStrip';
import OrgLocationModal from '../components/organization/OrgLocationModal';
import OrgLocationsGrid from '../components/organization/OrgLocationsGrid';
import OrgPositionsPanel from '../components/organization/OrgPositionsPanel';
import OrgReportingPanel from '../components/organization/OrgReportingPanel';
import OrgSettingsPanel from '../components/organization/OrgSettingsPanel';
import OrgWorkspaceTabs from '../components/organization/OrgWorkspaceTabs';
import { useHrLookups } from '../hooks/useHrLookups';
import { useOrgResource } from '../hooks/useOrgResource';
import { ORGANIZATION_PERMISSIONS, useOrganizationCapabilities } from '../hooks/useOrganizationCapabilities';
import {
  ORG_CHART_MODES,
  type DepartmentListItem,
  type DepartmentNode,
  type OrgChartMode,
  type OrgLocation,
  type OrgPersonRef,
  type OrgPosition,
  type OrgSelection,
  type OrgTab,
} from '../models/organization';
import { apiErrorMessage, downloadBlob } from '../utils/employeeFormat';
import { toCsv } from '../utils/organizationFormat';

const P = ORGANIZATION_PERMISSIONS;

function findDeptNode(list: DepartmentNode[], id: string): DepartmentNode | null {
  for (const d of list) {
    if (d.id === id) return d;
    const hit = findDeptNode(d.children, id);
    if (hit) return hit;
  }
  return null;
}

export default function CoreHrOrganizationPage() {
  const { t } = useTranslation();
  const caps = useOrganizationCapabilities();
  const active = caps.ready && !caps.denied;
  const lookups = useHrLookups(active);

  const canViewPeople = caps.has(P.ViewPeople);
  const canManageDepartments = caps.can(P.ManageDepartments);
  const canManagePositions = caps.can(P.ManagePositions);
  const canManageLocations = caps.can(P.ManageLocations);
  const canManageReporting = caps.can(P.ManageReporting);
  const canAssign = caps.can(P.AssignEmployees);
  const canImport = caps.can(P.Import);
  const canExport = caps.has(P.Export);
  const canAdd = canManageDepartments || canManagePositions || canManageLocations;

  const [tab, setTab] = useState<OrgTab>('chart');
  const [mode, setMode] = useState<OrgChartMode>('departments');
  const [selection, setSelection] = useState<OrgSelection | null>(null);
  const [deptFocusId, setDeptFocusId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState<HrToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  // Modals
  const [deptModal, setDeptModal] = useState<{ open: boolean; department: DepartmentListItem | null }>({ open: false, department: null });
  const [positionModal, setPositionModal] = useState<{ open: boolean; position: OrgPosition | null; departmentId?: string }>({
    open: false,
    position: null,
  });
  const [locationModal, setLocationModal] = useState<{ open: boolean; location: OrgLocation | null }>({ open: false, location: null });
  const [managerTarget, setManagerTarget] = useState<{ id: string; name: string } | null>(null);
  const [assignTarget, setAssignTarget] = useState<OrgPosition | null>(null);
  const [archiveDept, setArchiveDept] = useState<DepartmentNode | null>(null);
  const [archivePosition, setArchivePosition] = useState<OrgPosition | null>(null);
  const [unassignTarget, setUnassignTarget] = useState<{ position: OrgPosition; occupant: OrgPersonRef } | null>(null);
  const [mutating, setMutating] = useState(false);

  // Add menu
  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!addOpen) return;
    const onDown = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) setAddOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAddOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [addOpen]);

  /* ---------------------------- Data ---------------------------- */
  const summary = useOrgResource(() => organizationApi.summary(), active, reloadKey, t('coreHr.organization.kpi.loadError'));
  const deptChart = useOrgResource(
    () => organizationApi.departmentChart(),
    active && tab === 'chart' && mode === 'departments',
    reloadKey,
    t('coreHr.organization.chart.loadError'),
  );
  const peopleChart = useOrgResource(
    () => organizationApi.peopleChart({ maxDepth: 6 }),
    active && canViewPeople && tab === 'chart' && mode === 'people',
    reloadKey,
    t('coreHr.organization.chart.loadError'),
  );
  const positionChart = useOrgResource(
    () => organizationApi.positionChart(),
    active && tab === 'chart' && mode === 'positions',
    reloadKey,
    t('coreHr.organization.chart.loadError'),
  );
  const departments = useOrgResource(
    () => organizationApi.listDepartments(),
    active,
    reloadKey,
    t('coreHr.organization.departments.loadError'),
  );
  const levels = useOrgResource(
    () => organizationApi.listLevels(),
    active && (tab === 'settings' || tab === 'positions' || positionModal.open),
    reloadKey,
    t('coreHr.organization.settings.loadError'),
  );
  const locations = useOrgResource(
    () => organizationApi.listLocations(),
    active && tab === 'locations',
    reloadKey,
    t('coreHr.organization.locations.loadError'),
  );
  const reporting = useOrgResource(
    () => organizationApi.reportingOverview(),
    active && tab === 'reporting',
    reloadKey,
    t('coreHr.organization.reporting.loadError'),
  );

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const departmentList = useMemo(() => departments.data ?? [], [departments.data]);
  const levelList = useMemo(() => levels.data ?? [], [levels.data]);

  /* ------------------------- Selection -------------------------- */
  const handleCanvasSelect = useCallback((sel: OrgSelection | null) => {
    setSelection(sel);
    setDeptFocusId(sel?.kind === 'department' ? sel.id : null);
  }, []);

  const changeMode = (next: OrgChartMode) => {
    setMode(next);
    setSelection(null);
    setDeptFocusId(null);
  };

  const focusDepartment = (dept: DepartmentListItem) => {
    setTab('chart');
    setMode('departments');
    setSelection({ kind: 'department', id: dept.id });
    setDeptFocusId(dept.id);
  };

  const openPositionInChart = (position: OrgPosition) => {
    setTab('chart');
    setMode('positions');
    setSelection({ kind: 'position', id: position.id });
    setDeptFocusId(null);
  };

  const focusedDeptName = useMemo(() => {
    if (!deptFocusId) return '';
    const fromChart = deptChart.data ? findDeptNode(deptChart.data.departments, deptFocusId) : null;
    return fromChart?.name ?? departmentList.find((d) => d.id === deptFocusId)?.name ?? '';
  }, [deptFocusId, deptChart.data, departmentList]);

  /* --------------------------- Actions -------------------------- */
  const openEditDepartment = async (id: string) => {
    const known = departmentList.find((d) => d.id === id);
    if (known) {
      setDeptModal({ open: true, department: known });
      return;
    }
    try {
      const detail = await organizationApi.getDepartment(id);
      setDeptModal({ open: true, department: { ...detail, members: detail.members ?? [] } });
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.organization.departments.loadError')) });
    }
  };

  const afterSave = (text: string) => {
    setToast({ tone: 'success', text });
    refresh();
  };

  const confirmArchiveDept = async () => {
    if (!archiveDept) return;
    setMutating(true);
    try {
      await organizationApi.archiveDepartment(archiveDept.id);
      setToast({ tone: 'success', text: t('coreHr.organization.archive.departmentSuccess', { name: archiveDept.name }) });
      if (selection?.kind === 'department' && selection.id === archiveDept.id) handleCanvasSelect(null);
      setArchiveDept(null);
      refresh();
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.organization.archive.departmentError')) });
    } finally {
      setMutating(false);
    }
  };

  const confirmArchivePosition = async () => {
    if (!archivePosition) return;
    setMutating(true);
    try {
      await organizationApi.archivePosition(archivePosition.id);
      setToast({ tone: 'success', text: t('coreHr.organization.archive.positionSuccess', { name: archivePosition.title }) });
      if (selection?.kind === 'position' && selection.id === archivePosition.id) setSelection(null);
      setArchivePosition(null);
      refresh();
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.organization.archive.positionError')) });
    } finally {
      setMutating(false);
    }
  };

  const confirmUnassign = async () => {
    if (!unassignTarget) return;
    setMutating(true);
    try {
      await organizationApi.unassignPosition(unassignTarget.position.id, { employeeId: unassignTarget.occupant.id });
      setToast({ tone: 'success', text: t('coreHr.organization.unassign.success', { name: unassignTarget.occupant.name }) });
      setUnassignTarget(null);
      refresh();
    } catch (err) {
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.organization.unassign.error')) });
    } finally {
      setMutating(false);
    }
  };

  const exportDepartments = () => {
    const list = departmentList;
    if (list.length === 0) {
      setToast({ tone: 'warning', text: t('coreHr.organization.actions.exportEmpty') });
      return;
    }
    const header = [
      t('coreHr.organization.export.name'),
      t('coreHr.organization.export.code'),
      t('coreHr.organization.export.parent'),
      t('coreHr.organization.export.head'),
      t('coreHr.organization.export.employees'),
      t('coreHr.organization.export.positions'),
      t('coreHr.organization.export.openPositions'),
    ];
    const rows = list.map((d) => [
      d.name,
      d.code,
      d.parentDepartmentName,
      d.headName,
      d.employeeCount,
      d.positionCount,
      d.openPositionCount,
    ]);
    // BOM so Excel detects UTF-8.
    downloadBlob(new Blob(['\uFEFF', toCsv([header, ...rows])], { type: 'text/csv;charset=utf-8' }), 'departments.csv');
    setToast({ tone: 'success', text: t('coreHr.organization.actions.exportSuccess') });
  };

  /* ---------------------------- Render -------------------------- */
  const breadcrumbs = [
    { label: t('modules.coreHr'), to: '/app/hr/dashboard' },
    { label: t('coreHr.organization.title') },
  ];
  const title = t('coreHr.organization.title');
  const subtitle = t('coreHr.organization.subtitle');

  if (!caps.ready) {
    return (
      <CoreHrPageShell title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} wide>
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" aria-busy />
      </CoreHrPageShell>
    );
  }
  if (caps.denied) {
    return (
      <CoreHrPageShell title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} wide>
        <CoreHrEmptyState title={t('coreHr.organization.forbiddenTitle')} description={t('coreHr.organization.forbiddenDescription')} />
      </CoreHrPageShell>
    );
  }

  const menuItem =
    'block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none';
  const headerBtn =
    'border-2 border-gray-300 text-dark-text hover:bg-gray-50 focus:ring-gray-300 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 px-4 py-2 text-sm bg-white';

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {canImport ? (
        <button type="button" className={headerBtn} onClick={() => setToast({ tone: 'warning', text: t('coreHr.organization.actions.importSoon') })}>
          {t('coreHr.organization.actions.import')}
        </button>
      ) : null}
      {canExport ? (
        <button type="button" className={headerBtn} onClick={exportDepartments}>
          {t('coreHr.organization.actions.export')}
        </button>
      ) : null}
      {canAdd ? (
        <div className="relative" ref={addRef}>
          <Button size="sm" aria-haspopup="menu" aria-expanded={addOpen} onClick={() => setAddOpen((v) => !v)}>
            + {t('coreHr.organization.actions.add')}
          </Button>
          {addOpen ? (
            <div role="menu" className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {canManageDepartments ? (
                <button
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    setAddOpen(false);
                    setDeptModal({ open: true, department: null });
                  }}
                >
                  {t('coreHr.organization.actions.addDepartment')}
                </button>
              ) : null}
              {canManagePositions ? (
                <button
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    setAddOpen(false);
                    setPositionModal({ open: true, position: null, departmentId: deptFocusId ?? undefined });
                  }}
                >
                  {t('coreHr.organization.actions.addPosition')}
                </button>
              ) : null}
              {canManageLocations ? (
                <button
                  type="button"
                  role="menuitem"
                  className={menuItem}
                  onClick={() => {
                    setAddOpen(false);
                    setLocationModal({ open: true, location: null });
                  }}
                >
                  {t('coreHr.organization.actions.addLocation')}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const modeBtn = (m: OrgChartMode) => {
    const on = mode === m;
    const disabled = m === 'people' && !canViewPeople;
    return (
      <button
        key={m}
        type="button"
        role="radio"
        aria-checked={on}
        disabled={disabled}
        title={disabled ? t('coreHr.organization.chart.peopleDenied') : undefined}
        onClick={() => changeMode(m)}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50 ${
          on ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-600 hover:text-dark-text'
        }`}
      >
        {t(`coreHr.organization.chart.modes.${m}`)}
      </button>
    );
  };

  const chartResource = mode === 'departments' ? deptChart : mode === 'people' ? peopleChart : positionChart;
  const chartEmpty =
    mode === 'departments' ? (
      <div className="text-center">
        <h3 className="text-base font-semibold text-dark-text">{t('coreHr.organization.chart.emptyDepartmentsTitle')}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">{t('coreHr.organization.chart.emptyDepartmentsDescription')}</p>
        {canManageDepartments ? (
          <div className="mt-4">
            <Button size="sm" onClick={() => setDeptModal({ open: true, department: null })}>
              + {t('coreHr.organization.actions.addDepartment')}
            </Button>
          </div>
        ) : null}
      </div>
    ) : mode === 'people' ? (
      <div className="text-center">
        <h3 className="text-base font-semibold text-dark-text">
          {canViewPeople ? t('coreHr.organization.chart.emptyPeopleTitle') : t('coreHr.organization.chart.peopleDeniedTitle')}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
          {canViewPeople ? t('coreHr.organization.chart.emptyPeopleDescription') : t('coreHr.organization.chart.peopleDenied')}
        </p>
      </div>
    ) : (
      <div className="text-center">
        <h3 className="text-base font-semibold text-dark-text">{t('coreHr.organization.chart.emptyPositionsTitle')}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">{t('coreHr.organization.chart.emptyPositionsDescription')}</p>
        {canManagePositions ? (
          <div className="mt-4">
            <Button size="sm" onClick={() => setPositionModal({ open: true, position: null })}>
              + {t('coreHr.organization.actions.addPosition')}
            </Button>
          </div>
        ) : null}
      </div>
    );

  return (
    <CoreHrPageShell title={title} subtitle={subtitle} breadcrumbs={breadcrumbs} actions={actions} wide>
      <div className="space-y-5">
        <OrgKpiStrip summary={summary.data} loading={summary.loading} error={!!summary.error} />

        <OrgWorkspaceTabs value={tab} onChange={setTab} />

        {tab === 'chart' ? (
          <div role="tabpanel" id="org-panel-chart" aria-labelledby="org-tab-chart" className="space-y-4">
            <div role="radiogroup" aria-label={t('coreHr.organization.chart.modeLabel')} className="inline-flex rounded-lg bg-gray-100 p-1">
              {ORG_CHART_MODES.map(modeBtn)}
            </div>

            <OrgChartCanvas
              mode={mode}
              departmentChart={deptChart.data}
              peopleChart={canViewPeople ? peopleChart.data : null}
              positionChart={positionChart.data}
              selection={selection}
              onSelect={handleCanvasSelect}
              loading={chartResource.loading}
              error={mode === 'people' && !canViewPeople ? null : chartResource.error}
              onRetry={chartResource.reload}
              empty={chartEmpty}
              inspector={
                <OrgInspector
                  selection={selection}
                  departmentChart={deptChart.data}
                  peopleChart={peopleChart.data}
                  reloadKey={reloadKey}
                  permissions={{
                    manageDepartments: canManageDepartments,
                    managePositions: canManagePositions,
                    manageReporting: canManageReporting,
                    assignEmployees: canAssign,
                    viewPeople: canViewPeople,
                  }}
                  onClose={() => handleCanvasSelect(null)}
                  onEditDepartment={(id) => void openEditDepartment(id)}
                  onArchiveDepartment={setArchiveDept}
                  onAddPosition={(departmentId) => setPositionModal({ open: true, position: null, departmentId })}
                  onEditPosition={(position) => setPositionModal({ open: true, position })}
                  onArchivePosition={setArchivePosition}
                  onAssignPosition={setAssignTarget}
                  onUnassignPosition={(position, occupant) => setUnassignTarget({ position, occupant })}
                  onChangeManager={setManagerTarget}
                />
              }
            />

            {mode === 'departments' && deptFocusId ? (
              <OrgPositionsPanel
                departmentId={deptFocusId}
                departmentName={focusedDeptName}
                reloadKey={reloadKey}
                activeId={selection?.kind === 'position' ? selection.id : null}
                canManage={canManagePositions}
                onOpen={(p) => setSelection({ kind: 'position', id: p.id })}
                onAdd={(departmentId) => setPositionModal({ open: true, position: null, departmentId })}
              />
            ) : null}
          </div>
        ) : null}

        {tab === 'departments' ? (
          <div role="tabpanel" id="org-panel-departments" aria-labelledby="org-tab-departments">
            <OrgDepartmentsGrid
              departments={departmentList}
              loading={departments.loading}
              error={departments.error}
              onRetry={departments.reload}
              canManage={canManageDepartments}
              activeId={deptFocusId}
              onSelect={focusDepartment}
              onAdd={() => setDeptModal({ open: true, department: null })}
            />
          </div>
        ) : null}

        {tab === 'positions' ? (
          <div role="tabpanel" id="org-panel-positions" aria-labelledby="org-tab-positions">
            <OrgPositionsPanel
              departments={departmentList}
              levels={levelList}
              reloadKey={reloadKey}
              canManage={canManagePositions}
              onOpen={openPositionInChart}
              onAdd={(departmentId) => setPositionModal({ open: true, position: null, departmentId })}
            />
          </div>
        ) : null}

        {tab === 'reporting' ? (
          <div role="tabpanel" id="org-panel-reporting" aria-labelledby="org-tab-reporting">
            <OrgReportingPanel
              overview={reporting.data}
              loading={reporting.loading}
              error={reporting.error}
              onRetry={reporting.reload}
              canManage={canManageReporting}
              onChangeManager={setManagerTarget}
            />
          </div>
        ) : null}

        {tab === 'locations' ? (
          <div role="tabpanel" id="org-panel-locations" aria-labelledby="org-tab-locations" className="space-y-4">
            {canManageLocations && (locations.data?.length ?? 0) > 0 ? (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setLocationModal({ open: true, location: null })}>
                  + {t('coreHr.organization.actions.addLocation')}
                </Button>
              </div>
            ) : null}
            <OrgLocationsGrid
              locations={locations.data ?? []}
              loading={locations.loading}
              error={locations.error}
              onRetry={locations.reload}
              canManage={canManageLocations}
              onAdd={() => setLocationModal({ open: true, location: null })}
              onEdit={(location) => setLocationModal({ open: true, location })}
            />
          </div>
        ) : null}

        {tab === 'settings' ? (
          <div role="tabpanel" id="org-panel-settings" aria-labelledby="org-tab-settings">
            <OrgSettingsPanel levels={levelList} loading={levels.loading} error={levels.error} onRetry={levels.reload} />
          </div>
        ) : null}

        {lookups.error ? <ErrorMessage message={t('coreHr.organization.modals.lookupsError')} /> : null}
      </div>

      <OrgAddDepartmentModal
        isOpen={deptModal.open}
        onClose={() => setDeptModal((s) => ({ ...s, open: false }))}
        department={deptModal.department}
        departments={departmentList}
        locations={lookups.locations}
        onSaved={(name, kind) => {
          setDeptModal((s) => ({ ...s, open: false }));
          afterSave(t(`coreHr.organization.modals.department.${kind}`, { name }));
        }}
      />

      <OrgAddPositionModal
        isOpen={positionModal.open}
        onClose={() => setPositionModal((s) => ({ ...s, open: false }))}
        position={positionModal.position}
        defaultDepartmentId={positionModal.departmentId}
        levels={levelList}
        onSaved={(name, kind) => {
          setPositionModal((s) => ({ ...s, open: false }));
          afterSave(t(`coreHr.organization.modals.position.${kind}`, { name }));
        }}
      />

      <OrgLocationModal
        isOpen={locationModal.open}
        onClose={() => setLocationModal((s) => ({ ...s, open: false }))}
        location={locationModal.location}
        onSaved={(name, kind) => {
          setLocationModal((s) => ({ ...s, open: false }));
          void lookups.reload();
          afterSave(t(`coreHr.organization.modals.location.${kind}`, { name }));
        }}
      />

      <OrgChangeManagerModal
        isOpen={!!managerTarget}
        onClose={() => setManagerTarget(null)}
        employee={managerTarget}
        onSaved={(name) => {
          setManagerTarget(null);
          afterSave(t('coreHr.organization.modals.changeManager.success', { name }));
        }}
      />

      <OrgAssignPositionModal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        position={assignTarget}
        onSaved={(positionTitle) => {
          setAssignTarget(null);
          afterSave(t('coreHr.organization.modals.assign.success', { position: positionTitle }));
        }}
      />

      <ConfirmModal
        isOpen={!!archiveDept}
        onClose={() => setArchiveDept(null)}
        onConfirm={() => void confirmArchiveDept()}
        tone="danger"
        busy={mutating}
        title={t('coreHr.organization.archive.departmentTitle')}
        description={t('coreHr.organization.archive.departmentDescription', { name: archiveDept?.name ?? '' })}
        confirmLabel={t('coreHr.organization.archive.confirm')}
      />

      <ConfirmModal
        isOpen={!!archivePosition}
        onClose={() => setArchivePosition(null)}
        onConfirm={() => void confirmArchivePosition()}
        tone="danger"
        busy={mutating}
        title={t('coreHr.organization.archive.positionTitle')}
        description={t('coreHr.organization.archive.positionDescription', { name: archivePosition?.title ?? '' })}
        confirmLabel={t('coreHr.organization.archive.confirm')}
      />

      <ConfirmModal
        isOpen={!!unassignTarget}
        onClose={() => setUnassignTarget(null)}
        onConfirm={() => void confirmUnassign()}
        tone="danger"
        busy={mutating}
        title={t('coreHr.organization.unassign.title')}
        description={t('coreHr.organization.unassign.description', {
          name: unassignTarget?.occupant.name ?? '',
          position: unassignTarget?.position.title ?? '',
        })}
        confirmLabel={t('coreHr.organization.unassign.confirm')}
      />

      <HrToast toast={toast} onDismiss={dismissToast} />
    </CoreHrPageShell>
  );
}

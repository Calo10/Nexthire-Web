import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Background,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTranslation } from 'react-i18next';
import type {
  DepartmentChart,
  DepartmentNode,
  OrgChartMode,
  OrgSelection,
  PeopleChart,
  PeopleChartNode,
  PositionChart,
  PositionChartNode,
} from '../../models/organization';
import OrgCompanyNode from './OrgCompanyNode';
import OrgDeptNode from './OrgDeptNode';
import OrgPersonNode from './OrgPersonNode';
import OrgPositionNode from './OrgPositionNode';
import { layoutOrgTree, type LayoutTreeNode } from './layoutOrgTree';

const nodeTypes: NodeTypes = {
  company: OrgCompanyNode,
  department: OrgDeptNode,
  person: OrgPersonNode,
  position: OrgPositionNode,
};

const SIZES: Record<OrgChartMode, { w: number; h: number }> = {
  departments: { w: 240, h: 112 },
  people: { w: 224, h: 64 },
  positions: { w: 224, h: 88 },
};
const COMPANY_SIZE = { w: 260, h: 64 };
const COMPANY_ID = 'company';

type Props = {
  mode: OrgChartMode;
  departmentChart: DepartmentChart | null;
  peopleChart: PeopleChart | null;
  positionChart: PositionChart | null;
  selection: OrgSelection | null;
  onSelect: (selection: OrgSelection | null) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** Rendered when the active mode has no data. */
  empty?: ReactNode;
  /** Right-hand inspector; stays visible in fullscreen. */
  inspector?: ReactNode;
};

function nodeKey(sel: OrgSelection | null): string | null {
  if (!sel) return null;
  return sel.kind === 'company' ? COMPANY_ID : `${sel.kind}:${sel.id}`;
}

function toLayout(
  mode: OrgChartMode,
  deptChart: DepartmentChart | null,
  people: PeopleChart | null,
  positions: PositionChart | null,
): LayoutTreeNode[] {
  if (mode === 'departments') {
    if (!deptChart) return [];
    const map = (d: DepartmentNode): LayoutTreeNode => ({ id: `department:${d.id}`, children: d.children.map(map) });
    return [{ id: COMPANY_ID, children: deptChart.departments.map(map) }];
  }
  if (mode === 'people') {
    const map = (p: PeopleChartNode): LayoutTreeNode => ({ id: `person:${p.employeeId}`, children: p.children.map(map) });
    return (people?.roots ?? []).map(map);
  }
  const map = (p: PositionChartNode): LayoutTreeNode => ({ id: `position:${p.id}`, children: p.children.map(map) });
  return (positions?.roots ?? []).map(map);
}

function CanvasInner({
  mode,
  departmentChart,
  peopleChart,
  positionChart,
  selection,
  onSelect,
  loading,
  error,
  onRetry,
  empty,
  inspector,
}: Props) {
  const { t } = useTranslation();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setCollapsed(new Set());
  }, [mode]);

  const onToggle = useCallback(
    (rawId: string) => {
      // Node components pass the raw entity id; the collapsed set stores layout ids (`<kind>:<id>`).
      const key = `${mode === 'departments' ? 'department' : mode === 'people' ? 'person' : 'position'}:${rawId}`;
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    },
    [mode],
  );

  const selectedKey = nodeKey(selection);

  const { nodes, edges, signature } = useMemo(() => {
    const size = SIZES[mode];
    const roots = toLayout(mode, departmentChart, peopleChart, positionChart);
    const layout = layoutOrgTree(roots, {
      nodeWidth: Math.max(size.w, COMPANY_SIZE.w),
      nodeHeight: size.h,
      gapX: 32,
      gapY: 64,
      collapsed,
    });

    const out: Node[] = [];
    const place = (id: string) => {
      const p = layout.positions.get(id);
      return p ? { x: p.x, y: p.y } : null;
    };

    if (mode === 'departments' && departmentChart) {
      const pos = place(COMPANY_ID);
      if (pos) {
        out.push({
          id: COMPANY_ID,
          type: 'company',
          position: pos,
          draggable: false,
          data: {
            name: departmentChart.root.name,
            totalEmployees: departmentChart.root.totalEmployees,
            totalDepartments: departmentChart.root.totalDepartments,
            selected: selectedKey === COMPANY_ID,
          },
        });
      }
      const walk = (d: DepartmentNode) => {
        const id = `department:${d.id}`;
        const p = place(id);
        if (!p) return;
        out.push({
          id,
          type: 'department',
          position: p,
          draggable: false,
          data: { dept: d, selected: selectedKey === id, collapsed: collapsed.has(id), onToggle },
        });
        d.children.forEach(walk);
      };
      departmentChart.departments.forEach(walk);
    } else if (mode === 'people' && peopleChart) {
      const walk = (n: PeopleChartNode) => {
        const id = `person:${n.employeeId}`;
        const p = place(id);
        if (!p) return;
        out.push({
          id,
          type: 'person',
          position: p,
          draggable: false,
          data: { person: n, selected: selectedKey === id, collapsed: collapsed.has(id), onToggle },
        });
        n.children.forEach(walk);
      };
      peopleChart.roots.forEach(walk);
    } else if (mode === 'positions' && positionChart) {
      const walk = (n: PositionChartNode) => {
        const id = `position:${n.id}`;
        const p = place(id);
        if (!p) return;
        out.push({
          id,
          type: 'position',
          position: p,
          draggable: false,
          data: { position: n, selected: selectedKey === id, collapsed: collapsed.has(id), onToggle },
        });
        n.children.forEach(walk);
      };
      positionChart.roots.forEach(walk);
    }

    const visible = new Set(out.map((n) => n.id));
    const flowEdges: Edge[] = layout.edges
      .filter((e) => visible.has(e.source) && visible.has(e.target))
      .map((e) => ({
        id: `${e.source}->${e.target}`,
        source: e.source,
        target: e.target,
        type: 'smoothstep',
        style: { stroke: '#cbd5e1', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12, color: '#cbd5e1' },
      }));

    return { nodes: out, edges: flowEdges, signature: `${mode}|${out.map((n) => n.id).join(',')}` };
  }, [mode, departmentChart, peopleChart, positionChart, collapsed, selectedKey, onToggle]);

  // Re-fit only when the set of visible nodes changes (not on selection).
  useEffect(() => {
    if (nodes.length === 0) return;
    const id = window.requestAnimationFrame(() => void fitView({ padding: 0.15, duration: 200, maxZoom: 1 }));
    return () => window.cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, fitView]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  useEffect(() => {
    const id = window.setTimeout(() => void fitView({ padding: 0.15, duration: 200, maxZoom: 1 }), 60);
    return () => window.clearTimeout(id);
  }, [fullscreen, fitView]);

  const handleNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const [kind, ...rest] = node.id.split(':');
      const id = rest.join(':');
      if (node.id === COMPANY_ID) onSelect({ kind: 'company' });
      else if (kind === 'department') onSelect({ kind: 'department', id });
      else if (kind === 'person') onSelect({ kind: 'person', id });
      else if (kind === 'position') onSelect({ kind: 'position', id });
    },
    [onSelect],
  );

  const hasNodes = nodes.length > 0;

  const ctrlBtn =
    'flex h-9 w-9 items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset';

  return (
    <div
      className={
        fullscreen
          ? 'fixed inset-0 z-[45] flex bg-[#F7F8FC]'
          : 'flex h-[560px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'
      }
    >
      <div className="relative min-w-0 flex-1 bg-[#F4F7FB]">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="max-w-md text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-dark-text hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {t('coreHr.organization.retry')}
            </button>
          </div>
        ) : loading && !hasNodes ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" role="status" aria-label={t('common.loading')} />
          </div>
        ) : !hasNodes ? (
          <div className="flex h-full items-center justify-center p-6">{empty}</div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            fitView
            fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
            minZoom={0.15}
            maxZoom={1.6}
            onNodeClick={handleNodeClick}
            onPaneClick={() => onSelect(null)}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={18} size={1} color="#D7DEE8" />
            <Panel position="top-left" className="!m-3">
              <div
                role="toolbar"
                aria-label={t('coreHr.organization.chart.controls')}
                className="flex flex-col divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <button type="button" className={ctrlBtn} onClick={() => void zoomIn({ duration: 150 })} aria-label={t('coreHr.organization.chart.zoomIn')} title={t('coreHr.organization.chart.zoomIn')}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button type="button" className={ctrlBtn} onClick={() => void zoomOut({ duration: 150 })} aria-label={t('coreHr.organization.chart.zoomOut')} title={t('coreHr.organization.chart.zoomOut')}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <button type="button" className={ctrlBtn} onClick={() => void fitView({ padding: 0.15, duration: 200, maxZoom: 1 })} aria-label={t('coreHr.organization.chart.fit')} title={t('coreHr.organization.chart.fit')}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4h4M20 8V4h-4M4 16v4h4m12-4v4h-4" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={ctrlBtn}
                  onClick={() => setFullscreen((v) => !v)}
                  aria-pressed={fullscreen}
                  aria-label={fullscreen ? t('coreHr.organization.chart.exitFullscreen') : t('coreHr.organization.chart.fullscreen')}
                  title={fullscreen ? t('coreHr.organization.chart.exitFullscreen') : t('coreHr.organization.chart.fullscreen')}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    {fullscreen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4m0 5H4m11-5v5h5M9 15v5m0-5H4m11 0h5m-5 0v5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    )}
                  </svg>
                </button>
              </div>
            </Panel>
          </ReactFlow>
        )}
        {loading && hasNodes ? (
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs text-gray-500 shadow-sm">
            {t('common.loading')}
          </div>
        ) : null}
      </div>
      {inspector}
    </div>
  );
}

export default function OrgChartCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

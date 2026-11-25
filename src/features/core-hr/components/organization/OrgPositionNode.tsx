import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import type { PositionChartNode } from '../../models/organization';
import { OCCUPANCY_CLASSES, occupancyTone } from '../../utils/organizationFormat';

export type OrgPositionNodeData = {
  position: PositionChartNode;
  selected: boolean;
  collapsed: boolean;
  onToggle: (id: string) => void;
  [key: string]: unknown;
};
export type OrgPositionFlowNode = Node<OrgPositionNodeData, 'position'>;

export default function OrgPositionNode({ data }: NodeProps<OrgPositionFlowNode>) {
  const { t } = useTranslation();
  const { position, selected, collapsed, onToggle } = data;
  const hasChildren = position.children.length > 0;
  const tone = occupancyTone(position.filledCount, position.headcount);
  return (
    <div
      className={`relative w-[224px] cursor-pointer rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-shadow ${
        selected ? 'border-teal-500 ring-2 ring-teal-500/40' : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-gray-300" isConnectable={false} />
      <p className="truncate text-sm font-semibold text-dark-text" title={position.title}>
        {position.title}
      </p>
      <p className="truncate text-xs text-gray-500">
        {[position.departmentName, position.levelName].filter(Boolean).join(' · ') || t('common.none')}
      </p>
      <div className="mt-2">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${OCCUPANCY_CLASSES[tone]}`}>
          {t('coreHr.organization.positions.occupancy', { filled: position.filledCount, total: position.headcount })}
        </span>
      </div>
      {hasChildren ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(position.id);
          }}
          aria-label={collapsed ? t('coreHr.organization.chart.expand') : t('coreHr.organization.chart.collapse')}
          aria-expanded={!collapsed}
          className="nodrag nopan absolute -bottom-3 left-1/2 z-10 flex h-6 min-w-[1.5rem] -translate-x-1/2 items-center justify-center rounded-full border border-gray-300 bg-white px-1.5 text-[11px] font-medium text-gray-600 shadow-sm hover:border-teal-500 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {collapsed ? `+${position.children.length}` : '−'}
        </button>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-gray-300" isConnectable={false} />
    </div>
  );
}

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import EmployeeAvatar from '../EmployeeAvatar';
import type { DepartmentNode } from '../../models/organization';
import { safeColor, tintColor } from '../../utils/organizationFormat';
import OrgDeptIcon from './OrgDeptIcon';

export type OrgDeptNodeData = {
  dept: DepartmentNode;
  selected: boolean;
  collapsed: boolean;
  onToggle: (id: string) => void;
  [key: string]: unknown;
};
export type OrgDeptFlowNode = Node<OrgDeptNodeData, 'department'>;

const MAX_AVATARS = 4;

export default function OrgDeptNode({ data }: NodeProps<OrgDeptFlowNode>) {
  const { t } = useTranslation();
  const { dept, selected, collapsed, onToggle } = data;
  const color = safeColor(dept.color);
  const hasChildren = dept.children.length > 0;
  const shown = dept.members.slice(0, MAX_AVATARS);
  const extra = Math.max(0, dept.employeeCount - shown.length);

  return (
    <div
      className={`relative w-[240px] cursor-pointer rounded-xl border bg-white shadow-sm transition-shadow ${
        selected ? 'border-teal-500 ring-2 ring-teal-500/40' : 'border-gray-200 hover:shadow-md'
      } ${dept.isActive ? '' : 'opacity-60'}`}
    >
      <span className="absolute inset-y-0 left-0 w-1 rounded-l-xl" style={{ backgroundColor: color }} aria-hidden />
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-gray-300" isConnectable={false} />
      <div className="px-4 py-3 pl-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: tintColor(color), color }}
          >
            <OrgDeptIcon name={dept.icon} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-dark-text" title={dept.name}>
              {dept.name}
            </p>
            <p className="truncate text-xs text-gray-500">
              {dept.headName ?? t('coreHr.organization.chart.noHead')}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {shown.map((m) => (
                <EmployeeAvatar key={m.id || m.name} name={m.name} seed={m.id} url={m.photoUrl} size="xs" className="ring-2 ring-white" />
              ))}
            </div>
            {extra > 0 && shown.length > 0 ? <span className="ml-1.5 text-[11px] text-gray-500">+{extra}</span> : null}
          </div>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {t('coreHr.organization.chart.headcount', { count: dept.employeeCount })}
          </span>
        </div>
      </div>
      {hasChildren ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(dept.id);
          }}
          aria-label={collapsed ? t('coreHr.organization.chart.expand') : t('coreHr.organization.chart.collapse')}
          aria-expanded={!collapsed}
          className="nodrag nopan absolute -bottom-3 left-1/2 z-10 flex h-6 min-w-[1.5rem] -translate-x-1/2 items-center justify-center gap-0.5 rounded-full border border-gray-300 bg-white px-1.5 text-[11px] font-medium text-gray-600 shadow-sm hover:border-teal-500 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {collapsed ? `+${dept.children.length}` : '−'}
        </button>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-gray-300" isConnectable={false} />
    </div>
  );
}

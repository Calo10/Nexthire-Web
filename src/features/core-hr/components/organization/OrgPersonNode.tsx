import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useTranslation } from 'react-i18next';
import EmployeeAvatar from '../EmployeeAvatar';
import type { PeopleChartNode } from '../../models/organization';

export type OrgPersonNodeData = {
  person: PeopleChartNode;
  selected: boolean;
  collapsed: boolean;
  onToggle: (id: string) => void;
  [key: string]: unknown;
};
export type OrgPersonFlowNode = Node<OrgPersonNodeData, 'person'>;

export default function OrgPersonNode({ data }: NodeProps<OrgPersonFlowNode>) {
  const { t } = useTranslation();
  const { person, selected, collapsed, onToggle } = data;
  const hasChildren = person.children.length > 0;
  return (
    <div
      className={`relative w-[224px] cursor-pointer rounded-xl border bg-white px-3 py-2.5 shadow-sm transition-shadow ${
        selected ? 'border-teal-500 ring-2 ring-teal-500/40' : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-gray-300" isConnectable={false} />
      <div className="flex items-center gap-3">
        <EmployeeAvatar name={person.name} seed={person.employeeId} url={person.photoUrl} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-dark-text" title={person.name}>
            {person.name}
          </p>
          <p className="truncate text-xs text-gray-500" title={person.jobTitle ?? undefined}>
            {person.jobTitle || t('common.none')}
          </p>
        </div>
        {person.directReports > 0 ? (
          <span
            className="shrink-0 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700"
            title={t('coreHr.organization.chart.reports', { count: person.directReports })}
          >
            {person.directReports}
          </span>
        ) : null}
      </div>
      {hasChildren ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(person.employeeId);
          }}
          aria-label={collapsed ? t('coreHr.organization.chart.expand') : t('coreHr.organization.chart.collapse')}
          aria-expanded={!collapsed}
          className="nodrag nopan absolute -bottom-3 left-1/2 z-10 flex h-6 min-w-[1.5rem] -translate-x-1/2 items-center justify-center rounded-full border border-gray-300 bg-white px-1.5 text-[11px] font-medium text-gray-600 shadow-sm hover:border-teal-500 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {collapsed ? `+${person.children.length}` : '−'}
        </button>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-gray-300" isConnectable={false} />
    </div>
  );
}

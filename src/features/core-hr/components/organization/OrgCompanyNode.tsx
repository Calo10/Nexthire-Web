import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useTranslation } from 'react-i18next';

export type OrgCompanyNodeData = {
  name: string;
  totalEmployees: number;
  totalDepartments: number;
  selected: boolean;
  [key: string]: unknown;
};
export type OrgCompanyFlowNode = Node<OrgCompanyNodeData, 'company'>;

export default function OrgCompanyNode({ data }: NodeProps<OrgCompanyFlowNode>) {
  const { t } = useTranslation();
  return (
    <div
      className={`w-[260px] cursor-pointer rounded-xl border bg-teal-700 px-4 py-3 text-white shadow-md transition-shadow ${
        data.selected ? 'border-teal-300 ring-2 ring-teal-400' : 'border-teal-800 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{data.name || t('coreHr.organization.chart.company')}</p>
          <p className="text-xs text-teal-100">
            {t('coreHr.organization.chart.companyStats', {
              employees: data.totalEmployees,
              departments: data.totalDepartments,
            })}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-teal-300" isConnectable={false} />
    </div>
  );
}

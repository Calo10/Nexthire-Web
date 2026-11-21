import { memo } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { getActivityDescriptor } from '../models/activityCatalog';
import type { WorkflowStepNodeData } from '../mappers/workflowGraphMapper';
import ActivityIcon from './ActivityIcon';

type WorkflowStepFlowNode = Node<WorkflowStepNodeData, 'workflowStep'>;

function categoryTone(category?: string): string {
  switch (category) {
    case 'Communication':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Flow':
      return 'bg-slate-50 text-slate-700 border-slate-200';
    case 'Documents':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Meetings':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'AI':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'Conversation':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function WorkflowStepNodeComponent({ data, selected }: NodeProps<WorkflowStepFlowNode>) {
  const descriptor = getActivityDescriptor(data.activityType);
  const tone = categoryTone(descriptor?.category);
  const transitionKeys = data.transitionKeys?.length
    ? data.transitionKeys
    : data.isBranch
      ? ['true', 'false']
      : [];

  return (
    <div
      className={`min-w-[220px] max-w-[260px] rounded-xl border bg-white shadow-sm transition-shadow ${
        selected ? 'border-[#0077E6] shadow-md ring-2 ring-[#00AAFF]/30' : 'border-gray-200'
      } ${data.isStart ? 'ring-1 ring-emerald-300' : ''}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="!w-2.5 !h-2.5 !bg-gray-400 !border-2 !border-white"
      />

      <div className="px-3 pt-3 pb-2 flex items-start gap-2.5">
        <div className={`mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${tone}`}>
          <ActivityIcon icon={descriptor?.icon ?? 'spark'} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-medium text-gray-500 truncate">{data.activityName}</p>
            {data.isStart ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                Start
              </span>
            ) : null}
            {data.hasErrors ? (
              <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                {data.errorCount} issue{data.errorCount === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-dark-text truncate mt-0.5">{data.name || 'Untitled step'}</p>
          {data.isBranch && data.conditionSummary ? (
            <p
              className="text-[11px] font-mono text-gray-600 mt-1 truncate"
              title={data.conditionSummary}
            >
              {data.conditionSummary}
            </p>
          ) : null}
        </div>
      </div>

      {data.isBranch ? (
        <div className="px-3 pb-3 flex justify-between gap-2">
          {transitionKeys.map((key, index) => (
            <div key={key} className="relative flex-1 text-center">
              <span className="text-[10px] text-gray-500 font-medium">{key}</span>
              <Handle
                type="source"
                position={Position.Bottom}
                id={`transition:${key}`}
                className="!w-2.5 !h-2.5 !bg-[#0077E6] !border-2 !border-white"
                style={{ left: `${((index + 0.5) / transitionKeys.length) * 100}%` }}
              />
            </div>
          ))}
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          id="out"
          className="!w-2.5 !h-2.5 !bg-[#0077E6] !border-2 !border-white"
        />
      )}
    </div>
  );
}

export default memo(WorkflowStepNodeComponent);

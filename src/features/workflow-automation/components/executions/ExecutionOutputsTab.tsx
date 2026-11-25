import ActivityIcon from '../ActivityIcon';
import { formatDateTime } from '../../lib/executionFormat';
import { activityIconName, activityLabel } from '../../lib/executionDisplay';
import type { WorkflowExecutionStepItem } from '../../models/workflowExecution';
import { stepHasOutput } from '../../models/workflowExecution';
import ExecutionStatusBadge from './ExecutionStatusBadge';
import PropertyGrid from './PropertyGrid';

type Props = {
  steps: WorkflowExecutionStepItem[];
  stepNameById?: Record<string, string>;
};

export default function ExecutionOutputsTab({ steps, stepNameById = {} }: Props) {
  if (steps.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
        <p className="text-sm font-medium text-dark-text">No outputs yet</p>
        <p className="text-sm text-gray-500 mt-1">Step results will appear here after a step finishes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step) => {
        const name =
          stepNameById[step.stepDefinitionId] || activityLabel(step.activityType);
        const failed = step.status.toLowerCase() === 'failed';
        return (
          <section
            key={step.id}
            className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
              failed ? 'border-red-100' : 'border-gray-200'
            }`}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0077E6] flex items-center justify-center shrink-0">
                  <ActivityIcon icon={activityIconName(step.activityType)} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-dark-text">{name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {activityLabel(step.activityType)}
                    {step.attempt ? ` · Attempt ${step.attempt}` : ''}
                  </p>
                </div>
              </div>
              <ExecutionStatusBadge status={step.status} />
            </div>

            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Started
                  </p>
                  <p className="text-sm font-medium text-dark-text">{formatDateTime(step.startedAt)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Completed
                  </p>
                  <p className="text-sm font-medium text-dark-text">{formatDateTime(step.completedAt)}</p>
                </div>
                {step.errorMessage ? (
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                      Error
                    </p>
                    <p className="text-sm font-medium text-red-700">{step.errorMessage}</p>
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Output
                </p>
                {stepHasOutput(step) ? (
                  <PropertyGrid value={step.output} />
                ) : (
                  <p className="text-sm text-gray-400">No output for this attempt.</p>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

import { useState } from 'react';
import { formatDateTime } from '../../lib/executionFormat';
import {
  activityLabel,
  asRecord,
  historyTitle,
  historyTone,
} from '../../lib/executionDisplay';
import type { WorkflowExecutionHistoryItem } from '../../models/workflowExecution';
import PropertyGrid from './PropertyGrid';

type Props = {
  items: WorkflowExecutionHistoryItem[];
};

const toneClass: Record<ReturnType<typeof historyTone>, string> = {
  blue: 'bg-sky-50 text-[#0077E6] ring-sky-100',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  red: 'bg-red-50 text-red-600 ring-red-100',
  yellow: 'bg-amber-50 text-amber-600 ring-amber-100',
  purple: 'bg-violet-50 text-violet-600 ring-violet-100',
  gray: 'bg-gray-100 text-gray-500 ring-gray-200',
};

function TimelineIcon({ tone }: { tone: ReturnType<typeof historyTone> }) {
  const path =
    tone === 'red'
      ? 'M6 18L18 6M6 6l12 12'
      : tone === 'green'
        ? 'M4.5 12.75l6 6 9-13.5'
        : tone === 'yellow'
          ? 'M12 6v6l4 2'
          : tone === 'purple'
            ? 'M6 18L18 6M6 6l12 12'
            : 'M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z';

  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}

function HistoryDetails({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  const record = asRecord(data);
  const activityType = record && typeof record.activityType === 'string' ? record.activityType : null;
  const attempt = record && typeof record.attempt === 'number' ? record.attempt : null;

  return (
    <div className="mt-3">
      {(activityType || attempt != null) && (
        <p className="text-sm text-gray-500 mb-2">
          {[activityType ? activityLabel(activityType) : null, attempt != null ? `Attempt ${attempt}` : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-gray-500 hover:text-[#0077E6]"
      >
        {open ? 'Hide details' : 'Show details'}
      </button>
      {open ? (
        <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-4">
          <PropertyGrid value={data} />
        </div>
      ) : null}
    </div>
  );
}

export default function ExecutionTimeline({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
        <p className="text-sm font-medium text-dark-text">No history yet</p>
        <p className="text-sm text-gray-500 mt-1">Step events will show up here as the workflow runs.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-gray-200 ml-3.5">
      {items.map((item) => {
        const tone = historyTone(item.eventType);
        const failed = tone === 'red';
        return (
          <li key={item.id} className="relative pl-8 pb-6 last:pb-0">
            <span
              className={`absolute -left-3.5 top-3 w-7 h-7 rounded-full ring-1 flex items-center justify-center bg-white ${toneClass[tone]}`}
            >
              <TimelineIcon tone={tone} />
            </span>
            <div
              className={`rounded-xl border bg-white shadow-sm p-5 ${
                failed ? 'border-red-100' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-dark-text">
                    {historyTitle(item.eventType, item.message)}
                  </p>
                  <p className={`text-sm mt-1 ${failed ? 'text-red-700' : 'text-gray-600'}`}>
                    {item.message}
                  </p>
                </div>
                <p className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(item.occurredAt)}</p>
              </div>
              {item.data !== null && item.data !== undefined ? <HistoryDetails data={item.data} /> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

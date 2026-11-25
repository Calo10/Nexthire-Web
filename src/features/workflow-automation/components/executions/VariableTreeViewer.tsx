import { nestVariables } from '../../lib/executionFormat';
import {
  asRecord,
  humanizeLabel,
  initialsFromName,
} from '../../lib/executionDisplay';
import PropertyGrid, { PropertyField, SmartValue } from './PropertyGrid';

type Props = {
  variables: Record<string, unknown> | null | undefined;
};

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const match = Object.entries(record).find(([k]) => k.toLowerCase() === key.toLowerCase());
    if (match && typeof match[1] === 'string' && match[1].trim()) return match[1].trim();
  }
  return null;
}

function GroupHeader({ name, record }: { name: string; record: Record<string, unknown> }) {
  const displayName = pickString(record, ['Name', 'FullName', 'Title']);
  const title = pickString(record, ['Title', 'JobTitle']);
  const company = pickString(record, ['Company', 'CompanyName']);
  const isPerson = name.toLowerCase() === 'lead' || name.toLowerCase() === 'contact';
  const subtitleParts = [title && title !== displayName ? title : null, company].filter(Boolean);

  if (isPerson && displayName) {
    return (
      <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100">
        <div className="h-11 w-11 rounded-xl bg-slate-800 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {initialsFromName(displayName)}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-dark-text">{displayName}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {subtitleParts.length > 0 ? subtitleParts.join(' · ') : humanizeLabel(name)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h3 className="text-base font-semibold text-dark-text">{humanizeLabel(name)}</h3>
      <p className="text-sm text-gray-500 mt-0.5">
        {Object.keys(record).length} {Object.keys(record).length === 1 ? 'field' : 'fields'}
      </p>
    </div>
  );
}

function GroupCard({ name, value }: { name: string; value: unknown }) {
  const record = asRecord(value);

  if (!record) {
    return (
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <PropertyField label={humanizeLabel(name)}>
          <SmartValue name={name} value={value} />
        </PropertyField>
      </section>
    );
  }

  const personKeys = new Set(['name', 'fullname', 'title', 'jobtitle', 'company', 'companyname']);
  const isPerson = name.toLowerCase() === 'lead' || name.toLowerCase() === 'contact';
  const fields = isPerson
    ? Object.fromEntries(Object.entries(record).filter(([key]) => !personKeys.has(key.toLowerCase())))
    : record;

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <GroupHeader name={name} record={record} />
      <div className="p-5">
        <PropertyGrid value={isPerson ? fields : record} />
      </div>
    </section>
  );
}

export default function VariableTreeViewer({ variables }: Props) {
  const nested = nestVariables(variables);
  const entries = Object.entries(nested);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
        <p className="text-sm font-medium text-dark-text">No variables yet</p>
        <p className="text-sm text-gray-500 mt-1">This run has not stored any lead or step data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => (
        <GroupCard key={key} name={key} value={value} />
      ))}
    </div>
  );
}

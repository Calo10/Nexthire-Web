import type { ReactNode } from 'react';
import Badge, { entityStatusTone } from '../../../../components/ui/Badge';
import { formatPhone, phoneTelHref } from '../../../../lib/phone';
import {
  activityLabel,
  asRecord,
  humanizeLabel,
  isEmailKey,
  isGuid,
  isPhoneKey,
  isStatusKey,
  looksLikeEmail,
} from '../../lib/executionDisplay';
import CopyableValue from './CopyableValue';

type Props = {
  value: unknown;
  hideKeys?: string[];
};

export function PropertyField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <div className="text-sm font-medium text-dark-text break-words">{children}</div>
    </div>
  );
}

function formatLeaf(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value.trim() || '—';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function SmartValue({ name, value }: { name: string; value: unknown }) {
  if (value === null || value === undefined || value === '') {
    return <span className="font-normal text-gray-400">—</span>;
  }

  if (typeof value === 'boolean') {
    return <span>{value ? 'Yes' : 'No'}</span>;
  }

  if (typeof value === 'number') {
    return <span>{value}</span>;
  }

  if (typeof value !== 'string') {
    return <span className="font-normal text-gray-700">{formatLeaf(value)}</span>;
  }

  if (isStatusKey(name)) {
    return (
      <Badge tone={entityStatusTone(value.toLowerCase())} dot>
        {value}
      </Badge>
    );
  }

  if (isGuid(value)) {
    return <CopyableValue value={value} />;
  }

  if (isEmailKey(name) || looksLikeEmail(value)) {
    return (
      <a href={`mailto:${value}`} className="font-semibold text-[#0077E6] hover:underline break-all">
        {value}
      </a>
    );
  }

  if (isPhoneKey(name)) {
    const formatted = formatPhone(value) || value;
    const href = phoneTelHref(value);
    if (href) {
      return (
        <a href={href} className="font-semibold text-[#0077E6] hover:underline">
          {formatted}
        </a>
      );
    }
    return <span>{formatted}</span>;
  }

  if (name.toLowerCase() === 'activitytype') {
    return <span>{activityLabel(value)}</span>;
  }

  return <span>{value}</span>;
}

export default function PropertyGrid({ value, hideKeys = [] }: Props) {
  const record = asRecord(value);
  if (record) {
    const entries = Object.entries(record).filter(([key]) => !hideKeys.includes(key));
    if (entries.length === 0) {
      return <p className="text-sm text-gray-400">No fields to show.</p>;
    }

    const nested = entries.filter(([, child]) => asRecord(child) || Array.isArray(child));
    const leaves = entries.filter(([, child]) => !asRecord(child) && !Array.isArray(child));

    return (
      <div className="space-y-5">
        {leaves.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {leaves.map(([key, child]) => (
              <PropertyField key={key} label={humanizeLabel(key)}>
                <SmartValue name={key} value={child} />
              </PropertyField>
            ))}
          </div>
        ) : null}
        {nested.map(([key, child]) => (
          <div key={key} className="rounded-lg bg-slate-50 border border-slate-100 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              {humanizeLabel(key)}
            </p>
            <PropertyGrid value={child} />
          </div>
        ))}
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <p className="text-sm text-gray-400">Empty list.</p>;
    }
    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <div key={index} className="rounded-lg bg-slate-50 border border-slate-100 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Item {index + 1}
            </p>
            <PropertyGrid value={item} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <p className="text-sm font-medium text-dark-text break-words">
      <SmartValue name="" value={value} />
    </p>
  );
}

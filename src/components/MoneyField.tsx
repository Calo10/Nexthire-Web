import { useMemo } from 'react';

interface Props {
  label: string;
  value: number;
  onValue: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  narrow?: boolean;
  error?: string;
  currencySymbol?: string;
}

function snapToStep(n: number, step: number): number {
  const snapped = Math.round(n / step) * step;
  return Number(snapped.toFixed(2));
}

export default function MoneyField({
  label,
  value,
  onValue,
  min,
  max,
  step = 0.5,
  narrow = false,
  error,
  currencySymbol = '$',
}: Props) {
  const borderClass = error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300';
  const helpId = useMemo(() => `money-field-${label.replace(/\s+/g, '-').toLowerCase()}`, [label]);

  const clamp = (n: number) => {
    let out = n;
    if (min != null && Number.isFinite(min)) out = Math.max(min, out);
    if (max != null && Number.isFinite(max)) out = Math.min(max, out);
    return out;
  };

  const handleChange = (raw: string) => {
    if (raw.trim() === '') return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onValue(clamp(n));
  };

  const handleBlur = () => {
    const snapped = step > 0 ? snapToStep(value, step) : Number(value.toFixed(2));
    onValue(clamp(snapped));
  };

  return (
    <div className={narrow ? 'w-full max-w-[9.5rem]' : 'w-full'}>
      <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={helpId}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
          {currencySymbol}
        </span>
        <input
          id={helpId}
          type="number"
          step={step}
          min={min}
          max={max}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          className={`w-full pl-7 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white ${borderClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto`}
          placeholder="0.00"
        />
      </div>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

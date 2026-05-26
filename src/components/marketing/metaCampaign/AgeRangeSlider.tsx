import { useEffect, useRef, useState } from 'react';

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

interface Props {
  min?: number;
  max?: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  error?: string;
  label: string;
}

export default function AgeRangeSlider({
  min = 13,
  max = 65,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  error,
  label,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const [focused, setFocused] = useState<'min' | 'max' | null>(null);

  let a = clampInt(valueMin, min, max - 1);
  let b = clampInt(valueMax, min + 1, max);
  if (a >= b) {
    b = Math.min(max, a + 1);
    a = Math.max(min, b - 1);
  }

  const toPct = (v: number) => ((v - min) / (max - min)) * 100;
  const leftPct = toPct(a);
  const rightPct = toPct(b);

  const valueFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return a;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width, clientX - r.left));
    const ratio = r.width > 0 ? x / r.width : 0;
    const raw = min + ratio * (max - min);
    return clampInt(Math.round(raw), min, max);
  };

  const setNearestThumb = (v: number) => {
    const distMin = Math.abs(v - a);
    const distMax = Math.abs(v - b);
    const next = distMin <= distMax ? 'min' : 'max';
    setDragging(next);
    return next;
  };

  const applyValue = (thumb: 'min' | 'max', next: number) => {
    if (thumb === 'min') {
      onChangeMin(clampInt(next, min, b - 1));
    } else {
      onChangeMax(clampInt(next, a + 1, max));
    }
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const v = valueFromClientX(e.clientX);
      applyValue(dragging, v);
    };
    const onUp = () => setDragging(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, a, b, min, max]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm font-semibold text-gray-800 tabular-nums">
          {a} – {b}
        </p>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="relative h-12 select-none touch-none"
          onPointerDown={(e) => {
            const v = valueFromClientX(e.clientX);
            const thumb = setNearestThumb(v);
            applyValue(thumb, v);
          }}
          role="presentation"
        >
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gray-200" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-emerald-500"
            style={{ left: `${leftPct}%`, width: `${Math.max(0, rightPct - leftPct)}%` }}
          />

          <button
            type="button"
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border bg-white shadow ring-0 transition ${
              dragging === 'min' || focused === 'min' ? 'border-emerald-600 ring-4 ring-emerald-100' : 'border-gray-300'
            }`}
            style={{ left: `${leftPct}%` }}
            aria-label={`${label} min`}
            onPointerDown={(e) => {
              e.stopPropagation();
              setDragging('min');
            }}
            onFocus={() => setFocused('min')}
            onBlur={() => setFocused((f) => (f === 'min' ? null : f))}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 5 : 1;
              if (e.key === 'ArrowLeft') onChangeMin(clampInt(a - step, min, b - 1));
              if (e.key === 'ArrowRight') onChangeMin(clampInt(a + step, min, b - 1));
              if (e.key === 'Home') onChangeMin(min);
              if (e.key === 'End') onChangeMin(b - 1);
            }}
          />

          <button
            type="button"
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border bg-white shadow ring-0 transition ${
              dragging === 'max' || focused === 'max' ? 'border-emerald-600 ring-4 ring-emerald-100' : 'border-gray-300'
            }`}
            style={{ left: `${rightPct}%` }}
            aria-label={`${label} max`}
            onPointerDown={(e) => {
              e.stopPropagation();
              setDragging('max');
            }}
            onFocus={() => setFocused('max')}
            onBlur={() => setFocused((f) => (f === 'max' ? null : f))}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 5 : 1;
              if (e.key === 'ArrowLeft') onChangeMax(clampInt(b - step, a + 1, max));
              if (e.key === 'ArrowRight') onChangeMax(clampInt(b + step, a + 1, max));
              if (e.key === 'Home') onChangeMax(a + 1);
              if (e.key === 'End') onChangeMax(max);
            }}
          />
        </div>
      </div>

      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

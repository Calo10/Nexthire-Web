type Slice = { label: string; percent: number; color: string };

type HrAreaDonutChartProps = {
  slices: Slice[];
  centerValue: string;
  centerLabel: string;
};

export default function HrAreaDonutChart({ slices, centerValue, centerLabel }: HrAreaDonutChartProps) {
  const size = 168;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
          {slices.map((slice) => {
            const length = (slice.percent / 100) * circumference;
            const circle = (
              <circle
                key={slice.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={stroke}
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += length;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-dark-text tabular-nums">{centerValue}</span>
          <span className="text-[11px] text-gray-500">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-2.5">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
            <span className="flex-1 text-gray-600 truncate">{slice.label}</span>
            <span className="font-semibold text-dark-text tabular-nums">{slice.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

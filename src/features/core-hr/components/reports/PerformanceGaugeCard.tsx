type Stat = { label: string; value: string };

type Props = {
  title: string;
  /** 0–100. */
  percent: number;
  color: string;
  stats: Stat[];
  /** Short comparison note (e.g. "-5% vs previous"). */
  note?: string | null;
  noteTone?: 'good' | 'bad' | 'neutral';
  actionLabel?: string;
  onAction?: () => void;
};

const NOTE_CLS = { good: 'text-emerald-600', bad: 'text-red-600', neutral: 'text-gray-500' } as const;

export default function PerformanceGaugeCard({ title, percent, color, stats, note, noteTone = 'neutral', actionLabel, onAction }: Props) {
  const size = 112;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const dash = (clamped / 100) * circumference;

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dark-text">{title}</h3>
        {actionLabel && onAction ? (
          <button type="button" onClick={onAction} className="text-xs font-medium text-violet-700 hover:underline">
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${title}: ${Math.round(clamped)}%`}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-bold tabular-nums text-dark-text">
            {Math.round(clamped)}%
          </span>
        </div>
        <dl className="min-w-0 flex-1 space-y-2">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-[11px] text-gray-500">{s.label}</dt>
              <dd className="text-sm font-semibold tabular-nums text-dark-text">{s.value}</dd>
            </div>
          ))}
          {note ? <p className={`text-xs font-medium ${NOTE_CLS[noteTone]}`}>{note}</p> : null}
        </dl>
      </div>
    </div>
  );
}

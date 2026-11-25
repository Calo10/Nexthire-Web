import { clampPercent } from '../../utils/onboardingFormat';

type Props = {
  percent: number;
  /** Hide the numeric label (e.g. when it is rendered elsewhere). */
  hideLabel?: boolean;
  className?: string;
};

export default function OnboardingProgressBar({ percent, hideLabel = false, className = '' }: Props) {
  const value = clampPercent(percent);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all ${value >= 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      {hideLabel ? null : <span className="w-9 shrink-0 text-right text-xs font-medium text-gray-600">{value}%</span>}
    </div>
  );
}

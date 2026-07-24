import { useTranslation } from 'react-i18next';
import type { SourcingDashboard } from '../../types/sourcing';

function pickNum(d: SourcingDashboard | null, keys: string[]): number | null {
  if (!d) return null;
  for (const k of keys) {
    const v = d[k];
    if (v != null && typeof v !== 'object') {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

interface Props {
  data: SourcingDashboard | null;
  isLoading: boolean;
  campaignCountOverride?: number | null;
  /** Prefer live Meta spend ÷ leads when provided. */
  costPerCandidateOverride?: number | null;
}

export default function SourcingDashboardCards({
  data,
  isLoading,
  campaignCountOverride = null,
  costPerCandidateOverride = null,
}: Props) {
  const { t } = useTranslation();

  const captured = pickNum(data, ['candidatesCapturedToday', 'candidatesCaptured', 'totalCandidatesToday']);
  const campaigns = pickNum(data, ['activeCampaigns', 'activeCampaignCount']);
  const campaignsShown =
    campaignCountOverride != null && Number.isFinite(campaignCountOverride) && campaignCountOverride >= 0
      ? campaignCountOverride
      : campaigns;
  const cost =
    costPerCandidateOverride != null && Number.isFinite(costPerCandidateOverride)
      ? costPerCandidateOverride
      : pickNum(data, ['costPerCandidate', 'avgCostPerCandidate']);
  const conversion = pickNum(data, ['conversionRate', 'conversionRatePercent']);

  const cards = [
    {
      key: 'captured',
      label: t('sourcing.dashboard.candidatesCaptured'),
      value: captured != null ? String(Math.round(captured)) : '—',
      icon: 'purple' as const,
    },
    {
      key: 'campaigns',
      label: t('sourcing.dashboard.activeCampaigns'),
      value: campaignsShown != null ? String(Math.round(campaignsShown)) : '—',
      icon: 'green' as const,
    },
    {
      key: 'cost',
      label: t('sourcing.dashboard.costPerCandidate'),
      value:
        cost != null
          ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(cost)
          : '—',
      icon: 'yellow' as const,
    },
    {
      key: 'conversion',
      label: t('sourcing.dashboard.conversionRate'),
      value:
        conversion != null
          ? `${conversion <= 1 && conversion > 0 ? (conversion * 100).toFixed(1) : conversion.toFixed(1)}%`
          : '—',
      icon: 'blue' as const,
    },
  ];

  const iconWrap = (tone: (typeof cards)[0]['icon']) => {
    const map = {
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-emerald-100 text-emerald-600',
      yellow: 'bg-amber-100 text-amber-600',
      blue: 'bg-sky-100 text-sky-600',
    };
    return map[tone];
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-purple-100 bg-white/80 p-5 shadow-sm animate-pulse h-28"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <div
          key={c.key}
          className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm flex items-start gap-4"
        >
          <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconWrap(c.icon)}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-600 font-medium">{c.label}</p>
            <p className="text-2xl font-bold text-dark-text mt-1 tabular-nums">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

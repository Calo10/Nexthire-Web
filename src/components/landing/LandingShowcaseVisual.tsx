import type { LandingShowcaseKey } from './landingContent';

type LandingShowcaseVisualProps = {
  variant: LandingShowcaseKey;
};

export default function LandingShowcaseVisual({ variant }: LandingShowcaseVisualProps) {
  if (variant === 'pipeline') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-purple-500/5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: 'Screening', items: ['Alex R.', 'Sara M.'] },
            { title: 'Interview', items: ['Diego P.', 'Luna K.', 'Tom H.'] },
            { title: 'Offer', items: ['Nina W.'] },
          ].map((column) => (
            <div key={column.title} className="rounded-xl bg-gray-50 p-3 min-h-[180px]">
              <p className="text-xs font-semibold text-gray-600 mb-3">{column.title}</p>
              <div className="space-y-2">
                {column.items.map((name) => (
                  <div key={name} className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
                    <p className="text-xs font-medium text-dark-text">{name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Senior role · 4d</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'sourcing') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-purple-500/5 space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-purple-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-dark-text">Meta Campaign · Product Designer</p>
            <p className="text-xs text-gray-500 mt-0.5">San José · Active · $24/day</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">Live</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Leads', value: '127' },
            { label: 'Contacted', value: '64' },
            { label: 'Converted', value: '18' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-gray-100 p-3 text-center">
              <p className="text-lg font-bold text-primary">{metric.value}</p>
              <p className="text-[11px] text-gray-500">{metric.label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-100 divide-y divide-gray-100">
          {['Instagram · Campaign lead', 'Facebook · Campaign lead', 'LinkedIn · Ad click', 'TikTok · Video ad', 'WhatsApp · Apply bot'].map((source) => (
            <div key={source} className="flex items-center justify-between px-3 py-2.5 text-xs">
              <span className="text-dark-text">{source}</span>
              <span className="text-primary font-medium">New</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-purple-500/5">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: 'Applications', value: '284' },
          { label: 'Avg. time to hire', value: '18d' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-100 p-4">
            <p className="text-2xl font-bold text-dark-text">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-xs font-semibold text-gray-600 mb-3">Applications by stage</p>
        <div className="space-y-2">
          {[
            { label: 'Applied', width: 'w-full', value: '42%' },
            { label: 'Screening', width: 'w-4/5', value: '28%' },
            { label: 'Interview', width: 'w-3/5', value: '18%' },
            { label: 'Hired', width: 'w-2/5', value: '12%' },
          ].map((bar) => (
            <div key={bar.label}>
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>{bar.label}</span>
                <span>{bar.value}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r from-primary to-purple-600 ${bar.width}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

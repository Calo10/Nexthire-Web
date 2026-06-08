import LandingPlatformLogo from './LandingPlatformLogo';
import { landingCampaignPlatformKeys } from './landingContent';

export default function LandingCampaignVisual() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-purple-500/5 space-y-4">
      <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
        {landingCampaignPlatformKeys.map((platform) => (
          <LandingPlatformLogo key={platform} platform={platform} size="lg" />
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-dark-text">Campaign · Backend Engineer</p>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
            Active
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Instagram', 'Facebook', 'LinkedIn', 'TikTok'].map((channel) => (
            <span
              key={channel}
              className="text-[11px] font-medium text-gray-700 bg-white border border-gray-200 px-2.5 py-1 rounded-full"
            >
              {channel}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { label: 'Reach', value: '24.5k' },
            { label: 'Clicks', value: '1.2k' },
            { label: 'Applicants', value: '86' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-lg bg-white border border-gray-100 p-2 text-center">
              <p className="text-sm font-bold text-primary">{metric.value}</p>
              <p className="text-[10px] text-gray-500">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

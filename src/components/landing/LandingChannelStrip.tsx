import LandingPlatformLogo from './LandingPlatformLogo';
import { landingCampaignPlatformKeys } from './landingContent';

export default function LandingChannelStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-6">
      {landingCampaignPlatformKeys.map((platform) => (
        <LandingPlatformLogo key={platform} platform={platform} />
      ))}
      <div
        className="h-12 w-12 rounded-xl ring-1 ring-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center shadow-sm"
        title="WhatsApp"
      >
        <img
          src="https://cdn.simpleicons.org/whatsapp/25D366"
          alt="WhatsApp"
          className="h-6 w-6 object-contain"
          loading="lazy"
        />
      </div>
    </div>
  );
}

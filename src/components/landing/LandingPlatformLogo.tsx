type PlatformId = 'instagram' | 'facebook' | 'linkedin' | 'tiktok';

const PLATFORM_META: Record<
  PlatformId,
  { label: string; simpleIcon?: string; linkedInSvg?: boolean; ringClass: string }
> = {
  instagram: {
    label: 'Instagram',
    simpleIcon: 'instagram',
    ringClass: 'ring-pink-200 bg-gradient-to-br from-pink-50 to-purple-50',
  },
  facebook: {
    label: 'Facebook',
    simpleIcon: 'facebook',
    ringClass: 'ring-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50',
  },
  linkedin: {
    label: 'LinkedIn',
    linkedInSvg: true,
    ringClass: 'ring-sky-200 bg-gradient-to-br from-sky-50 to-blue-50',
  },
  tiktok: {
    label: 'TikTok',
    simpleIcon: 'tiktok',
    ringClass: 'ring-gray-200 bg-gradient-to-br from-gray-50 to-slate-100',
  },
};

type LandingPlatformLogoProps = {
  platform: PlatformId;
  size?: 'md' | 'lg';
};

export default function LandingPlatformLogo({ platform, size = 'md' }: LandingPlatformLogoProps) {
  const meta = PLATFORM_META[platform];
  const boxClass = size === 'lg' ? 'h-16 w-16 rounded-2xl' : 'h-12 w-12 rounded-xl';
  const iconClass = size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';

  return (
    <div
      className={`${boxClass} ring-1 ${meta.ringClass} flex items-center justify-center shadow-sm`}
      title={meta.label}
    >
      {meta.linkedInSvg ? (
        <svg viewBox="0 0 24 24" className={iconClass} aria-label="LinkedIn" role="img">
          <path
            fill="#0A66C2"
            d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.86-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.33V9h3.42v1.56h.05c.48-.9 1.64-1.86 3.37-1.86 3.6 0 4.27 2.37 4.27 5.46v6.29zM5.31 7.43a2.06 2.06 0 110-4.11 2.06 2.06 0 010 4.11zM7.09 20.45H3.53V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z"
          />
        </svg>
      ) : (
        <img
          src={`https://cdn.simpleicons.org/${meta.simpleIcon}`}
          alt={meta.label}
          className={`${iconClass} object-contain`}
          loading="lazy"
        />
      )}
    </div>
  );
}

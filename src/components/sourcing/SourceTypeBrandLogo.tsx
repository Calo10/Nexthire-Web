const SOURCE_LOGOS: { match: RegExp; src: string; alt: string }[] = [
  { match: /meta_ads|^meta$|facebook_ads|instagram_ads/i, src: 'https://cdn.simpleicons.org/meta', alt: 'Meta' },
  { match: /tiktok|tik_tok|tik-tok/i, src: 'https://cdn.simpleicons.org/tiktok', alt: 'TikTok' },
  { match: /linkedin/i, src: 'https://cdn.simpleicons.org/linkedin', alt: 'LinkedIn' },
  { match: /calendly/i, src: 'https://cdn.simpleicons.org/calendly', alt: 'Calendly' },
];

function TwilioIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Twilio logo" role="img">
      <circle cx="7" cy="7" r="4" fill="#F22F46" />
      <circle cx="17" cy="7" r="4" fill="#F22F46" />
      <circle cx="7" cy="17" r="4" fill="#F22F46" />
      <circle cx="17" cy="17" r="4" fill="#F22F46" />
    </svg>
  );
}

function PublicApplyWebIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Public apply" role="img">
      <circle cx="12" cy="12" r="10" fill="#EEF2FF" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="#6366F1" strokeWidth="1.75" />
      <ellipse cx="12" cy="12" rx="3.5" ry="9" fill="none" stroke="#6366F1" strokeWidth="1.5" />
      <path d="M3 12h18" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" />
      <text
        x="12"
        y="13.5"
        textAnchor="middle"
        fill="#4F46E5"
        fontSize="7"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        www
      </text>
    </svg>
  );
}

export interface SourceTypeBrandLogoProps {
  sourceTypeCode: string;
  displayName: string;
  /** Default matches source cards; `lg` for modal headers; `xs` for compact tables */
  size?: 'xs' | 'sm' | 'lg';
  className?: string;
}

export default function SourceTypeBrandLogo({ sourceTypeCode, displayName, size = 'sm', className = '' }: SourceTypeBrandLogoProps) {
  const code = sourceTypeCode.toLowerCase();
  const logo = SOURCE_LOGOS.find((l) => l.match.test(code));
  const boxClass =
    size === 'lg'
      ? 'w-12 h-12 rounded-xl border border-gray-200'
      : size === 'xs'
        ? 'w-8 h-8 rounded-md border border-gray-200'
        : 'w-10 h-10 rounded-lg border border-gray-200';
  const iconClass = size === 'lg' ? 'w-8 h-8' : size === 'xs' ? 'w-4 h-4' : 'w-6 h-6';
  const initials = (displayName || sourceTypeCode || '??').slice(0, 2).toUpperCase();

  return (
    <div className={`${boxClass} bg-white flex items-center justify-center overflow-hidden shrink-0 ${className}`.trim()}>
      {/twilio/i.test(code) ? (
        <TwilioIcon className={iconClass} />
      ) : /public_apply/i.test(code) ? (
        <PublicApplyWebIcon className={iconClass} />
      ) : logo ? (
        <img src={logo.src} alt={logo.alt} className={`${iconClass} object-contain`} loading="lazy" />
      ) : (
        <span className={`font-semibold text-gray-500 ${size === 'lg' ? 'text-sm' : size === 'xs' ? 'text-[10px]' : 'text-xs'}`}>{initials}</span>
      )}
    </div>
  );
}

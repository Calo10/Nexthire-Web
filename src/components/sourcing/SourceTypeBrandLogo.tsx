const SOURCE_LOGOS: { match: RegExp; src: string; alt: string }[] = [
  { match: /meta_ads/i, src: 'https://cdn.simpleicons.org/meta', alt: 'Meta' },
  { match: /tiktok|tik_tok|tik-tok/i, src: 'https://cdn.simpleicons.org/tiktok', alt: 'TikTok' },
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
      {code.includes('linkedin') ? (
        <svg viewBox="0 0 24 24" className={iconClass} aria-label="LinkedIn logo" role="img">
          <path
            fill="#0A66C2"
            d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.86-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.33V9h3.42v1.56h.05c.48-.9 1.64-1.86 3.37-1.86 3.6 0 4.27 2.37 4.27 5.46v6.29zM5.31 7.43a2.06 2.06 0 110-4.11 2.06 2.06 0 010 4.11zM7.09 20.45H3.53V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z"
          />
        </svg>
      ) : /twilio/i.test(code) ? (
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

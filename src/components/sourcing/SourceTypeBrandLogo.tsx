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

function WhatsAppIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="WhatsApp logo" role="img">
      <path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
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
      ) : /whatsapp/i.test(code) ? (
        <WhatsAppIcon className={iconClass} />
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

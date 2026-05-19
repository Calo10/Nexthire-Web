import { formatPhoneForDisplay } from '../lib/phone';

export default function PhoneDisplay({
  phone,
  className = '',
  showFlag = true,
  fallback = '-',
}: {
  phone?: string | null;
  className?: string;
  showFlag?: boolean;
  fallback?: string;
}) {
  if (!phone) return <span className={className}>{fallback}</span>;
  const { text, flag } = formatPhoneForDisplay(phone);
  if (!text) return <span className={className}>{fallback}</span>;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {showFlag && flag ? <span aria-hidden="true">{flag}</span> : null}
      <span>{text}</span>
    </span>
  );
}


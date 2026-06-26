import Logo from '../Logo';
import { usePublicOrgBrandingContext } from '../../contexts/PublicOrgBrandingContext';

interface PublicOrgLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Use `footer` inside the dark branded footer (accent label color). */
  variant?: 'default' | 'footer';
}

function LogoSkeleton({ size, className }: { size: PublicOrgLogoProps['size']; className: string }) {
  const sizes = {
    sm: 'h-9',
    md: 'h-14',
    lg: 'h-16',
    xl: 'h-20',
  };

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`} aria-hidden="true">
      <div className={`${sizes[size || 'md']} w-36 max-w-[280px] rounded-lg bg-gray-200/70 animate-pulse`} />
    </div>
  );
}

export default function PublicOrgLogo({ className = '', size = 'md', variant = 'default' }: PublicOrgLogoProps) {
  const { logoSrc, orgDisplayName, isLoading } = usePublicOrgBrandingContext();

  const sizes = {
    sm: 'h-9 max-h-9',
    md: 'h-14 max-h-14',
    lg: 'h-16 max-h-16',
    xl: 'h-20 max-h-20',
  };

  const nameSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const footerNameSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const nameClassName =
    variant === 'footer'
      ? `truncate font-semibold brand-footer-label ${footerNameSizes[size]}`
      : `truncate font-semibold brand-heading ${nameSizes[size]}`;

  if (isLoading) {
    return <LogoSkeleton size={size} className={className} />;
  }

  if (logoSrc) {
    return (
      <div className={`flex items-center gap-3 min-w-0 ${className}`}>
        <img
          src={logoSrc}
          alt={orgDisplayName || 'Organization logo'}
          className={`${sizes[size]} w-auto max-w-[280px] object-contain`}
        />
        {orgDisplayName ? <span className={nameClassName}>{orgDisplayName}</span> : null}
      </div>
    );
  }

  if (orgDisplayName) {
    return (
      <div className={`flex items-center min-w-0 ${className}`}>
        <span className={nameClassName}>{orgDisplayName}</span>
      </div>
    );
  }

  return <Logo className={className} size={size} />;
}

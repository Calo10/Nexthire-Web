import { useEffect, useState } from 'react';
import { avatarColor, initialsOf } from '../utils/employeeFormat';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
} as const;

type Props = {
  name: string;
  seed?: string;
  url?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
};

export default function EmployeeAvatar({ name, seed, url, size = 'md', className = '' }: Props) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  const base = `${SIZES[size]} shrink-0 rounded-full ${className}`;
  if (url && !failed) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${base} object-cover`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${base} inline-flex items-center justify-center font-semibold ${avatarColor(seed || name)}`}
    >
      {initialsOf(name)}
    </span>
  );
}

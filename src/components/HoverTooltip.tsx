import { ReactNode } from 'react';

interface Props {
  show: boolean;
  content: ReactNode;
  align?: 'center' | 'end';
  className?: string;
  children: ReactNode;
}

export default function HoverTooltip({ show, content, align = 'center', className = 'inline-flex', children }: Props) {
  if (!show) return <>{children}</>;

  const alignClass = align === 'end' ? 'right-0' : 'left-1/2 -translate-x-1/2';
  const arrowClass = align === 'end' ? 'right-4' : 'left-1/2 -translate-x-1/2';

  return (
    <div className={`relative group ${className}`}>
      <span className="flex w-full cursor-not-allowed">{children}</span>
      <div role="tooltip" className={`absolute bottom-full z-20 pb-2 ${alignClass}`}>
        <div className="invisible w-max max-w-xs rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs leading-relaxed text-white shadow-lg opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          {content}
          <span aria-hidden className={`absolute top-full border-4 border-transparent border-t-gray-900 ${arrowClass}`} />
        </div>
      </div>
    </div>
  );
}

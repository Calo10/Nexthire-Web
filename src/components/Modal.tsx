import { useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useBackdropDismiss } from '../hooks/useBackdropDismiss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Optional mark (e.g. brand logo) shown left of the title */
  titleIcon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  titleIcon,
  children,
  footer,
  width = 'md',
}: ModalProps) {
  const { t } = useTranslation();
  const backdropDismiss = useBackdropDismiss(onClose);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        {...backdropDismiss}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full ${widthClasses[width]} max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-3">
              {titleIcon ? <div className="shrink-0">{titleIcon}</div> : null}
              <h2 className="text-2xl font-bold text-dark-text min-w-0 leading-tight">{title}</h2>
            </div>
            {subtitle ? (
              <p
                className={`mt-1 text-sm text-gray-600 ${titleIcon ? 'pl-[3.75rem]' : ''}`}
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 shrink-0 self-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.aria.closeModal')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">{footer}</div>
        )}
      </div>
    </div>
  );
}

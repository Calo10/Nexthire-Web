import { useTranslation } from 'react-i18next';
import Button from './Button';

export default function ExportExcelButton({
  onClick,
  disabled = false,
  busy = false,
  className = '',
}: {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      variant="outline"
      size="md"
      className={className}
      onClick={onClick}
      disabled={disabled || busy}
    >
      <span className="flex items-center gap-2">
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="3" fill="#217346" />
          <path
            fill="#fff"
            d="M7.2 7.2h2.1l2.7 4.15L14.7 7.2h2.05l-3.75 5.35 3.9 5.25h-2.15l-2.85-4.3-2.9 4.3H7.05l3.95-5.4L7.2 7.2z"
          />
        </svg>
        <span>{busy ? t('common.actions.exporting') : t('common.actions.exportExcel')}</span>
      </span>
    </Button>
  );
}

import { useTranslation } from 'react-i18next';

function deliveryKey(status: string | null | undefined): 'queued' | 'sent' | 'delivered' | 'read' | 'undelivered' {
  switch ((status || '').trim().toLowerCase()) {
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'read':
      return 'read';
    case 'undelivered':
    case 'failed':
      return 'undelivered';
    default:
      return 'queued';
  }
}

export function WhatsAppDeliveryCaption({
  status,
  errorCode,
}: {
  status?: string | null;
  errorCode?: string | null;
}) {
  const { t } = useTranslation();
  const key = deliveryKey(status);
  const marketingRefused = String(errorCode || '') === '63049';
  const failed = key === 'undelivered';

  return (
    <span className={failed ? 'text-red-700' : undefined}>
      {t(`whatsappInbox.delivery.${key}`)}
      {marketingRefused ? ` · ${t('whatsappInbox.delivery.marketingRefused')}` : null}
    </span>
  );
}

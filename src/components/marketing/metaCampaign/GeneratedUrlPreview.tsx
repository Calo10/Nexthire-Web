import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../Button';

interface Props {
  url: string;
  emptyMessage?: string;
}

export default function GeneratedUrlPreview({ url, emptyMessage }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">{t('metaCampaign.preview.urlLabel')}</p>
        <Button type="button" variant="outline" size="sm" disabled={!url} onClick={handleCopy}>
          {copied ? t('metaCampaign.preview.copied') : t('metaCampaign.preview.copy')}
        </Button>
      </div>
      {!url ? (
        <p className="text-sm text-gray-500">{emptyMessage ?? t('metaCampaign.preview.noUrl')}</p>
      ) : (
        <p className="text-xs font-mono text-primary break-all leading-relaxed">{url}</p>
      )}
    </div>
  );
}

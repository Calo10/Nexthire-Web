import { useTranslation } from 'react-i18next';
import type { HrDocumentUrlState } from '../../hooks/useHrDocumentUrl';
import type { HrDocumentListItem } from '../../models/hrDocument';
import { previewKind, viewerUrlFor } from '../../utils/hrDocumentFormat';

type Props = {
  doc: Pick<HrDocumentListItem, 'name' | 'contentType'>;
  source: HrDocumentUrlState;
  className?: string;
};

/** Inline preview: images render directly, PDFs/Office files in an iframe, anything else gets a fallback. */
export default function HrDocumentPreview({ doc, source, className = 'h-64' }: Props) {
  const { t } = useTranslation();
  const frame = `flex items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${className}`;

  if (source.loading) return <div className={`${frame} animate-pulse`} />;
  if (!source.url) {
    return (
      <div className={`${frame} px-6 text-center text-sm text-gray-500`}>
        {source.error ? t('coreHr.documentsHub.preview.error') : t('coreHr.documentsHub.preview.none')}
      </div>
    );
  }
  const kind = previewKind(source.url, doc.contentType, doc.name);
  if (kind === 'image') {
    return (
      <div className={frame}>
        <img src={source.url} alt={doc.name} className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
      </div>
    );
  }
  if (kind === 'pdf' || kind === 'office') {
    return (
      <div className={frame}>
        <iframe title={doc.name} src={viewerUrlFor(source.url, kind)} className="h-full w-full bg-white" />
      </div>
    );
  }
  return <div className={`${frame} px-6 text-center text-sm text-gray-500`}>{t('coreHr.documentsHub.preview.unsupported')}</div>;
}

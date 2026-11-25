import { useTranslation } from 'react-i18next';
import Badge from '../../../../components/ui/Badge';
import type { HrDocumentListItem } from '../../models/hrDocument';
import { documentStatusTone, resolveDocumentStatus } from '../../utils/hrDocumentFormat';

export default function HrDocumentStatusBadge({ doc }: { doc: Pick<HrDocumentListItem, 'status' | 'displayStatus' | 'expiresAt'> }) {
  const { t } = useTranslation();
  const status = resolveDocumentStatus(doc);
  return (
    <Badge tone={documentStatusTone(status)} dot>
      {t(`coreHr.documentsHub.status.${status}`)}
    </Badge>
  );
}

export function HrDocumentTypeBadge({ category }: { category: string }) {
  const { t } = useTranslation();
  return <Badge tone="gray">{t(`coreHr.employees.documents.categories.${category}`, { defaultValue: category })}</Badge>;
}

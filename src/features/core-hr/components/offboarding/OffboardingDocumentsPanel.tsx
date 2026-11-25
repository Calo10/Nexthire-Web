import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Badge from '../../../../components/ui/Badge';
import { offboardingsApi } from '../../api/offboardingsApi';
import type { OffboardingDocument } from '../../models/offboarding';
import { apiErrorMessage } from '../../utils/employeeFormat';
import { documentStatusTone } from '../../utils/offboardingFormat';

const DOCUMENT_STATUSES = ['Missing', 'Uploaded', 'PendingApproval', 'Approved', 'Rejected'] as const;

type Props = {
  offboardingId: string;
  documents: OffboardingDocument[];
  canManage: boolean;
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
};

export default function OffboardingDocumentsPanel({ offboardingId, documents, canManage, onChanged, onError }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string | null>(null);

  const setStatus = async (doc: OffboardingDocument, status: string) => {
    if (status === doc.status) return;
    setBusy(doc.id);
    try {
      await offboardingsApi.updateDocument(offboardingId, doc.id, {
        status,
        employeeDocumentId: doc.employeeDocumentId ?? null,
      });
      await onChanged();
    } catch (err) {
      onError(apiErrorMessage(err, t('coreHr.offboarding.documents.updateError')));
    } finally {
      setBusy(null);
    }
  };

  if (documents.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
        {t('coreHr.offboarding.documents.empty')}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-dark-text">{doc.name}</p>
            <p className="text-xs text-gray-500">
              {doc.category}
              {doc.isRequired ? ` · ${t('coreHr.offboarding.documents.required')}` : ''}
            </p>
          </div>
          {canManage ? (
            <select
              aria-label={t('coreHr.offboarding.documents.status')}
              value={doc.status}
              disabled={busy === doc.id}
              onChange={(e) => void setStatus(doc, e.target.value)}
              className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {DOCUMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`coreHr.offboarding.documentStatus.${s}`)}
                </option>
              ))}
            </select>
          ) : (
            <Badge tone={documentStatusTone(doc.status)}>
              {t(`coreHr.offboarding.documentStatus.${doc.status}`, { defaultValue: doc.status })}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}

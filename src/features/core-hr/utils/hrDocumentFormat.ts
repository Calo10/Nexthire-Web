import type { BadgeTone } from './employeeFormat';
import { daysUntil } from './employeeFormat';
import type { HrDocumentListItem, HrDocumentStatus } from '../models/hrDocument';

const EXPIRING_DAYS = 30;

/** Normalizes API status strings and derives expiry-based status from `expiresAt` when the API reports "valid". */
export function resolveDocumentStatus(
  doc: Pick<HrDocumentListItem, 'status' | 'displayStatus' | 'expiresAt'>,
): HrDocumentStatus {
  const raw = (doc.displayStatus || doc.status || '').toLowerCase();
  if (raw === 'expired') return 'Expired';
  if (raw === 'pending') return 'Pending';
  if (raw === 'expiring') return 'Expiring';
  // Fall back to the expiry date if the API did not send a display status.
  if (!doc.displayStatus) {
    const days = daysUntil(doc.expiresAt);
    if (days !== null) {
      if (days < 0) return 'Expired';
      if (days <= EXPIRING_DAYS) return 'Expiring';
    }
  }
  return 'Active';
}

export function documentStatusTone(status: HrDocumentStatus): BadgeTone {
  switch (status) {
    case 'Active':
      return 'green';
    case 'Expiring':
      return 'yellow';
    case 'Expired':
      return 'red';
    case 'Pending':
    default:
      return 'gray';
  }
}

export function categoryTone(category: string): BadgeTone {
  switch (category) {
    case 'Contract':
      return 'blue';
    case 'Identification':
      return 'purple';
    case 'Tax':
      return 'yellow';
    case 'Certification':
      return 'green';
    case 'Legal':
      return 'red';
    default:
      return 'gray';
  }
}

export function formatFileSize(bytes?: number | null): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type PreviewKind = 'image' | 'pdf' | 'office' | 'other';

export function previewKind(url: string, contentType?: string | null, fileName?: string | null): PreviewKind {
  const ct = (contentType || '').toLowerCase();
  const probe = `${fileName || ''} ${url.split('?')[0]}`.toLowerCase();
  if (ct.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)\b/.test(probe)) return 'image';
  if (ct === 'application/pdf' || /\.pdf\b/.test(probe)) return 'pdf';
  if (/\.(docx?|xlsx?|pptx?)\b/.test(probe)) return 'office';
  return 'other';
}

export function viewerUrlFor(url: string, kind: PreviewKind): string {
  return kind === 'office' ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}` : url;
}

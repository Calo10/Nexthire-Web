import { useEffect, useState } from 'react';
import { documentsApi } from '../../../api/documentsApi';
import { isSafeUrl } from '../utils/employeeFormat';
import type { HrDocumentListItem } from '../models/hrDocument';

export type HrDocumentUrlState = { url: string | null; loading: boolean; error: boolean };

/** Resolves a viewable URL: a signed download URL when a stored `documentId` exists, else a safe external link. */
export function useHrDocumentUrl(doc: Pick<HrDocumentListItem, 'id' | 'documentId' | 'externalUrl'> | null): HrDocumentUrlState {
  const [state, setState] = useState<HrDocumentUrlState>({ url: null, loading: false, error: false });
  const docId = doc?.documentId ?? null;
  const external = doc?.externalUrl ?? null;
  const key = doc?.id ?? null;

  useEffect(() => {
    if (!key) {
      setState({ url: null, loading: false, error: false });
      return;
    }
    if (docId) {
      let cancelled = false;
      setState({ url: null, loading: true, error: false });
      documentsApi
        .downloadUrl(docId)
        .then((url) => {
          if (!cancelled) setState({ url: isSafeUrl(url) ? url : null, loading: false, error: !isSafeUrl(url) });
        })
        .catch(() => {
          if (!cancelled) setState({ url: null, loading: false, error: true });
        });
      return () => {
        cancelled = true;
      };
    }
    setState({ url: isSafeUrl(external) ? external : null, loading: false, error: false });
    return undefined;
  }, [key, docId, external]);

  return state;
}

/** One-shot resolver used by row actions (download without opening the drawer). */
export async function resolveHrDocumentUrl(
  doc: Pick<HrDocumentListItem, 'documentId' | 'externalUrl'>,
): Promise<string | null> {
  if (doc.documentId) {
    const url = await documentsApi.downloadUrl(doc.documentId);
    return isSafeUrl(url) ? url : null;
  }
  return isSafeUrl(doc.externalUrl) ? doc.externalUrl : null;
}

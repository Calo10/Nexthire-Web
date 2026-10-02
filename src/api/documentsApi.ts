import { apiClient } from '../lib/api';

function pickDownloadUrl(result: unknown): string | null {
  if (!result) return null;
  if (typeof result === 'string') return result.trim() || null;
  if (typeof result === 'object') {
    const row = result as Record<string, unknown>;
    const url = row.url ?? row.downloadUrl ?? row.download_url ?? row.resumeUrl ?? row.link;
    return url ? String(url).trim() || null : null;
  }
  return null;
}

export const documentsApi = {
  downloadUrl: async (documentId: string): Promise<string | null> => {
    const result = await apiClient.get<unknown>(`/documents/${encodeURIComponent(documentId)}/download-url`, true);
    return pickDownloadUrl(result);
  },
};

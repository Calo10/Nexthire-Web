import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { candidatesApi } from '../../api/candidatesApi';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import Modal from '../Modal';
import TextField from '../TextField';
import type { CandidatesPageState } from '../../hooks/useCandidatesPage';

type PublicLinkRow = { id: string; name: string; createdAt: string };

type Props = Pick<
  CandidatesPageState,
  'hasActiveFilter' | 'publicLinkBusy' | 'publicLinkError' | 'publicLinkCopied' | 'createPublicLink'
> & {
  className?: string;
};

function publicCandidateUrl(orgId: string, linkId: string) {
  return `${window.location.origin}/org/${encodeURIComponent(orgId)}/candidates/${encodeURIComponent(linkId)}`;
}

export default function PublicCandidateLinkButton({
  hasActiveFilter,
  publicLinkBusy,
  publicLinkError,
  publicLinkCopied,
  createPublicLink,
  className = '',
}: Props) {
  const { t, i18n } = useTranslation();
  const { org } = useAuth();
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [links, setLinks] = useState<PublicLinkRow[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadLinks = async () => {
    setAdminLoading(true);
    setAdminError(null);
    try {
      setLinks(await candidatesApi.listPublicLinks());
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
      setAdminError(message || t('candidates.publicLink.loadError'));
      setLinks([]);
    } finally {
      setAdminLoading(false);
    }
  };

  const openAdmin = () => {
    setAdminOpen(true);
    void loadLinks();
  };

  const submitName = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t('candidates.publicLink.nameRequired'));
      return;
    }
    setNameError(null);
    const created = await createPublicLink(trimmed);
    if (created) {
      setName('');
      setNameOpen(false);
    }
  };

  const copyLink = async (id: string) => {
    if (!org?.id) return;
    try {
      await navigator.clipboard.writeText(publicCandidateUrl(org.id, id));
      setCopiedId(id);
    } catch {
      setCopiedId(null);
    }
  };

  const removeLink = async (row: PublicLinkRow) => {
    if (!window.confirm(t('candidates.publicLink.confirmDelete', { name: row.name || row.id }))) return;
    setDeletingId(row.id);
    setAdminError(null);
    try {
      await candidatesApi.deletePublicLink(row.id);
      setLinks((current) => current.filter((item) => item.id !== row.id));
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? String((e as { message?: unknown }).message || '') : '';
      setAdminError(message || t('candidates.publicLink.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const stacked = className.includes('w-full');

  return (
    <div className={`relative flex flex-col items-center ${stacked ? 'gap-1' : ''} ${className}`}>
      <Button
        type="button"
        variant="outline"
        size="md"
        className={stacked ? 'w-full justify-center' : 'whitespace-nowrap'}
        disabled={!hasActiveFilter || publicLinkBusy}
        onClick={() => {
          setNameError(null);
          setNameOpen(true);
        }}
      >
        {publicLinkBusy ? t('candidates.publicLink.creating') : t('candidates.publicLink.button')}
      </Button>
      <button
        type="button"
        className={
          stacked
            ? 'text-xs text-gray-500 underline underline-offset-2 hover:text-gray-800'
            : 'absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap text-xs leading-none text-gray-500 underline underline-offset-2 hover:text-gray-800'
        }
        onClick={openAdmin}
      >
        {publicLinkCopied ? t('candidates.publicLink.copied') : t('candidates.publicLink.admin')}
      </button>

      <Modal
        isOpen={nameOpen}
        onClose={() => {
          if (publicLinkBusy) return;
          setNameOpen(false);
        }}
        title={t('candidates.publicLink.createTitle')}
        width="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" size="sm" disabled={publicLinkBusy} onClick={() => setNameOpen(false)}>
              {t('candidates.publicLink.cancel')}
            </Button>
            <Button type="button" variant="primary" size="sm" disabled={publicLinkBusy} onClick={() => void submitName()}>
              {publicLinkBusy ? t('candidates.publicLink.creating') : t('candidates.publicLink.create')}
            </Button>
          </div>
        }
      >
        <TextField
          label={t('candidates.publicLink.nameLabel')}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('candidates.publicLink.namePlaceholder')}
          maxLength={160}
        />
        {nameError || publicLinkError ? (
          <div className="mt-3">
            <ErrorMessage message={nameError || publicLinkError || ''} />
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        title={t('candidates.publicLink.adminTitle')}
        width="lg"
      >
        {adminError ? (
          <div className="mb-4">
            <ErrorMessage message={adminError} />
          </div>
        ) : null}
        {adminLoading ? (
          <p className="text-sm text-gray-600">{t('common.loading')}</p>
        ) : adminError ? null : links.length === 0 ? (
          <p className="text-sm text-gray-600">{t('candidates.publicLink.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 font-medium">{t('candidates.publicLink.columns.name')}</th>
                  <th className="px-3 py-2 font-medium">{t('candidates.publicLink.columns.created')}</th>
                  <th className="px-3 py-2 font-medium">{t('candidates.publicLink.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {links.map((row) => {
                  const created = row.createdAt ? new Date(row.createdAt) : null;
                  const createdLabel = created && !Number.isNaN(created.getTime())
                    ? created.toLocaleString(i18n.language || undefined)
                    : '';
                  return (
                    <tr key={row.id} className="border-b border-gray-100">
                      <td className="px-3 py-3 font-medium text-dark-text">{row.name || '—'}</td>
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{createdLabel}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => void copyLink(row.id)}>
                            {copiedId === row.id ? t('candidates.publicLink.copied') : t('candidates.publicLink.copy')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={deletingId === row.id}
                            onClick={() => void removeLink(row)}
                          >
                            {t('candidates.publicLink.delete')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import TextareaField from '../TextareaField';
import { publishMetaCampaignPagePost, metaErrorMessageFromUnknown } from '../../api/metaCampaignApi';
import type { ApiError } from '../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaignRef: string | number | null;
  campaignName?: string | null;
  destinationLink: string;
  imageSrc: string | null;
  imageBase64: string;
  imageContentType: string;
  defaultMessage: string;
}

export default function FacebookPagePostPreviewModal({
  isOpen,
  onClose,
  campaignRef,
  campaignName,
  destinationLink,
  imageSrc,
  imageBase64,
  imageContentType,
  defaultMessage,
}: Props) {
  const { t } = useTranslation();
  const [message, setMessage] = useState(defaultMessage);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionHint, setPermissionHint] = useState(false);
  const [successPostId, setSuccessPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setPermissionHint(false);
      setSuccessPostId(null);
      setPublishing(false);
      return;
    }
    setMessage(defaultMessage.trim() || campaignName?.trim() || '');
    setError(null);
    setPermissionHint(false);
    setSuccessPostId(null);
  }, [isOpen, defaultMessage, campaignName]);

  const canPublish =
    Boolean(campaignRef) &&
    Boolean(message.trim()) &&
    Boolean(destinationLink.trim()) &&
    Boolean(imageBase64.trim()) &&
    !publishing &&
    !successPostId;

  const handlePublish = async () => {
    if (!campaignRef || !canPublish) return;
    setPublishing(true);
    setError(null);
    setPermissionHint(false);
    try {
      const res = await publishMetaCampaignPagePost(campaignRef, {
        message: message.trim(),
        link: destinationLink.trim(),
        imageBase64,
        imageContentType: imageContentType || 'image/jpeg',
      });
      setSuccessPostId(res.postId);
    } catch (e: unknown) {
      const err = e as ApiError;
      const details = err?.details;
      const isPermission =
        err?.status === 403 ||
        (details && typeof details === 'object' && Boolean((details as { permissionError?: boolean }).permissionError));
      setPermissionHint(Boolean(isPermission));
      setError(
        metaErrorMessageFromUnknown(e) ||
          (isPermission
            ? t('sourcing.campaign.pagePost.permissionError')
            : t('sourcing.campaign.pagePost.publishFailed'))
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('sourcing.campaign.pagePost.title')}
      subtitle={t('sourcing.campaign.pagePost.subtitle')}
      width="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={publishing}>
            {successPostId ? t('common.actions.close') : t('common.actions.cancel')}
          </Button>
          {!successPostId ? (
            <Button type="button" variant="primary" disabled={!canPublish} onClick={() => void handlePublish()}>
              {publishing ? t('sourcing.campaign.pagePost.publishing') : t('sourcing.campaign.pagePost.publish')}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        {permissionHint ? (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            {t('sourcing.campaign.pagePost.permissionHint')}
          </p>
        ) : null}
        {successPostId ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {t('sourcing.campaign.pagePost.success', { id: successPostId })}
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {t('sourcing.campaign.pagePost.preview')}
          </p>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              className="w-full max-h-64 object-contain rounded-lg border border-gray-100 bg-white"
            />
          ) : (
            <p className="text-sm text-gray-500">{t('sourcing.campaign.pagePost.noImage')}</p>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1">{t('sourcing.campaign.destinationLink')}</p>
            <p className="text-xs font-mono text-gray-800 break-all bg-white border border-gray-200 rounded-md px-2 py-1.5">
              {destinationLink || '—'}
            </p>
          </div>
        </div>

        <TextareaField
          label={t('sourcing.campaign.pagePost.message')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          disabled={Boolean(successPostId) || publishing}
        />
        <p className="text-xs text-gray-500">{t('sourcing.campaign.pagePost.messageHint')}</p>
      </div>
    </Modal>
  );
}

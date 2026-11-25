import { useTranslation } from 'react-i18next';
import Button from '../Button';
import Modal from '../Modal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  busy?: boolean;
  hideCancel?: boolean;
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  busy = false,
  hideCancel = false,
}: Props) {
  const { t } = useTranslation();
  const confirmText =
    confirmLabel ||
    (hideCancel ? t('common.actions.ok') : tone === 'danger' ? t('common.actions.delete') : t('common.actions.confirm'));
  const cancelText = cancelLabel || t('common.actions.cancel');

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={title}
      width="sm"
      footer={
        <div className="flex justify-end gap-2">
          {hideCancel ? null : (
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onClose}>
              {cancelText}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={busy}
            className={
              tone === 'danger'
                ? '!from-red-600 !to-red-600 hover:!from-red-700 hover:!to-red-700'
                : undefined
            }
            onClick={onConfirm}
          >
            {busy ? t('common.loading') : confirmText}
          </Button>
        </div>
      }
    >
      {description?.trim() ? <p className="text-sm text-gray-600">{description}</p> : <div className="h-1" />}
    </Modal>
  );
}

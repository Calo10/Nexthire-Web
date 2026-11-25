import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import Modal from '../../../../components/Modal';
import TextareaField from '../../../../components/TextareaField';

type Props = {
  isOpen: boolean;
  title: string;
  description?: string;
  label: string;
  confirmLabel: string;
  busy?: boolean;
  /** Reason is mandatory (default true). */
  required?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

/** Small modal that collects a free-text reason (cancel onboarding, reject task). */
export default function ReasonModal({
  isOpen,
  title,
  description,
  label,
  confirmLabel,
  busy = false,
  required = true,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  const trimmed = reason.trim();
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!busy) onClose();
      }}
      title={title}
      width="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={busy} onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button
            size="sm"
            disabled={busy || (required && !trimmed)}
            className="!from-red-600 !to-red-600 hover:!from-red-700 hover:!to-red-700"
            onClick={() => onConfirm(trimmed)}
          >
            {busy ? t('common.loading') : confirmLabel}
          </Button>
        </>
      }
    >
      {description ? <p className="mb-4 text-sm text-gray-600">{description}</p> : null}
      <TextareaField
        label={label}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        maxLength={1000}
        required={required}
      />
    </Modal>
  );
}

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import TextField from '../TextField';
import SelectField from '../SelectField';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import type { TemplateChannel } from '../../types/templates';

export default function TemplateModal({
  isOpen,
  defaultChannel,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  defaultChannel: TemplateChannel;
  onClose: () => void;
  onCreate: (payload: { name: string; channel: TemplateChannel; subject?: string }) => Promise<void>;
}) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState('');
  const [channel, setChannel] = useState<TemplateChannel>(defaultChannel);
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setChannel(defaultChannel);
    setSubject('');
    setError(null);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(t('templates.validation.nameRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        channel,
        subject: channel === 'email' ? subject : undefined,
      });
      handleClose();
    } catch (err) {
      const message = err && typeof err === 'object' && 'message' in err ? String((err as any).message) : t('templates.errors.create');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const channelOptions = [
    { value: 'email', label: t('templates.tabs.email') },
    { value: 'whatsapp', label: t('templates.tabs.whatsapp') },
  ];

  useEffect(() => {
    // Reset subject when switching away from email
    if (channel !== 'email') setSubject('');
  }, [channel]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('templates.modal.title')}
      subtitle={t('templates.modal.subtitle')}
      width="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button variant="primary" onClick={() => formRef.current?.requestSubmit()} disabled={isSubmitting}>
            {isSubmitting ? t('common.actions.creating') : t('templates.modal.create')}
          </Button>
        </>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {error ? <ErrorMessage message={error} /> : null}
        <TextField
          label={t('templates.fields.name')}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('templates.placeholders.name')}
        />
        <SelectField
          label={t('templates.fields.channel')}
          value={channel}
          onChange={(e) => setChannel(e.target.value as TemplateChannel)}
          options={channelOptions}
        />
        {channel === 'email' ? (
          <TextField
            label={t('templates.fields.subject')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('templates.placeholders.subject')}
          />
        ) : null}
      </form>
    </Modal>
  );
}


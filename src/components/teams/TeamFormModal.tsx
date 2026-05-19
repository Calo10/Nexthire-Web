import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import type { Team } from '../../types/teams';

interface TeamFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  team: Team | null;
  onClose: () => void;
  onSubmit: (payload: { name: string; description: string; isActive: boolean }) => Promise<void>;
}

export default function TeamFormModal({ isOpen, mode, team, onClose, onSubmit }: TeamFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && team) {
      setName(team.name);
      setDescription(team.description ?? '');
      setIsActive(team.isActive);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
    }
  }, [isOpen, mode, team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSubmit({
        name: trimmed,
        description: description.trim(),
        isActive,
      });
      onClose();
    } catch {
      // Parent shows error; keep modal open
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? t('teams.modal.createTitle') : t('teams.modal.editTitle')}
      width="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" form="team-form-modal" disabled={saving || !name.trim()}>
            {saving ? t('common.actions.saving') : t('common.actions.saveChanges')}
          </Button>
        </>
      }
    >
      <form id="team-form-modal" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="team-name" className="block text-sm font-medium text-gray-700 mb-1">
            {t('teams.modal.name')}
          </label>
          <input
            id="team-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('teams.modal.namePlaceholder')}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="team-desc" className="block text-sm font-medium text-gray-700 mb-1">
            {t('teams.modal.description')}
          </label>
          <textarea
            id="team-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('teams.modal.descriptionPlaceholder')}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-y min-h-[88px]"
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700">{t('teams.modal.active')}</span>
        </label>
      </form>
    </Modal>
  );
}

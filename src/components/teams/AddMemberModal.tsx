import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import { usersApi } from '../../api/usersApi';
import type { UserOption } from '../../types/users';

interface AddMemberModalProps {
  isOpen: boolean;
  existingUserIds: Set<string>;
  onClose: () => void;
  onAdd: (userId: string) => Promise<void>;
}

export default function AddMemberModal({ isOpen, existingUserIds, onClose, onAdd }: AddMemberModalProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedId('');
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    usersApi
      .list()
      .then((list) => {
        if (!cancelled) setUsers(list);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(t('teams.errors.loadMembers'));
          setUsers([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, t]);

  const available = useMemo(
    () => users.filter((u) => u.id && !existingUserIds.has(u.id)),
    [users, existingUserIds]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await onAdd(selectedId);
      onClose();
    } catch {
      // Parent shows error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('teams.addMember.title')}
      width="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="submit" form="add-member-form" disabled={submitting || !selectedId || available.length === 0}>
            {submitting ? t('common.actions.saving') : t('teams.actions.addMember')}
          </Button>
        </>
      }
    >
      <form id="add-member-form" onSubmit={handleSubmit} className="space-y-4">
        {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
        {loading ? (
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        ) : (
          <>
            <div>
              <label htmlFor="add-member-user" className="block text-sm font-medium text-gray-700 mb-1">
                {t('teams.addMember.selectUser')}
              </label>
              <select
                id="add-member-user"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
              >
                <option value="">{t('teams.addMember.selectUser')}</option>
                {available.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName}
                    {u.email ? ` (${u.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500">{t('teams.addMember.hint')}</p>
            {!loading && available.length === 0 && !loadError && users.length > 0 ? (
              <p className="text-sm text-gray-600">{t('teams.addMember.noEligible')}</p>
            ) : null}
          </>
        )}
      </form>
    </Modal>
  );
}

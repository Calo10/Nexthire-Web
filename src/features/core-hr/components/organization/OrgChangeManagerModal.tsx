import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import TextField from '../../../../components/TextField';
import { organizationApi } from '../../api/organizationApi';
import { apiErrorMessage } from '../../utils/employeeFormat';
import EmployeePicker from '../documents/EmployeePicker';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  employee: { id: string; name: string } | null;
  onSaved: (name: string) => void;
};

export default function OrgChangeManagerModal({ isOpen, onClose, employee, onSaved }: Props) {
  const { t } = useTranslation();
  const [managerId, setManagerId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managerError, setManagerError] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) return;
    setManagerId('');
    setEffectiveDate('');
    setReason('');
    setError(null);
    setManagerError(undefined);
  }, [isOpen, employee?.id]);

  const close = () => {
    if (!busy) onClose();
  };

  const submit = async () => {
    if (!employee) return;
    if (!managerId) {
      setManagerError(t('coreHr.organization.modals.changeManager.managerRequired'));
      return;
    }
    if (managerId === employee.id) {
      setManagerError(t('coreHr.organization.modals.changeManager.selfManager'));
      return;
    }
    setManagerError(undefined);
    setBusy(true);
    setError(null);
    try {
      await organizationApi.changeManager({
        employeeId: employee.id,
        newManagerId: managerId,
        effectiveDate: effectiveDate || null,
        reason: reason.trim() || null,
      });
      onSaved(employee.name);
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.organization.modals.changeManager.error')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t('coreHr.organization.modals.changeManager.title')}
      subtitle={employee?.name}
      width="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={busy} onClick={close}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={busy || !employee} onClick={() => void submit()}>
            {busy ? t('common.actions.saving') : t('coreHr.organization.modals.changeManager.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        <EmployeePicker
          label={t('coreHr.organization.modals.changeManager.newManager')}
          value={managerId}
          onChange={(id) => setManagerId(id)}
          error={managerError}
          disabled={busy}
        />
        <TextField
          label={t('coreHr.organization.modals.changeManager.effectiveDate')}
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          disabled={busy}
        />
        <TextField
          label={t('coreHr.organization.modals.changeManager.reason')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
          maxLength={300}
        />
      </div>
    </Modal>
  );
}

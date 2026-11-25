import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import TextField from '../../../../components/TextField';
import { organizationApi } from '../../api/organizationApi';
import type { OrgPosition } from '../../models/organization';
import { apiErrorMessage } from '../../utils/employeeFormat';
import EmployeePicker from '../documents/EmployeePicker';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  position: OrgPosition | null;
  onSaved: (positionTitle: string) => void;
};

export default function OrgAssignPositionModal({ isOpen, onClose, position, onSaved }: Props) {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employeeError, setEmployeeError] = useState<string | undefined>();

  useEffect(() => {
    if (!isOpen) return;
    setEmployeeId('');
    setEffectiveDate('');
    setError(null);
    setEmployeeError(undefined);
  }, [isOpen, position?.id]);

  const close = () => {
    if (!busy) onClose();
  };

  const submit = async () => {
    if (!position) return;
    if (!employeeId) {
      setEmployeeError(t('coreHr.organization.modals.assign.employeeRequired'));
      return;
    }
    setEmployeeError(undefined);
    setBusy(true);
    setError(null);
    try {
      await organizationApi.assignPosition(position.id, { employeeId, effectiveDate: effectiveDate || null });
      onSaved(position.title);
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.organization.modals.assign.error')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t('coreHr.organization.modals.assign.title')}
      subtitle={position?.title}
      width="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={busy} onClick={close}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={busy || !position} onClick={() => void submit()}>
            {busy ? t('common.actions.saving') : t('coreHr.organization.modals.assign.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        <EmployeePicker
          label={t('coreHr.organization.modals.assign.employee')}
          value={employeeId}
          onChange={(id) => setEmployeeId(id)}
          error={employeeError}
          disabled={busy}
        />
        <TextField
          label={t('coreHr.organization.modals.assign.effectiveDate')}
          type="date"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}

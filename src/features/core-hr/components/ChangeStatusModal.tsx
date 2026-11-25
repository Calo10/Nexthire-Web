import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import SelectField from '../../../components/SelectField';
import TextareaField from '../../../components/TextareaField';
import TextField from '../../../components/TextField';
import { employeesApi } from '../api/employeesApi';
import { EMPLOYMENT_STATUSES, type EmployeeDetail } from '../models/employee';
import { apiErrorMessage } from '../utils/employeeFormat';

type Props = {
  isOpen: boolean;
  employee: { id: string; displayName: string; employmentStatus: string } | null;
  onClose: () => void;
  onChanged: (updated: EmployeeDetail) => void;
};

export default function ChangeStatusModal({ isOpen, employee, onClose, onChanged }: Props) {
  const { t } = useTranslation();
  const [status, setStatus] = useState('Active');
  const [terminationDate, setTerminationDate] = useState('');
  const [terminationReason, setTerminationReason] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !employee) return;
    setStatus(employee.employmentStatus || 'Active');
    setTerminationDate(new Date().toISOString().slice(0, 10));
    setTerminationReason('');
    setNotes('');
    setError(null);
  }, [isOpen, employee]);

  if (!employee) return null;
  const terminating = status === 'Terminated';
  const unchanged = status === employee.employmentStatus;

  const submit = async () => {
    if (unchanged) {
      setError(t('coreHr.employees.statusModal.unchanged'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await employeesApi.changeStatus(employee.id, {
        status,
        terminationDate: terminating ? terminationDate || null : null,
        terminationReason: terminating ? terminationReason.trim() || null : null,
        notes: notes.trim() || null,
      });
      onChanged(updated);
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.employees.statusModal.error')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => (busy ? undefined : onClose())}
      title={t('coreHr.employees.statusModal.title')}
      subtitle={employee.displayName}
      width="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={busy} onClick={onClose}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void submit()}>
            {busy ? t('common.actions.saving') : t('coreHr.employees.statusModal.confirm')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        <SelectField
          label={t('coreHr.employees.statusModal.newStatus')}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={EMPLOYMENT_STATUSES.map((s) => ({ value: s, label: t(`coreHr.employees.status.${s}`) }))}
        />
        {terminating ? (
          <>
            <TextField
              label={t('coreHr.employees.statusModal.terminationDate')}
              type="date"
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
            />
            <TextField
              label={t('coreHr.employees.statusModal.terminationReason')}
              value={terminationReason}
              onChange={(e) => setTerminationReason(e.target.value)}
            />
          </>
        ) : null}
        <TextareaField
          label={t('coreHr.employees.statusModal.notes')}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
    </Modal>
  );
}

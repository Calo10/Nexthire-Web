import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { employeesApi } from '../api/employeesApi';
import type { HrLookupsState } from '../hooks/useHrLookups';
import type { EmployeeDetail } from '../models/employee';
import {
  detailToForm,
  formToRequest,
  validateEmployeeForm,
  type EmployeeFormErrors,
  type EmployeeFormValues,
  type FormSection,
} from '../models/employeeForm';
import { apiErrorMessage } from '../utils/employeeFormat';
import {
  ContactFields,
  EmergencyContactsFields,
  EmploymentFields,
  PersonalFields,
} from './form/EmployeeFormFields';

export type EditableSection = 'personal' | 'contact' | 'emergency' | 'job';

type Props = {
  isOpen: boolean;
  section: EditableSection;
  employee: EmployeeDetail;
  lookups: HrLookupsState;
  canCreateLookups: boolean;
  onClose: () => void;
  onSaved: (updated: EmployeeDetail) => void;
};

const VALIDATION_SECTION: Record<EditableSection, FormSection> = {
  personal: 'personal',
  contact: 'contact',
  emergency: 'contact',
  job: 'employment',
};

export default function EditEmployeeSectionModal({
  isOpen,
  section,
  employee,
  lookups,
  canCreateLookups,
  onClose,
  onSaved,
}: Props) {
  const { t } = useTranslation();
  const [values, setValues] = useState<EmployeeFormValues>(() => detailToForm(employee));
  const [initial, setInitial] = useState<string>('');
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const form = detailToForm(employee);
    setValues(form);
    setInitial(JSON.stringify(form));
    setErrors({});
    setApiError(null);
    setConfirmDiscard(false);
  }, [isOpen, employee, section]);

  const dirty = JSON.stringify(values) !== initial;
  const requestClose = () => {
    if (busy) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const patch = (p: Partial<EmployeeFormValues>) => setValues((v) => ({ ...v, ...p }));

  const save = async () => {
    const found = validateEmployeeForm(values, VALIDATION_SECTION[section]);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    setApiError(null);
    try {
      const body = formToRequest(values, { includeEmergencyContacts: section === 'emergency' });
      const updated = await employeesApi.update(employee.id, body);
      onSaved(updated);
    } catch (err) {
      setApiError(apiErrorMessage(err, t('coreHr.employees.edit.error')));
    } finally {
      setBusy(false);
    }
  };

  const fieldProps = { values, errors, onChange: patch };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={confirmDiscard ? () => undefined : requestClose}
        title={t(`coreHr.employees.edit.sections.${section}`)}
        subtitle={employee.displayName}
        width="md"
        footer={
          <>
            <Button variant="secondary" size="sm" disabled={busy} onClick={requestClose}>
              {t('common.actions.cancel')}
            </Button>
            <Button size="sm" disabled={busy || !dirty} onClick={() => void save()}>
              {busy ? t('common.actions.saving') : t('common.actions.saveChanges')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {apiError ? <ErrorMessage message={apiError} /> : null}
          {section === 'personal' ? <PersonalFields {...fieldProps} /> : null}
          {section === 'contact' ? <ContactFields {...fieldProps} /> : null}
          {section === 'emergency' ? <EmergencyContactsFields {...fieldProps} /> : null}
          {section === 'job' ? (
            <EmploymentFields
              {...fieldProps}
              lookups={lookups}
              canCreateLookups={canCreateLookups}
              excludeManagerId={employee.id}
              managerLabel={employee.managerName}
            />
          ) : null}
        </div>
      </Modal>
      <ConfirmModal
        isOpen={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        tone="danger"
        title={t('coreHr.employees.unsaved.title')}
        description={t('coreHr.employees.unsaved.description')}
        confirmLabel={t('coreHr.employees.unsaved.discard')}
        cancelLabel={t('coreHr.employees.unsaved.keepEditing')}
      />
    </>
  );
}

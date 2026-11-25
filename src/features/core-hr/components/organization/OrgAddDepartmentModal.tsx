import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import TextareaField from '../../../../components/TextareaField';
import { organizationApi } from '../../api/organizationApi';
import type { DepartmentListItem } from '../../models/organization';
import type { HrLookup } from '../../models/employee';
import { apiErrorMessage } from '../../utils/employeeFormat';
import { DEFAULT_DEPT_COLOR, safeColor } from '../../utils/organizationFormat';
import EmployeePicker from '../documents/EmployeePicker';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** When set, the modal edits this department instead of creating one. */
  department?: DepartmentListItem | null;
  /** Flat list used for the parent select. */
  departments: DepartmentListItem[];
  locations: HrLookup[];
  onSaved: (name: string, mode: 'created' | 'updated') => void;
};

export default function OrgAddDepartmentModal({ isOpen, onClose, department, departments, locations, onSaved }: Props) {
  const { t } = useTranslation();
  const editing = !!department;
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(DEFAULT_DEPT_COLOR);
  const [parentId, setParentId] = useState('');
  const [headId, setHeadId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [budget, setBudget] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setName(department?.name ?? '');
    setCode(department?.code ?? '');
    setDescription(department?.description ?? '');
    setColor(safeColor(department?.color));
    setParentId(department?.parentDepartmentId ?? '');
    setHeadId(department?.headEmployeeId ?? '');
    setLocationId(department?.locationId ?? '');
    setBudget(department?.budgetedHeadcount != null ? String(department.budgetedHeadcount) : '');
    setError(null);
    setFieldErrors({});
  }, [isOpen, department]);

  const close = () => {
    if (!busy) onClose();
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t('coreHr.organization.modals.department.nameRequired');
    const budgetValue = budget.trim() === '' ? null : Number(budget);
    if (budgetValue !== null && (!Number.isInteger(budgetValue) || budgetValue < 0)) {
      errs.budget = t('coreHr.organization.modals.department.budgetInvalid');
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const body = {
      name: name.trim(),
      code: code.trim() || null,
      description: description.trim() || null,
      color,
      parentDepartmentId: parentId || null,
      headEmployeeId: headId || null,
      locationId: locationId || null,
      budgetedHeadcount: budgetValue,
    };
    setBusy(true);
    setError(null);
    try {
      if (department) {
        const parentChanged = (department.parentDepartmentId ?? '') !== parentId;
        // Parent is changed through the dedicated move endpoint so the server can validate cycles.
        const { parentDepartmentId: _parent, ...rest } = body;
        void _parent;
        await organizationApi.updateDepartment(department.id, rest);
        if (parentChanged) await organizationApi.moveDepartment(department.id, { newParentDepartmentId: parentId || null });
        onSaved(body.name, 'updated');
      } else {
        await organizationApi.createDepartment(body);
        onSaved(body.name, 'created');
      }
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.organization.modals.department.error')));
    } finally {
      setBusy(false);
    }
  };

  const parentOptions = departments.filter((d) => d.isActive && d.id !== department?.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={editing ? t('coreHr.organization.modals.department.editTitle') : t('coreHr.organization.modals.department.addTitle')}
      width="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={busy} onClick={close}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void submit()}>
            {busy ? t('common.actions.saving') : editing ? t('common.actions.saveChanges') : t('coreHr.organization.modals.department.create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        <TextField
          label={t('coreHr.organization.modals.department.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          disabled={busy}
          maxLength={120}
          required
          autoFocus
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={t('coreHr.organization.modals.department.code')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={busy}
            maxLength={30}
          />
          <div>
            <label htmlFor="org-dept-color" className="mb-2 block text-sm font-medium text-gray-700">
              {t('coreHr.organization.modals.department.color')}
            </label>
            <input
              id="org-dept-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              disabled={busy}
              className="h-12 w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-1 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
        <SelectField
          label={t('coreHr.organization.modals.department.parent')}
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          disabled={busy}
          options={[
            { value: '', label: t('coreHr.organization.modals.department.noParent') },
            ...parentOptions.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />
        <EmployeePicker
          label={t('coreHr.organization.modals.department.head')}
          value={headId}
          onChange={(id) => setHeadId(id)}
          disabled={busy}
          required={false}
          fallbackLabel={department?.headName}
        />
        <SelectField
          label={t('coreHr.organization.modals.department.location')}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          disabled={busy}
          options={[
            { value: '', label: t('common.none') },
            ...locations.filter((l) => l.isActive || l.id === locationId).map((l) => ({ value: l.id, label: l.name })),
          ]}
        />
        <TextField
          label={t('coreHr.organization.modals.department.budget')}
          type="number"
          min={0}
          step={1}
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          error={fieldErrors.budget}
          disabled={busy}
        />
        <TextareaField
          label={t('coreHr.organization.modals.department.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
          maxLength={500}
          rows={3}
        />
      </div>
    </Modal>
  );
}

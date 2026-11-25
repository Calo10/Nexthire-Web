import { useTranslation } from 'react-i18next';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import {
  EMPLOYMENT_STATUSES,
  WORK_MODALITIES,
} from '../../models/employee';
import {
  emptyEmergencyContact,
  type EmployeeFormErrors,
  type EmployeeFormValues,
} from '../../models/employeeForm';
import type { HrLookupsState } from '../../hooks/useHrLookups';
import LookupSelect from './LookupSelect';
import ManagerSelect from './ManagerSelect';

type FieldProps = {
  values: EmployeeFormValues;
  errors: EmployeeFormErrors;
  onChange: (patch: Partial<EmployeeFormValues>) => void;
};

function useErr(errors: EmployeeFormErrors) {
  const { t } = useTranslation();
  return (key: keyof EmployeeFormErrors): string | undefined =>
    errors[key] ? t(`coreHr.employees.validation.${errors[key]}`) : undefined;
}

export function PersonalFields({ values, errors, onChange }: FieldProps) {
  const { t } = useTranslation();
  const err = useErr(errors);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField
        label={t('coreHr.employees.form.firstName')}
        required
        maxLength={100}
        value={values.firstName}
        error={err('firstName')}
        onChange={(e) => onChange({ firstName: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.lastName')}
        required
        maxLength={100}
        value={values.lastName}
        error={err('lastName')}
        onChange={(e) => onChange({ lastName: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.middleName')}
        value={values.middleName}
        onChange={(e) => onChange({ middleName: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.preferredName')}
        value={values.preferredName}
        onChange={(e) => onChange({ preferredName: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.dateOfBirth')}
        type="date"
        value={values.dateOfBirth}
        error={err('dateOfBirth')}
        onChange={(e) => onChange({ dateOfBirth: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.nationality')}
        value={values.nationality}
        onChange={(e) => onChange({ nationality: e.target.value })}
      />
    </div>
  );
}

export function ContactFields({ values, errors, onChange }: FieldProps) {
  const { t } = useTranslation();
  const err = useErr(errors);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <TextField
        label={t('coreHr.employees.form.personalEmail')}
        type="email"
        value={values.personalEmail}
        error={err('personalEmail')}
        onChange={(e) => onChange({ personalEmail: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.personalPhone')}
        type="tel"
        value={values.personalPhone}
        onChange={(e) => onChange({ personalPhone: e.target.value })}
      />
      <div className="sm:col-span-2">
        <TextField
          label={t('coreHr.employees.form.addressLine1')}
          value={values.addressLine1}
          onChange={(e) => onChange({ addressLine1: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <TextField
          label={t('coreHr.employees.form.addressLine2')}
          value={values.addressLine2}
          onChange={(e) => onChange({ addressLine2: e.target.value })}
        />
      </div>
      <TextField
        label={t('coreHr.employees.form.city')}
        value={values.city}
        onChange={(e) => onChange({ city: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.state')}
        value={values.state}
        onChange={(e) => onChange({ state: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.country')}
        value={values.country}
        onChange={(e) => onChange({ country: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.postalCode')}
        value={values.postalCode}
        onChange={(e) => onChange({ postalCode: e.target.value })}
      />
    </div>
  );
}

export function EmergencyContactsFields({ values, errors, onChange }: FieldProps) {
  const { t } = useTranslation();
  const err = useErr(errors);
  const contacts = values.emergencyContacts;

  const update = (index: number, patch: Partial<(typeof contacts)[number]>) =>
    onChange({
      emergencyContacts: contacts.map((c, i) => {
        if (i === index) return { ...c, ...patch };
        // Only one primary contact at a time.
        return patch.isPrimary ? { ...c, isPrimary: false } : c;
      }),
    });

  return (
    <div className="space-y-4">
      {contacts.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
          {t('coreHr.employees.form.emergencyEmpty')}
        </p>
      ) : null}
      {contacts.map((c, index) => (
        <div key={index} className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label={t('coreHr.employees.form.emergencyFullName')}
              required
              value={c.fullName}
              onChange={(e) => update(index, { fullName: e.target.value })}
            />
            <TextField
              label={t('coreHr.employees.form.emergencyRelationship')}
              value={c.relationship}
              onChange={(e) => update(index, { relationship: e.target.value })}
            />
            <TextField
              label={t('coreHr.employees.form.emergencyPhone')}
              type="tel"
              value={c.phone}
              onChange={(e) => update(index, { phone: e.target.value })}
            />
            <TextField
              label={t('coreHr.employees.form.emergencyEmail')}
              type="email"
              value={c.email}
              onChange={(e) => update(index, { email: e.target.value })}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={c.isPrimary}
                onChange={(e) => update(index, { isPrimary: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              {t('coreHr.employees.form.emergencyPrimary')}
            </label>
            <button
              type="button"
              onClick={() => onChange({ emergencyContacts: contacts.filter((_, i) => i !== index) })}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              {t('coreHr.employees.form.emergencyRemove')}
            </button>
          </div>
        </div>
      ))}
      {err('emergencyContacts') ? <p className="text-sm text-red-600">{err('emergencyContacts')}</p> : null}
      <button
        type="button"
        onClick={() => onChange({ emergencyContacts: [...contacts, emptyEmergencyContact(contacts.length === 0)] })}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span aria-hidden>+</span>
        {t('coreHr.employees.form.emergencyAdd')}
      </button>
    </div>
  );
}

type EmploymentFieldProps = FieldProps & {
  lookups: HrLookupsState;
  canCreateLookups: boolean;
  /** Show employment status (create only; edits use the Change status flow). */
  showStatus?: boolean;
  excludeManagerId?: string;
  managerLabel?: string | null;
  onManagerLabelChange?: (label: string) => void;
};

export function EmploymentFields({
  values,
  errors,
  onChange,
  lookups,
  canCreateLookups,
  showStatus = false,
  excludeManagerId,
  managerLabel,
  onManagerLabelChange,
}: EmploymentFieldProps) {
  const { t } = useTranslation();
  const err = useErr(errors);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <TextField
          label={t('coreHr.employees.form.employeeNumber')}
          maxLength={50}
          value={values.employeeNumber}
          error={err('employeeNumber')}
          placeholder={t('coreHr.employees.form.employeeNumberAuto')}
          onChange={(e) => onChange({ employeeNumber: e.target.value })}
        />
      </div>
      <TextField
        label={t('coreHr.employees.form.hireDate')}
        type="date"
        value={values.hireDate}
        onChange={(e) => onChange({ hireDate: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.workEmail')}
        type="email"
        value={values.workEmail}
        error={err('workEmail')}
        onChange={(e) => onChange({ workEmail: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.workPhone')}
        type="tel"
        value={values.workPhone}
        onChange={(e) => onChange({ workPhone: e.target.value })}
      />
      <LookupSelect
        label={t('coreHr.employees.form.department')}
        value={values.departmentId}
        options={lookups.departments}
        onChange={(id) => onChange({ departmentId: id })}
        onCreate={canCreateLookups ? lookups.addDepartment : undefined}
      />
      <LookupSelect
        label={t('coreHr.employees.form.jobTitle')}
        value={values.jobTitleId}
        options={lookups.jobTitles}
        onChange={(id) => onChange({ jobTitleId: id })}
        onCreate={canCreateLookups ? lookups.addJobTitle : undefined}
      />
      <ManagerSelect
        label={t('coreHr.employees.form.manager')}
        value={values.managerId}
        selectedLabel={managerLabel}
        excludeId={excludeManagerId}
        onChange={(id, label) => {
          onChange({ managerId: id });
          onManagerLabelChange?.(label);
        }}
      />
      <LookupSelect
        label={t('coreHr.employees.form.workLocation')}
        value={values.workLocationId}
        options={lookups.locations}
        onChange={(id) => onChange({ workLocationId: id })}
        onCreate={canCreateLookups ? lookups.addLocation : undefined}
      />
      <LookupSelect
        label={t('coreHr.employees.form.employmentType')}
        value={values.employmentTypeId}
        options={lookups.employmentTypes}
        onChange={(id) => onChange({ employmentTypeId: id })}
      />
      <SelectField
        label={t('coreHr.employees.form.workModality')}
        value={values.workModality}
        onChange={(e) => onChange({ workModality: e.target.value })}
        options={[
          { value: '', label: t('coreHr.employees.form.selectPlaceholder') },
          ...WORK_MODALITIES.map((m) => ({ value: m, label: t(`coreHr.employees.modality.${m}`) })),
        ]}
      />
      {showStatus ? (
        <SelectField
          label={t('coreHr.employees.form.employmentStatus')}
          value={values.employmentStatus}
          onChange={(e) => onChange({ employmentStatus: e.target.value })}
          options={EMPLOYMENT_STATUSES.map((s) => ({ value: s, label: t(`coreHr.employees.status.${s}`) }))}
        />
      ) : null}
      <TextField
        label={t('coreHr.employees.form.probationEndDate')}
        type="date"
        value={values.probationEndDate}
        onChange={(e) => onChange({ probationEndDate: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.contractStartDate')}
        type="date"
        value={values.contractStartDate}
        onChange={(e) => onChange({ contractStartDate: e.target.value })}
      />
      <TextField
        label={t('coreHr.employees.form.contractEndDate')}
        type="date"
        value={values.contractEndDate}
        error={err('contractEndDate')}
        onChange={(e) => onChange({ contractEndDate: e.target.value })}
      />
    </div>
  );
}

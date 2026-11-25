import type { EmergencyContact, EmployeeDetail, EmployeeRequest } from './employee';

export type EmergencyContactForm = {
  id?: string | null;
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
};

/** String-based form state (inputs are always strings; blanks are mapped to null on submit). */
export type EmployeeFormValues = {
  employeeNumber: string;
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  nationality: string;
  personalEmail: string;
  personalPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  workEmail: string;
  workPhone: string;
  jobTitleId: string;
  departmentId: string;
  managerId: string;
  employmentTypeId: string;
  employmentStatus: string;
  hireDate: string;
  workLocationId: string;
  workModality: string;
  probationEndDate: string;
  contractStartDate: string;
  contractEndDate: string;
  emergencyContacts: EmergencyContactForm[];
};

export type EmployeeFormErrors = Partial<Record<keyof EmployeeFormValues | 'emergencyContacts', string>>;

export function emptyEmployeeForm(): EmployeeFormValues {
  return {
    employeeNumber: '',
    firstName: '',
    middleName: '',
    lastName: '',
    preferredName: '',
    dateOfBirth: '',
    nationality: '',
    personalEmail: '',
    personalPhone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    workEmail: '',
    workPhone: '',
    jobTitleId: '',
    departmentId: '',
    managerId: '',
    employmentTypeId: '',
    employmentStatus: 'Active',
    hireDate: '',
    workLocationId: '',
    workModality: '',
    probationEndDate: '',
    contractStartDate: '',
    contractEndDate: '',
    emergencyContacts: [],
  };
}

export function emptyEmergencyContact(isPrimary = false): EmergencyContactForm {
  return { fullName: '', relationship: '', phone: '', email: '', isPrimary };
}

/** `2025-01-15T00:00:00` → `2025-01-15` for `<input type="date">`. */
export function toDateInput(value?: string | null): string {
  if (!value) return '';
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return m ? m[1] : '';
}

export function detailToForm(d: EmployeeDetail): EmployeeFormValues {
  return {
    employeeNumber: d.employeeNumber ?? '',
    firstName: d.firstName ?? '',
    middleName: d.middleName ?? '',
    lastName: d.lastName ?? '',
    preferredName: d.preferredName ?? '',
    dateOfBirth: toDateInput(d.dateOfBirth),
    nationality: d.nationality ?? '',
    personalEmail: d.personalEmail ?? '',
    personalPhone: d.personalPhone ?? '',
    addressLine1: d.addressLine1 ?? '',
    addressLine2: d.addressLine2 ?? '',
    city: d.city ?? '',
    state: d.state ?? '',
    country: d.country ?? '',
    postalCode: d.postalCode ?? '',
    workEmail: d.workEmail ?? '',
    workPhone: d.workPhone ?? '',
    jobTitleId: d.jobTitleId ?? '',
    departmentId: d.departmentId ?? '',
    managerId: d.managerId ?? '',
    employmentTypeId: d.employmentTypeId ?? '',
    employmentStatus: d.employmentStatus ?? 'Active',
    hireDate: toDateInput(d.hireDate),
    workLocationId: d.workLocationId ?? '',
    workModality: d.workModality ?? '',
    probationEndDate: toDateInput(d.probationEndDate),
    contractStartDate: toDateInput(d.contractStartDate),
    contractEndDate: toDateInput(d.contractEndDate),
    emergencyContacts: (d.emergencyContacts ?? []).map((c) => ({
      id: c.id ?? null,
      fullName: c.fullName ?? '',
      relationship: c.relationship ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      isPrimary: !!c.isPrimary,
    })),
  };
}

const blankToNull = (v: string): string | null => {
  const t = v.trim();
  return t ? t : null;
};

function contactsToRequest(contacts: EmergencyContactForm[]): EmergencyContact[] {
  return contacts
    .filter((c) => c.fullName.trim() || c.phone.trim() || c.email.trim() || c.relationship.trim())
    .map((c) => ({
      id: c.id ?? null,
      fullName: c.fullName.trim(),
      relationship: blankToNull(c.relationship),
      phone: blankToNull(c.phone),
      email: blankToNull(c.email),
      isPrimary: c.isPrimary,
    }));
}

/**
 * Builds the API body. The PUT endpoint replaces the whole record, so edit flows always pass the full form.
 * Emergency contacts are only sent when `includeEmergencyContacts` is true (omitted = left untouched by the API).
 */
export function formToRequest(
  f: EmployeeFormValues,
  options: { includeEmergencyContacts?: boolean } = {},
): EmployeeRequest {
  const includeContacts = options.includeEmergencyContacts ?? true;
  return {
    employeeNumber: blankToNull(f.employeeNumber),
    firstName: f.firstName.trim(),
    middleName: blankToNull(f.middleName),
    lastName: f.lastName.trim(),
    preferredName: blankToNull(f.preferredName),
    dateOfBirth: blankToNull(f.dateOfBirth),
    nationality: blankToNull(f.nationality),
    personalEmail: blankToNull(f.personalEmail),
    personalPhone: blankToNull(f.personalPhone),
    addressLine1: blankToNull(f.addressLine1),
    addressLine2: blankToNull(f.addressLine2),
    city: blankToNull(f.city),
    state: blankToNull(f.state),
    country: blankToNull(f.country),
    postalCode: blankToNull(f.postalCode),
    workEmail: blankToNull(f.workEmail),
    workPhone: blankToNull(f.workPhone),
    jobTitleId: blankToNull(f.jobTitleId),
    departmentId: blankToNull(f.departmentId),
    managerId: blankToNull(f.managerId),
    employmentTypeId: blankToNull(f.employmentTypeId),
    employmentStatus: blankToNull(f.employmentStatus),
    hireDate: blankToNull(f.hireDate),
    workLocationId: blankToNull(f.workLocationId),
    workModality: blankToNull(f.workModality),
    probationEndDate: blankToNull(f.probationEndDate),
    contractStartDate: blankToNull(f.contractStartDate),
    contractEndDate: blankToNull(f.contractEndDate),
    emergencyContacts: includeContacts ? contactsToRequest(f.emergencyContacts) : null,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());

export type FormSection = 'personal' | 'employment' | 'contact';

/**
 * Client-side validation mirroring `EmployeeValidation.ValidateEmployee` on the API.
 * Returned values are i18n keys under `coreHr.employees.validation.*`.
 */
export function validateEmployeeForm(f: EmployeeFormValues, section: FormSection | 'all'): EmployeeFormErrors {
  const errors: EmployeeFormErrors = {};
  const all = section === 'all';
  const today = new Date().toISOString().slice(0, 10);

  if (all || section === 'personal') {
    if (!f.firstName.trim()) errors.firstName = 'firstNameRequired';
    else if (f.firstName.trim().length > 100) errors.firstName = 'tooLong100';
    if (!f.lastName.trim()) errors.lastName = 'lastNameRequired';
    else if (f.lastName.trim().length > 100) errors.lastName = 'tooLong100';
    if (f.dateOfBirth && f.dateOfBirth > today) errors.dateOfBirth = 'dobFuture';
  }

  if (all || section === 'employment') {
    if (f.workEmail.trim() && !isValidEmail(f.workEmail)) errors.workEmail = 'emailInvalid';
    if (f.employeeNumber.trim().length > 50) errors.employeeNumber = 'tooLong50';
    if (f.contractStartDate && f.contractEndDate && f.contractEndDate < f.contractStartDate) {
      errors.contractEndDate = 'contractEndBeforeStart';
    }
  }

  if (all || section === 'contact') {
    if (f.personalEmail.trim() && !isValidEmail(f.personalEmail)) errors.personalEmail = 'emailInvalid';
    const bad = f.emergencyContacts.some((c) => {
      const touched = c.fullName.trim() || c.phone.trim() || c.email.trim() || c.relationship.trim();
      return touched && (!c.fullName.trim() || (c.email.trim() && !isValidEmail(c.email)));
    });
    if (bad) errors.emergencyContacts = 'emergencyInvalid';
  }

  return errors;
}

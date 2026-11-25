import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import SelectField from '../../../components/SelectField';
import TextField from '../../../components/TextField';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { employeesApi } from '../api/employeesApi';
import type { HrLookupsState } from '../hooks/useHrLookups';
import { DOCUMENT_CATEGORIES, type EmployeeDetail } from '../models/employee';
import {
  emptyEmployeeForm,
  formToRequest,
  validateEmployeeForm,
  type EmployeeFormErrors,
  type EmployeeFormValues,
  type FormSection,
} from '../models/employeeForm';
import { apiErrorMessage, formatDate, isSafeUrl } from '../utils/employeeFormat';
import {
  ContactFields,
  EmergencyContactsFields,
  EmploymentFields,
  PersonalFields,
} from './form/EmployeeFormFields';

const STEPS = ['personal', 'employment', 'contact', 'documents', 'review'] as const;
type Step = (typeof STEPS)[number];

type DraftDocument = { category: string; name: string; externalUrl: string; expiresAt: string };

const emptyDoc = (): DraftDocument => ({
  category: DOCUMENT_CATEGORIES[0],
  name: '',
  externalUrl: '',
  expiresAt: '',
});

type Props = {
  isOpen: boolean;
  onClose: () => void;
  lookups: HrLookupsState;
  canCreateLookups: boolean;
  canManageDocuments: boolean;
  /** `documentFailures` counts documents that could not be saved after the employee was created. */
  onCreated: (employee: EmployeeDetail, documentFailures: number) => void;
};

const STEP_SECTION: Partial<Record<Step, FormSection>> = {
  personal: 'personal',
  employment: 'employment',
  contact: 'contact',
};

export default function AddEmployeeWizard({
  isOpen,
  onClose,
  lookups,
  canCreateLookups,
  canManageDocuments,
  onCreated,
}: Props) {
  const { t, i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<EmployeeFormValues>(emptyEmployeeForm);
  const [managerLabel, setManagerLabel] = useState('');
  const [docs, setDocs] = useState<DraftDocument[]>([]);
  const [docDraft, setDocDraft] = useState<DraftDocument>(emptyDoc);
  const [docError, setDocError] = useState<string | null>(null);
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Reset whenever the wizard is (re)opened.
  useEffect(() => {
    if (!isOpen) return;
    setStepIndex(0);
    setValues(emptyEmployeeForm());
    setManagerLabel('');
    setDocs([]);
    setDocDraft(emptyDoc());
    setDocError(null);
    setErrors({});
    setApiError(null);
    setConfirmDiscard(false);
  }, [isOpen]);

  const dirty = useMemo(
    () =>
      JSON.stringify(values) !== JSON.stringify(emptyEmployeeForm()) ||
      docs.length > 0 ||
      docDraft.name.trim() !== '' ||
      docDraft.externalUrl.trim() !== '',
    [values, docs, docDraft],
  );

  const steps: readonly Step[] = canManageDocuments ? STEPS : STEPS.filter((s) => s !== 'documents');
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  const requestClose = () => {
    if (submitting) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const patch = (p: Partial<EmployeeFormValues>) => {
    setValues((v) => ({ ...v, ...p }));
    // Clear errors for the fields being edited.
    setErrors((e) => {
      const next = { ...e };
      for (const k of Object.keys(p)) delete next[k as keyof EmployeeFormErrors];
      if (p.emergencyContacts) delete next.emergencyContacts;
      return next;
    });
  };

  const validateStep = (s: Step): boolean => {
    const section = STEP_SECTION[s];
    if (!section) return true;
    const found = validateEmployeeForm(values, section);
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setApiError(null);
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const back = () => {
    setApiError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  const addDoc = () => {
    if (!docDraft.name.trim()) {
      setDocError(t('coreHr.employees.documents.nameRequired'));
      return;
    }
    if (docDraft.externalUrl.trim() && !isSafeUrl(docDraft.externalUrl.trim())) {
      setDocError(t('coreHr.employees.documents.urlInvalid'));
      return;
    }
    setDocs((d) => [...d, { ...docDraft, name: docDraft.name.trim(), externalUrl: docDraft.externalUrl.trim() }]);
    setDocDraft(emptyDoc());
    setDocError(null);
  };

  const submit = async () => {
    // Validate everything; jump back to the first step with problems.
    for (const s of steps) {
      if (!STEP_SECTION[s]) continue;
      const found = validateEmployeeForm(values, STEP_SECTION[s]!);
      if (Object.keys(found).length > 0) {
        setErrors(found);
        setStepIndex(steps.indexOf(s));
        return;
      }
    }
    setSubmitting(true);
    setApiError(null);
    try {
      const created = await employeesApi.create(formToRequest(values));
      let failures = 0;
      for (const d of docs) {
        try {
          await employeesApi.addDocument(created.id, {
            category: d.category,
            name: d.name,
            externalUrl: d.externalUrl || null,
            expiresAt: d.expiresAt || null,
          });
        } catch {
          failures += 1;
        }
      }
      onCreated(created, failures);
    } catch (err) {
      setApiError(apiErrorMessage(err, t('coreHr.employees.wizard.createError')));
    } finally {
      setSubmitting(false);
    }
  };

  const lookupName = (list: { id: string; name: string }[], id: string) =>
    list.find((x) => x.id === id)?.name || '—';
  const dash = (v: string) => (v.trim() ? v : '—');

  const reviewRows: { section: string; rows: [string, string][] }[] = [
    {
      section: 'personal',
      rows: [
        [t('coreHr.employees.form.firstName'), dash(values.firstName)],
        [t('coreHr.employees.form.middleName'), dash(values.middleName)],
        [t('coreHr.employees.form.lastName'), dash(values.lastName)],
        [t('coreHr.employees.form.preferredName'), dash(values.preferredName)],
        [t('coreHr.employees.form.dateOfBirth'), values.dateOfBirth ? formatDate(values.dateOfBirth, i18n.language) : '—'],
        [t('coreHr.employees.form.nationality'), dash(values.nationality)],
      ],
    },
    {
      section: 'employment',
      rows: [
        [t('coreHr.employees.form.employeeNumber'), values.employeeNumber.trim() || t('coreHr.employees.form.employeeNumberAuto')],
        [t('coreHr.employees.form.workEmail'), dash(values.workEmail)],
        [t('coreHr.employees.form.department'), lookupName(lookups.departments, values.departmentId)],
        [t('coreHr.employees.form.jobTitle'), lookupName(lookups.jobTitles, values.jobTitleId)],
        [t('coreHr.employees.form.manager'), managerLabel || '—'],
        [t('coreHr.employees.form.workLocation'), lookupName(lookups.locations, values.workLocationId)],
        [t('coreHr.employees.form.employmentType'), lookupName(lookups.employmentTypes, values.employmentTypeId)],
        [t('coreHr.employees.form.employmentStatus'), t(`coreHr.employees.status.${values.employmentStatus}`)],
        [t('coreHr.employees.form.hireDate'), values.hireDate ? formatDate(values.hireDate, i18n.language) : '—'],
        [
          t('coreHr.employees.form.workModality'),
          values.workModality ? t(`coreHr.employees.modality.${values.workModality}`) : '—',
        ],
      ],
    },
    {
      section: 'contact',
      rows: [
        [t('coreHr.employees.form.personalEmail'), dash(values.personalEmail)],
        [t('coreHr.employees.form.personalPhone'), dash(values.personalPhone)],
        [
          t('coreHr.employees.form.addressLine1'),
          dash([values.addressLine1, values.city, values.state, values.country].filter((x) => x.trim()).join(', ')),
        ],
        [
          t('coreHr.employees.wizard.steps.emergency'),
          values.emergencyContacts.filter((c) => c.fullName.trim()).map((c) => c.fullName.trim()).join(', ') || '—',
        ],
      ],
    },
  ];

  const fieldProps = { values, errors, onChange: patch };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={confirmDiscard ? () => undefined : requestClose}
        title={t('coreHr.employees.wizard.title')}
        subtitle={t(`coreHr.employees.wizard.steps.${step}`)}
        width="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="secondary" size="sm" disabled={submitting} onClick={requestClose}>
              {t('common.actions.cancel')}
            </Button>
            <div className="flex items-center gap-2">
              {step === 'documents' ? (
                <Button variant="outline" size="sm" disabled={submitting} onClick={next}>
                  {t('coreHr.employees.wizard.skip')}
                </Button>
              ) : null}
              {stepIndex > 0 ? (
                <Button variant="outline" size="sm" disabled={submitting} onClick={back}>
                  {t('coreHr.employees.wizard.back')}
                </Button>
              ) : null}
              {isLast ? (
                <Button size="sm" disabled={submitting} onClick={() => void submit()}>
                  {submitting ? t('common.actions.creating') : t('coreHr.employees.wizard.create')}
                </Button>
              ) : (
                <Button size="sm" onClick={next}>
                  {t('coreHr.employees.wizard.next')}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {/* Stepper */}
        <ol className="mb-6 flex items-center gap-2" aria-label={t('coreHr.employees.wizard.title')}>
          {steps.map((s, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <li key={s} className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    current
                      ? 'bg-teal-600 text-white'
                      : done
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                  aria-current={current ? 'step' : undefined}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span
                  className={`hidden truncate text-xs font-medium sm:block ${current ? 'text-dark-text' : 'text-gray-500'}`}
                >
                  {t(`coreHr.employees.wizard.steps.${s}`)}
                </span>
                {i < steps.length - 1 ? <span className="h-px flex-1 bg-gray-200" /> : null}
              </li>
            );
          })}
        </ol>

        <div className="space-y-4">
          {apiError ? <ErrorMessage message={apiError} /> : null}

          {step === 'personal' ? <PersonalFields {...fieldProps} /> : null}

          {step === 'employment' ? (
            <EmploymentFields
              {...fieldProps}
              lookups={lookups}
              canCreateLookups={canCreateLookups}
              showStatus
              managerLabel={managerLabel}
              onManagerLabelChange={setManagerLabel}
            />
          ) : null}

          {step === 'contact' ? (
            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  {t('coreHr.employees.wizard.contactInfo')}
                </h3>
                <ContactFields {...fieldProps} />
              </section>
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  {t('coreHr.employees.wizard.steps.emergency')}
                </h3>
                <EmergencyContactsFields {...fieldProps} />
              </section>
            </div>
          ) : null}

          {step === 'documents' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t('coreHr.employees.wizard.documentsHint')}</p>
              {docs.length > 0 ? (
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
                  {docs.map((d, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-dark-text">{d.name}</p>
                        <p className="text-xs text-gray-500">
                          {t(`coreHr.employees.documents.categories.${d.category}`)}
                          {d.expiresAt
                            ? ` · ${t('coreHr.employees.documents.expiresOn', { date: formatDate(d.expiresAt, i18n.language) })}`
                            : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDocs((list) => list.filter((_, idx) => idx !== i))}
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        {t('coreHr.employees.documents.remove')}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                {docError ? <ErrorMessage message={docError} className="mb-3" /> : null}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SelectField
                    label={t('coreHr.employees.documents.category')}
                    value={docDraft.category}
                    onChange={(e) => setDocDraft({ ...docDraft, category: e.target.value })}
                    options={DOCUMENT_CATEGORIES.map((c) => ({
                      value: c,
                      label: t(`coreHr.employees.documents.categories.${c}`),
                    }))}
                  />
                  <TextField
                    label={t('coreHr.employees.documents.name')}
                    value={docDraft.name}
                    onChange={(e) => setDocDraft({ ...docDraft, name: e.target.value })}
                  />
                  <TextField
                    label={t('coreHr.employees.documents.url')}
                    type="url"
                    placeholder={t('common.placeholders.url')}
                    value={docDraft.externalUrl}
                    onChange={(e) => setDocDraft({ ...docDraft, externalUrl: e.target.value })}
                  />
                  <TextField
                    label={t('coreHr.employees.documents.expiresAt')}
                    type="date"
                    value={docDraft.expiresAt}
                    onChange={(e) => setDocDraft({ ...docDraft, expiresAt: e.target.value })}
                  />
                </div>
                <div className="mt-3">
                  <Button size="sm" variant="outline" onClick={addDoc}>
                    {t('coreHr.employees.wizard.addDocument')}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {step === 'review' ? (
            <div className="space-y-5">
              <p className="text-sm text-gray-600">{t('coreHr.employees.wizard.reviewHint')}</p>
              {reviewRows.map((block) => (
                <section key={block.section} className="rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                    <h3 className="text-sm font-semibold text-dark-text">
                      {t(`coreHr.employees.wizard.steps.${block.section}`)}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStepIndex(steps.indexOf(block.section as Step))}
                      className="text-sm font-medium text-teal-700 hover:text-teal-800"
                    >
                      {t('common.actions.edit')}
                    </button>
                  </div>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
                    {block.rows.map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
                        <dd className="mt-0.5 break-words text-sm text-dark-text">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
              {canManageDocuments ? (
                <section className="rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-dark-text">{t('coreHr.employees.wizard.steps.documents')}</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {docs.length === 0
                      ? t('coreHr.employees.wizard.noDocuments')
                      : t('coreHr.employees.wizard.documentsCount', { count: docs.length })}
                  </p>
                </section>
              ) : null}
            </div>
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

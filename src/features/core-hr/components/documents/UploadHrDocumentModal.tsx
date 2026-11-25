import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import SelectField from '../../../../components/SelectField';
import TextField from '../../../../components/TextField';
import { hrDocumentsApi } from '../../api/hrDocumentsApi';
import { DOCUMENT_CATEGORIES } from '../../models/employee';
import { apiErrorMessage, isSafeUrl } from '../../utils/employeeFormat';
import EmployeePicker from './EmployeePicker';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-selects an employee (e.g. from the By Employee tab). */
  defaultEmployeeId?: string;
  defaultCategory?: string;
  onUploaded: (name: string) => void;
};

type Mode = 'file' | 'url';

export default function UploadHrDocumentModal({ isOpen, onClose, defaultEmployeeId, defaultCategory, onUploaded }: Props) {
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState('');
  const [category, setCategory] = useState<string>(DOCUMENT_CATEGORIES[0]);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setEmployeeId(defaultEmployeeId ?? '');
    setCategory(defaultCategory && (DOCUMENT_CATEGORIES as readonly string[]).includes(defaultCategory) ? defaultCategory : DOCUMENT_CATEGORIES[0]);
    setName('');
    setMode('file');
    setFile(null);
    setUrl('');
    setExpiresAt('');
    setError(null);
    setFieldErrors({});
  }, [isOpen, defaultEmployeeId, defaultCategory]);

  const close = () => {
    if (!busy) onClose();
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    if (!employeeId) errs.employee = t('coreHr.documentsHub.upload.employeeRequired');
    const finalName = name.trim() || (mode === 'file' && file ? file.name.replace(/\.[^.]+$/, '') : '');
    if (!finalName) errs.name = t('coreHr.employees.documents.nameRequired');
    if (mode === 'file') {
      if (!file) errs.file = t('coreHr.documentsHub.upload.fileRequired');
      else if (file.size > MAX_FILE_BYTES) errs.file = t('coreHr.documentsHub.upload.fileTooLarge');
    } else if (!isSafeUrl(url.trim())) {
      errs.url = t('coreHr.employees.documents.urlInvalid');
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setBusy(true);
    setError(null);
    try {
      if (mode === 'file' && file) {
        await hrDocumentsApi.upload({ employeeId, category, name: finalName, file, expiresAt: expiresAt || null });
      } else {
        await hrDocumentsApi.create({
          employeeId,
          category,
          name: finalName,
          externalUrl: url.trim(),
          expiresAt: expiresAt || null,
        });
      }
      onUploaded(finalName);
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.documentsHub.upload.error')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t('coreHr.documentsHub.upload.title')}
      width="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={busy} onClick={close}>
            {t('common.actions.cancel')}
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void submit()}>
            {busy ? t('coreHr.documentsHub.upload.uploading') : t('coreHr.documentsHub.upload.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorMessage message={error} /> : null}
        <EmployeePicker
          label={t('coreHr.documentsHub.upload.employee')}
          value={employeeId}
          onChange={(id) => setEmployeeId(id)}
          error={fieldErrors.employee}
          disabled={busy}
        />
        <SelectField
          label={t('coreHr.employees.documents.category')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={busy}
          options={DOCUMENT_CATEGORIES.map((c) => ({
            value: c,
            label: t(`coreHr.employees.documents.categories.${c}`, { defaultValue: c }),
          }))}
        />
        <TextField
          label={t('coreHr.employees.documents.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          disabled={busy}
          maxLength={200}
        />

        <div>
          <div className="mb-2 flex rounded-lg bg-gray-100 p-1" role="tablist">
            {(['file', 'url'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === m ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-600 hover:text-dark-text'
                }`}
              >
                {t(`coreHr.documentsHub.upload.mode.${m}`)}
              </button>
            ))}
          </div>
          {mode === 'file' ? (
            <div>
              <input
                type="file"
                disabled={busy}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                aria-label={t('coreHr.documentsHub.upload.file')}
                accept=".pdf,.doc,.docx"
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-teal-800 hover:file:bg-teal-100"
              />
              <p className="mt-1 text-xs text-gray-500">{t('coreHr.documentsHub.upload.fileHint')}</p>
              {fieldErrors.file ? <p className="mt-1 text-sm text-red-600">{fieldErrors.file}</p> : null}
            </div>
          ) : (
            <TextField
              label={t('coreHr.employees.documents.url')}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              error={fieldErrors.url}
              disabled={busy}
              placeholder="https://"
            />
          )}
        </div>

        <TextField
          label={t('coreHr.employees.documents.expiresAt')}
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          disabled={busy}
        />
      </div>
    </Modal>
  );
}

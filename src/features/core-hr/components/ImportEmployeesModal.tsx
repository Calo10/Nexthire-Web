import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import Modal from '../../../components/Modal';
import SuccessMessage from '../../../components/SuccessMessage';
import { employeesApi } from '../api/employeesApi';
import { EMPLOYEE_IMPORT_COLUMNS, type EmployeeImportResult } from '../models/employee';
import { buildCsvPreview, importTemplateCsv, type CsvPreview } from '../utils/csvPreview';
import { apiErrorMessage, downloadBlob } from '../utils/employeeFormat';

const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** Called after a successful import that created at least one employee. */
  onImported: (result: EmployeeImportResult) => void;
};

export default function ImportEmployeesModal({ isOpen, onClose, onImported }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EmployeeImportResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFile(null);
    setPreview(null);
    setError(null);
    setResult(null);
    setBusy(false);
  }, [isOpen]);

  const downloadTemplate = () => {
    downloadBlob(new Blob([importTemplateCsv()], { type: 'text/csv;charset=utf-8' }), 'employees-import-template.csv');
  };

  const pick = async (picked: File | null) => {
    setResult(null);
    setError(null);
    setPreview(null);
    setFile(null);
    if (!picked) return;
    if (picked.size > MAX_BYTES) {
      setError(t('coreHr.employees.import.tooLarge'));
      return;
    }
    if (!/\.csv$/i.test(picked.name) && picked.type && !picked.type.includes('csv') && !picked.type.includes('text')) {
      setError(t('coreHr.employees.import.notCsv'));
      return;
    }
    try {
      const text = await picked.text();
      setPreview(buildCsvPreview(text));
      setFile(picked);
    } catch {
      setError(t('coreHr.employees.import.readError'));
    }
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await employeesApi.importCsv(file);
      setResult(res);
      if (res.created > 0) onImported(res);
    } catch (err) {
      setError(apiErrorMessage(err, t('coreHr.employees.import.error')));
    } finally {
      setBusy(false);
    }
  };

  const blocked = !!preview && (preview.missingRequired.length > 0 || preview.totalRows === 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => (busy ? undefined : onClose())}
      title={t('coreHr.employees.import.title')}
      subtitle={t('coreHr.employees.import.subtitle')}
      width="lg"
      footer={
        result ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setResult(null);
                setFile(null);
                setPreview(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              {t('coreHr.employees.import.importAnother')}
            </Button>
            <Button size="sm" onClick={onClose}>
              {t('common.actions.close')}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" disabled={busy} onClick={onClose}>
              {t('common.actions.cancel')}
            </Button>
            <Button size="sm" disabled={busy || !file || blocked} onClick={() => void submit()}>
              {busy ? t('coreHr.employees.import.importing') : t('coreHr.employees.import.submit')}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        {error ? <ErrorMessage message={error} /> : null}

        {result ? (
          <div className="space-y-4">
            {result.created > 0 ? (
              <SuccessMessage message={t('coreHr.employees.import.successMessage', { count: result.created })} />
            ) : (
              <ErrorMessage message={t('coreHr.employees.import.nothingImported')} />
            )}
            <div className="grid grid-cols-3 gap-3">
              {[
                ['totalRows', result.totalRows, 'text-dark-text'],
                ['created', result.created, 'text-emerald-700'],
                ['skipped', result.skipped, 'text-amber-700'],
              ].map(([key, value, color]) => (
                <div key={key as string} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                    {t(`coreHr.employees.import.summary.${key}`)}
                  </p>
                </div>
              ))}
            </div>
            {result.errors.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-dark-text">
                  {t('coreHr.employees.import.errorsTitle', { count: result.errors.length })}
                </h3>
                <div className="max-h-56 overflow-y-auto rounded-xl border border-red-100 bg-red-50/40">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-red-50 text-left text-xs uppercase text-red-700">
                      <tr>
                        <th className="px-3 py-2 font-semibold">{t('coreHr.employees.import.row')}</th>
                        <th className="px-3 py-2 font-semibold">{t('coreHr.employees.import.message')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {result.errors.map((e, i) => (
                        <tr key={`${e.rowNumber}-${i}`}>
                          <td className="whitespace-nowrap px-3 py-2 font-medium text-red-800">{e.rowNumber}</td>
                          <td className="px-3 py-2 text-red-900">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-teal-900">
              <p>{t('coreHr.employees.import.instructions')}</p>
              <p className="mt-2 font-mono text-xs text-teal-800">{EMPLOYEE_IMPORT_COLUMNS.join(', ')}</p>
              <p className="mt-2 text-xs text-teal-800">{t('coreHr.employees.import.requiredHint')}</p>
              <button
                type="button"
                onClick={downloadTemplate}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-800 underline hover:text-teal-900"
              >
                {t('coreHr.employees.import.downloadTemplate')}
              </button>
            </div>

            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-8 text-center transition-colors hover:border-teal-400 hover:bg-teal-50/30"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void pick(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm font-medium text-dark-text">
                {file ? file.name : t('coreHr.employees.import.chooseFile')}
              </span>
              <span className="mt-1 text-xs text-gray-500">{t('coreHr.employees.import.fileHint')}</span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => void pick(e.target.files?.[0] ?? null)}
              />
            </label>

            {preview ? (
              <div className="space-y-3">
                {preview.missingRequired.length > 0 ? (
                  <ErrorMessage
                    message={t('coreHr.employees.import.missingColumns', { columns: preview.missingRequired.join(', ') })}
                  />
                ) : preview.totalRows === 0 ? (
                  <ErrorMessage message={t('coreHr.employees.import.noRows')} />
                ) : (
                  <p className="text-sm text-gray-700">
                    {t('coreHr.employees.import.previewSummary', { count: preview.totalRows })}
                  </p>
                )}
                {preview.unknownColumns.length > 0 ? (
                  <p className="text-xs text-amber-700">
                    {t('coreHr.employees.import.unknownColumns', { columns: preview.unknownColumns.join(', ') })}
                  </p>
                ) : null}
                {preview.rows.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 text-left uppercase text-gray-500">
                        <tr>
                          {preview.headers.map((h, i) => (
                            <th key={i} className="whitespace-nowrap px-3 py-2 font-semibold">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.rows.map((r, ri) => (
                          <tr key={ri}>
                            {preview.headers.map((_, ci) => (
                              <td key={ci} className="whitespace-nowrap px-3 py-2 text-gray-700">
                                {r[ci] ?? ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}

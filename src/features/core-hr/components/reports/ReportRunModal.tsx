import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../../components/Button';
import ErrorMessage from '../../../../components/ErrorMessage';
import Modal from '../../../../components/Modal';
import { hrReportsApi } from '../../api/hrReportsApi';
import { EMPTY_REPORT_CONFIG, type ReportConfiguration, type ReportDefinition, type ReportExecutionResult } from '../../models/hrReports';
import { apiErrorMessage } from '../../utils/employeeFormat';
import { parseJson } from '../../utils/hrReportsFormat';
import ReportResultView from './ReportResultView';

type Props = {
  report: ReportDefinition | null;
  onClose: () => void;
  canExport: boolean;
  exporting: boolean;
  onExport: (report: ReportDefinition) => void;
};

/** Executes a saved report and shows its result. */
export default function ReportRunModal({ report, onClose, canExport, exporting, onExport }: Props) {
  const { t } = useTranslation();
  const [result, setResult] = useState<ReportExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const id = report?.id;
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    hrReportsApi
      .execute(id)
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(apiErrorMessage(err, t('coreHr.reports.library.runError')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, attempt, t]);

  const config: ReportConfiguration = report ? { ...EMPTY_REPORT_CONFIG, ...parseJson<Partial<ReportConfiguration>>(report.configurationJson, {}) } : EMPTY_REPORT_CONFIG;
  const viz = report ? parseJson<{ chartType?: ReportConfiguration['chartType'] }>(report.visualizationJson, {}) : {};

  return (
    <Modal
      isOpen={!!report}
      onClose={onClose}
      title={report?.name ?? ''}
      subtitle={report?.description ?? undefined}
      width="2xl"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.actions.close')}
          </Button>
          {canExport && report ? (
            <Button size="sm" onClick={() => onExport(report)} disabled={exporting || loading}>
              {exporting ? t('coreHr.reports.actions.exporting') : t('coreHr.reports.actions.export')}
            </Button>
          ) : null}
        </div>
      }
    >
      {loading ? (
        <div aria-busy className="h-48 animate-pulse rounded-xl bg-gray-100" />
      ) : error ? (
        <div className="space-y-3">
          <ErrorMessage message={error} />
          <Button variant="outline" size="sm" onClick={() => setAttempt((n) => n + 1)}>
            {t('coreHr.reports.actions.retry')}
          </Button>
        </div>
      ) : result ? (
        <ReportResultView
          result={result}
          chartType={viz.chartType ?? config.chartType}
          dimensions={config.dimensions}
          measures={config.measures}
        />
      ) : null}
    </Modal>
  );
}

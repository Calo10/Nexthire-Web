import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import {
  getSourcingLead,
  updateSourcingLeadStatus,
  convertSourcingLeadToCandidate,
} from '../../api/sourcingApi';
import type { SourcingLead } from '../../types/sourcing';
import LeadStatusPill from './LeadStatusPill';
import { fitScoreTone, formatDynamicAnswerDisplayValue, leadDisplayName, parseDynamicAnswersJson, whatsappHref } from './sourcingUtils';

interface Props {
  isOpen: boolean;
  leadId: string | number | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function LeadDetailDrawer({ isOpen, leadId, onClose, onUpdated }: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<SourcingLead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isOpen || leadId == null) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const lead = await getSourcingLead(leadId);
        if (!cancelled) setData(lead);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.loadLead'));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, leadId, t]);

  const runStatus = async (status: string, msg: string) => {
    if (leadId == null) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await updateSourcingLeadStatus(leadId, { status });
      setSuccess(msg);
      onUpdated();
      const lead = await getSourcingLead(leadId);
      setData(lead);
    } catch (e: unknown) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.action'));
    } finally {
      setPending(false);
    }
  };

  const handleConvert = async () => {
    if (leadId == null) return;
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      await convertSourcingLeadToCandidate(leadId);
      setSuccess(t('sourcing.toast.addedToPipeline'));
      onUpdated();
      onClose();
    } catch (e: unknown) {
      setError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.action'));
    } finally {
      setPending(false);
    }
  };

  const wa = data ? whatsappHref(data.phone) : null;
  const dynamicAnswers = useMemo(
    () => parseDynamicAnswersJson(data?.dynamicAnswersJson),
    [data?.dynamicAnswersJson]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col border-l border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-dark-text truncate">
              {loading ? t('common.loading') : data ? leadDisplayName(data) : t('sourcing.drawer.lead')}
            </h2>
            <p className="text-sm text-gray-600 truncate">{data?.desiredRole || data?.currentRole || ''}</p>
            {data?.status ? (
              <div className="mt-2">
                <LeadStatusPill status={data.status} />
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.aria.closeDrawer')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error ? <ErrorMessage message={error} /> : null}
          {success ? <SuccessMessage message={success} /> : null}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : data ? (
            <>
              <section>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">{t('sourcing.drawer.contact')}</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">{t('sourcing.leadForm.phone')}: </span>
                    <span className="text-gray-900">{data.phone || '—'}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">{t('sourcing.leadForm.email')}: </span>
                    <span className="text-gray-900">{data.email || '—'}</span>
                  </p>
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-700 font-medium hover:underline"
                    >
                      💬 {t('sourcing.actions.whatsApp')}
                    </a>
                  ) : null}
                </div>
              </section>

              {dynamicAnswers.length > 0 ? (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    {t('sourcing.drawer.applicationAnswers')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {dynamicAnswers.map((answer) => (
                      <div key={answer.questionId || answer.key || answer.label}>
                        <p className="text-xs font-medium text-gray-500">{answer.label}</p>
                        <p className="font-medium text-gray-800 break-words">
                          {formatDynamicAnswerDisplayValue(answer.value, t)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">{t('sourcing.leadForm.fitScore')}</p>
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg ${fitScoreTone(data.fitScore)}`}
                  >
                    {data.fitScore != null ? Math.round(Number(data.fitScore)) : '—'}
                  </div>
                </div>
              </section>

              {data.qualificationNotes ? (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">{t('sourcing.leadForm.notes')}</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{String(data.qualificationNotes)}</p>
                </section>
              ) : null}

              <section className="pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" disabled={pending} onClick={() => runStatus('contacted', t('sourcing.toast.markedContacted'))}>
                  {t('sourcing.actions.markContacted')}
                </Button>
                <Button variant="outline" size="sm" disabled={pending} onClick={() => runStatus('qualified', t('sourcing.toast.markedQualified'))}>
                  {t('sourcing.actions.markQualified')}
                </Button>
                <Button variant="primary" size="sm" disabled={pending} onClick={handleConvert}>
                  {t('sourcing.actions.convertCandidate')}
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200" disabled={pending} onClick={() => runStatus('rejected', t('sourcing.toast.rejected'))}>
                  {t('sourcing.actions.reject')}
                </Button>
                <Button variant="secondary" size="sm" disabled={pending} onClick={() => runStatus('archived', t('sourcing.toast.archived'))}>
                  {t('sourcing.actions.archive')}
                </Button>
              </section>
            </>
          ) : (
            <p className="text-sm text-gray-600">{t('sourcing.drawer.notFound')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

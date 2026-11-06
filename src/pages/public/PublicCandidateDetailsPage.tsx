import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import ErrorMessage from '../../components/ErrorMessage';
import AccountSuspendedNotice, { isAccountSuspended } from '../../components/public/AccountSuspendedNotice';
import { publicCandidatesApi, type PublicCandidateDetail } from '../../api/publicCandidatesApi';
import type { PublicApiError } from '../../api/publicApiClient';

export default function PublicCandidateDetailsPage() {
  const { t } = useTranslation();
  const { orgId, linkId, candidateId } = useParams();
  const [candidate, setCandidate] = useState<PublicCandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PublicApiError | null>(null);

  useEffect(() => {
    if (!orgId || !linkId || !candidateId) return;
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await publicCandidatesApi.detail(orgId, linkId, candidateId);
        if (!cancelled) setCandidate(result);
      } catch (e) {
        if (!cancelled) {
          setError(e as PublicApiError);
          setCandidate(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [orgId, linkId, candidateId]);

  const accountSuspended = isAccountSuspended(error);
  if (accountSuspended) {
    return (
      <div className="min-h-full">
        <div className="max-w-xl mx-auto px-4 py-24">
          <AccountSuspendedNotice />
        </div>
      </div>
    );
  }

  const name = candidate?.displayName || t('publicCandidates.anonymous');
  const analysis = candidate?.analysis;
  const backTo = `/org/${encodeURIComponent(String(orgId || ''))}/candidates/${encodeURIComponent(String(linkId || ''))}`;

  return (
    <div className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link to={backTo} className="text-sm font-medium brand-link brand-heading hover:opacity-80">
            ← {t('publicCandidates.detail.back')}
          </Link>
        </div>

        {error ? (
          <ErrorMessage message={error.message || t('publicCandidates.detail.notFound')} />
        ) : isLoading || !candidate ? (
          <div className="brand-card rounded-2xl p-8">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mt-4 animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-2xl mt-8 animate-pulse" />
          </div>
        ) : (
          <div className="brand-card rounded-2xl p-8">
            <h1 className="text-2xl md:text-3xl font-bold brand-heading">{name}</h1>
            {candidate.source ? <p className="mt-2 text-sm brand-muted">{candidate.source}</p> : null}
            {candidate.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {candidate.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium brand-muted">
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-8">
              <h2 className="text-sm font-semibold brand-heading uppercase tracking-wide mb-3">
                {t('publicCandidates.detail.analysisTitle')}
              </h2>
              {!analysis || (!analysis.summary && analysis.keyPoints.length === 0 && analysis.warnings.length === 0) ? (
                <p className="text-sm brand-muted">{t('publicCandidates.detail.noAnalysis')}</p>
              ) : (
                <div className="space-y-6">
                  {analysis.summary ? (
                    <div>
                      <h3 className="text-sm font-semibold brand-heading mb-2">{t('publicCandidates.detail.summary')}</h3>
                      <p className="text-sm brand-body whitespace-pre-wrap">{analysis.summary}</p>
                    </div>
                  ) : null}
                  {analysis.keyPoints.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold brand-heading mb-2">{t('publicCandidates.detail.keyPoints')}</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm brand-body">
                        {analysis.keyPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {analysis.warnings.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold brand-heading mb-2">{t('publicCandidates.detail.warnings')}</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm brand-body">
                        {analysis.warnings.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

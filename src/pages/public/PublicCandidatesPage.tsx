import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import AccountSuspendedNotice, { isAccountSuspended } from '../../components/public/AccountSuspendedNotice';
import { publicCandidatesApi, type PublicCandidateCard, type PublicCandidateList } from '../../api/publicCandidatesApi';
import type { PublicApiError } from '../../api/publicApiClient';

function CandidateCard({ orgId, linkId, candidate }: { orgId: string; linkId: string; candidate: PublicCandidateCard }) {
  const { t, i18n } = useTranslation();
  const to = `/org/${encodeURIComponent(orgId)}/candidates/${encodeURIComponent(linkId)}/${encodeURIComponent(candidate.id)}`;
  const created = candidate.createdAt ? new Date(candidate.createdAt) : null;
  const createdLabel = created && !Number.isNaN(created.getTime())
    ? created.toLocaleDateString(i18n.language || undefined)
    : '';
  const name = candidate.displayName || t('publicCandidates.anonymous');

  return (
    <Link to={to} className="block">
      <div className="rounded-2xl brand-card p-6 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold brand-heading truncate">{name}</h3>
            {candidate.source ? <p className="mt-1 text-sm brand-muted truncate">{candidate.source}</p> : null}
            {candidate.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {candidate.tags.map((tag) => (
                  <span key={tag.id} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium brand-muted">
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : null}
            {createdLabel ? <p className="mt-4 text-sm brand-muted">{createdLabel}</p> : null}
          </div>
          <div className="flex-shrink-0">
            <Button variant="primary" size="md">
              {t('publicCandidates.card.viewAnalysis')}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PublicCandidatesPage() {
  const { t } = useTranslation();
  const { orgId, linkId } = useParams();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PublicCandidateList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PublicApiError | null>(null);

  useEffect(() => {
    if (!orgId || !linkId) return;
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await publicCandidatesApi.list(orgId, linkId, page);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e as PublicApiError);
          setData(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [orgId, linkId, page]);

  const accountSuspended = isAccountSuspended(error);
  const totalPages = Math.max(1, Math.ceil((data?.total || 0) / (data?.pageSize || 25)));

  if (accountSuspended) {
    return (
      <div className="min-h-full">
        <div className="max-w-xl mx-auto px-4 py-24">
          <AccountSuspendedNotice />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold brand-heading">{data?.name || t('publicCandidates.hero.title')}</h1>
          <p className="mt-3 text-lg brand-muted">{t('publicCandidates.hero.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="mb-6">
          <h2 className="text-2xl font-bold brand-heading">{t('publicCandidates.list.title')}</h2>
          {data ? (
            <p className="text-sm brand-muted mt-1">{t('publicCandidates.list.count', { count: data.total })}</p>
          ) : null}
        </div>

        {error ? (
          <ErrorMessage message={error.message || t('publicCandidates.errors.load')} />
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-2xl brand-card p-6">
                <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-1/4 mt-3 animate-pulse" />
              </div>
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="brand-card rounded-2xl p-10 text-center">
            <h3 className="text-lg font-semibold brand-heading">{t('publicCandidates.empty.title')}</h3>
            <p className="text-sm brand-muted mt-2">{t('publicCandidates.empty.subtitle')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.items.map((candidate) => (
              <CandidateCard key={candidate.id} orgId={orgId || ''} linkId={linkId || ''} candidate={candidate} />
            ))}
          </div>
        )}

        {data && data.total > data.pageSize ? (
          <div className="mt-6 flex items-center justify-between">
            <Button type="button" variant="outline" size="sm" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              {t('publicCandidates.pagination.prev')}
            </Button>
            <span className="text-sm brand-muted">{page} / {totalPages}</span>
            <Button type="button" variant="outline" size="sm" disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => current + 1)}>
              {t('publicCandidates.pagination.next')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

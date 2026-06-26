import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import ApplyJobModal from '../../components/public/ApplyJobModal';
import { looksLikeHtml, markdownToSafeHtml } from '../../lib/markdown';
import { sanitizeHtml } from '../../lib/sanitizeHtml';
import { usePublicJob } from '../../hooks/public/usePublicJob';

function Description({ description }: { description: string | null | undefined }) {
  const raw = String(description || '');
  const safeHtml = useMemo(() => {
    if (!raw.trim()) return '';
    if (looksLikeHtml(raw)) return sanitizeHtml(raw);
    return markdownToSafeHtml(raw);
  }, [raw]);

  if (!safeHtml) return <p className="text-sm brand-muted">—</p>;
  return (
    <div
      className="prose prose-sm max-w-none brand-body"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

export default function PublicJobDetailsPage() {
  const { t } = useTranslation();
  const { orgId, jobId } = useParams();

  const { data: job, isLoading, error, setData } = usePublicJob(orgId || null, jobId || null);
  const [applyOpen, setApplyOpen] = useState(false);

  const alreadyApplied = !!job?.alreadyApplied;

  return (
    <div className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link
            to={`/org/${encodeURIComponent(String(orgId || ''))}/jobs`}
            className="text-sm font-medium brand-link brand-heading hover:opacity-80"
          >
            ← {t('publicJobs.details.back')}
          </Link>
        </div>

        {error ? (
          <ErrorMessage message={error.message || t('publicJobs.details.error')} />
        ) : isLoading || !job ? (
          <div className="brand-card rounded-2xl p-8">
            <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mt-4 animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-2xl mt-8 animate-pulse" />
          </div>
        ) : (
          <div className="brand-card rounded-2xl p-8">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold brand-heading">{job.title}</h1>
              <div className="mt-3 flex flex-wrap gap-2 text-sm brand-muted">
                {job.location ? <span>{job.location}</span> : null}
                {job.department ? <span>• {job.department}</span> : null}
                {job.type ? <span>• {job.type}</span> : null}
              </div>
            </div>

            {alreadyApplied ? (
              <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                {t('publicJobs.apply.alreadyApplied')}
              </div>
            ) : null}

            <div className="mt-8">
              <h2 className="text-sm font-semibold brand-heading uppercase tracking-wide mb-3">
                {t('publicJobs.details.description')}
              </h2>
              <Description description={job.description} />
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Button variant="primary" onClick={() => setApplyOpen(true)} disabled={alreadyApplied}>
                {alreadyApplied ? t('publicJobs.apply.alreadyAppliedCta') : t('publicJobs.details.applyNow')}
              </Button>
              <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                {t('publicJobs.details.backToTop')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {orgId && jobId && job ? (
        <ApplyJobModal
          isOpen={applyOpen}
          onClose={() => setApplyOpen(false)}
          orgSlug={orgId}
          jobId={String(jobId)}
          jobTitle={job.title}
          botQuestions={job.botQuestions}
          alreadyApplied={alreadyApplied}
          onApplied={() => {
            setData((prev) => (prev ? { ...prev, alreadyApplied: true } : prev));
          }}
        />
      ) : null}
    </div>
  );
}

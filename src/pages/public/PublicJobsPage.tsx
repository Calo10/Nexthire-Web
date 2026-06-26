import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import Button from '../../components/Button';
import ErrorMessage from '../../components/ErrorMessage';
import type { JobPublicDTO } from '../../types/publicJobs';
import { useDebouncedValue } from '../../hooks/public/useDebouncedValue';
import { usePublicJobs } from '../../hooks/public/usePublicJobs';

function timeAgoLabel(dateString: string | null | undefined, t: (k: string, opts?: any) => string) {
  if (!dateString) return '';
  const ts = new Date(dateString).getTime();
  if (Number.isNaN(ts)) return '';
  const days = Math.floor((Date.now() - ts) / (24 * 60 * 60 * 1000));
  if (days <= 0) return t('publicJobs.time.today');
  if (days === 1) return t('publicJobs.time.dayAgo');
  if (days < 7) return t('publicJobs.time.daysAgo', { count: days });
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return t('publicJobs.time.weekAgo');
  return t('publicJobs.time.weeksAgo', { count: weeks });
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((v) => String(v || '').trim()).filter(Boolean)));
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl brand-card p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-2/3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/3 mt-3 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-3 animate-pulse" />
            </div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function JobCard({ orgSlug, job, t }: { orgSlug: string; job: JobPublicDTO; t: (k: string, opts?: any) => string }) {
  const to = `/org/${encodeURIComponent(orgSlug)}/jobs/${encodeURIComponent(String(job.id))}`;
  const posted = timeAgoLabel(job.postedAt || job.createdAt || null, t);
  return (
    <Link to={to} className="block">
      <div className="rounded-2xl brand-card p-6 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold brand-heading truncate">{job.title}</h3>
            {job.department ? <p className="mt-1 text-sm brand-muted truncate">{job.department}</p> : null}

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm brand-muted">
              {job.location ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a3 3 0 100-6 3 3 0 000 6z" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19.5 11.5c0 7-7.5 10.5-7.5 10.5S4.5 18.5 4.5 11.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                  {job.location}
                </span>
              ) : null}

              {job.type ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V6a2 2 0 012-2h4a2 2 0 012 2v1m-9 4h10M5 7h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z"
                    />
                  </svg>
                  {job.type}
                </span>
              ) : null}
            </div>

            {posted ? (
              <div className="mt-4 text-sm brand-muted inline-flex items-center gap-2">
                <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {posted}
              </div>
            ) : null}
          </div>

          <div className="flex-shrink-0">
            <Button variant="primary" size="md">
              {t('publicJobs.card.applyNow')}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PublicJobsPage() {
  const { t } = useTranslation();
  const { orgId } = useParams();
  const listRef = useRef<HTMLDivElement | null>(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [location, setLocation] = useState('');

  const { data: jobs, isLoading, error } = usePublicJobs(orgId || null, {});

  const allJobs = useMemo(() => jobs, [jobs]);

  const locations = useMemo(() => uniqueNonEmpty(allJobs.map((j) => j.location)), [allJobs]);
  const hasFilters = !!(search || location);
  const filteredJobs = useMemo(() => {
    const q = String(debouncedSearch || '').trim().toLowerCase();
    const loc = String(location || '').trim().toLowerCase();
    return allJobs.filter((j) => {
      const title = String(j.title || '').toLowerCase();
      if (q && !title.includes(q)) return false;
      if (loc) {
        const jl = String(j.location || '').trim().toLowerCase();
        if (jl !== loc) return false;
      }
      return true;
    });
  }, [allJobs, debouncedSearch, location]);

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold brand-heading">{t('publicJobs.hero.title')}</h1>
          <p className="mt-3 text-lg brand-muted">{t('publicJobs.hero.subtitle')}</p>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="w-full max-w-3xl brand-card rounded-2xl p-2 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 brand-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('publicJobs.hero.searchPlaceholder')}
                className="brand-input w-full pl-12 pr-4 py-4 rounded-xl text-sm"
              />
            </div>
            <Button
              variant="primary"
              size="md"
              className="sm:px-10"
              onClick={() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {t('publicJobs.hero.searchButton')}
            </Button>
          </div>
        </div>
      </div>

      <div ref={listRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold brand-heading">{t('publicJobs.list.title')}</h2>
            <p className="text-sm brand-muted mt-1">{t('publicJobs.list.subtitle')}</p>
          </div>
          <div className="w-60">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="brand-input w-full px-4 py-3 rounded-xl text-sm"
            >
              <option value="">{t('publicJobs.list.allLocations')}</option>
              {locations.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {hasFilters ? (
              <button
                type="button"
                className="mt-2 text-sm font-medium brand-muted hover:brand-heading"
                onClick={() => {
                  setSearch('');
                  setLocation('');
                }}
              >
                {t('publicJobs.filters.clear')}
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <ErrorMessage message={error.message || t('publicJobs.error')} />
        ) : isLoading ? (
          <SkeletonList />
        ) : filteredJobs.length === 0 ? (
          <div className="brand-card rounded-2xl p-10 text-center">
            <h3 className="text-lg font-semibold brand-heading">{t('publicJobs.empty.title')}</h3>
            <p className="text-sm brand-muted mt-2">{t('publicJobs.empty.subtitle')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <JobCard key={String(job.id)} orgSlug={orgId || ''} job={job} t={t} />
            ))}
          </div>
        )}

        <div className="mt-10 brand-card rounded-3xl p-10 text-center">
          <h3 className="text-2xl font-bold brand-heading">{t('publicJobs.cta.title')}</h3>
          <p className="mt-3 text-sm brand-muted">{t('publicJobs.cta.subtitle')}</p>
          <div className="mt-6">
            <Button variant="primary" size="md">
              {t('publicJobs.cta.button')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextField from '../../TextField';
import ErrorMessage from '../../ErrorMessage';
import type { Job } from '../../../types/dashboard';
import { jobCodeFromJob } from '../../../types/metaCampaign';

interface Props {
  jobs: Job[];
  loading: boolean;
  loadError: string | null;
  selectedJobId: string;
  onSelectJobId: (jobId: string, job: Job | null) => void;
}

export default function CampaignStepJobSelector({
  jobs,
  loading,
  loadError,
  selectedJobId,
  onSelectJobId,
}: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        String(j.id).includes(q) ||
        String(jobCodeFromJob(j)).toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const selected = useMemo(() => jobs.find((j) => String(j.id) === selectedJobId) ?? null, [jobs, selectedJobId]);

  return (
    <div className="space-y-6">
      {loadError ? <ErrorMessage message={loadError} /> : null}

      <TextField
        label={t('metaCampaign.job.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('metaCampaign.job.searchPlaceholder')}
        disabled={loading}
      />

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">{t('metaCampaign.job.loading')}</div>
      ) : (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 bg-white">
          {filtered.length === 0 ? (
            <p className="p-6 text-sm text-gray-500 text-center">{t('metaCampaign.job.none')}</p>
          ) : (
            filtered.map((job) => {
              const id = String(job.id);
              const active = id === selectedJobId;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectJobId(id, job)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    active ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <p className="font-medium text-dark-text">{job.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {job.location || '—'} · {job.status} · ID {id}
                  </p>
                </button>
              );
            })
          )}
        </div>
      )}

      {selected ? (
        <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm space-y-2">
          <p className="text-sm font-semibold text-dark-text">{t('metaCampaign.job.selected')}</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-gray-500">{t('metaCampaign.job.title')}</dt>
              <dd className="font-medium">{selected.title}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('metaCampaign.job.location')}</dt>
              <dd>{selected.location || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('metaCampaign.job.status')}</dt>
              <dd>{selected.status}</dd>
            </div>
            <div>
              <dt className="text-gray-500">{t('metaCampaign.job.code')}</dt>
              <dd className="font-mono">{jobCodeFromJob(selected)}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

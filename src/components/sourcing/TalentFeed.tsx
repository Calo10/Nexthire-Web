import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Button';
import ErrorMessage from '../ErrorMessage';
import SelectField from '../SelectField';
import TextField from '../TextField';
import {
  getSourcingLeads,
  convertSourcingLeadToCandidate,
  updateSourcingLeadStatus,
} from '../../api/sourcingApi';
import type { SourcingLead } from '../../types/sourcing';
import type { Job } from '../../types/dashboard';
import LeadStatusPill from './LeadStatusPill';
import { fitScoreTone, leadDisplayName, leadId, whatsappHref } from './sourcingUtils';
import { SOURCING_PLATFORM_CODES, sourcingPlatformSelectLabels } from '../../lib/sourcingPlatformCodes';

const FEED_STATUSES = ['new', 'contacted', 'qualified'];

interface Props {
  shouldFetch: boolean;
  refreshKey: number;
  jobs: Job[];
  onOpenLead: (id: string | number) => void;
  onToastSuccess: (msg: string) => void;
  onToastError: (msg: string) => void;
  onRefreshDashboard: () => void;
}

export default function TalentFeed({
  shouldFetch,
  refreshKey,
  jobs,
  onOpenLead,
  onToastSuccess,
  onToastError,
  onRefreshDashboard,
}: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [jobId, setJobId] = useState('');
  const [locationQ, setLocationQ] = useState('');
  const [radius, setRadius] = useState('');
  const [availability, setAvailability] = useState('');
  const [source, setSource] = useState('');
  const [minFit, setMinFit] = useState('');
  const [search, setSearch] = useState('');

  const [items, setItems] = useState<SourcingLead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const jobOptions = useMemo(
    () => [{ value: '', label: t('sourcing.filters.allJobs') }, ...jobs.map((j) => ({ value: String(j.id), label: j.title }))],
    [jobs, t]
  );

  const load = useCallback(async () => {
    if (!shouldFetch) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getSourcingLeads({
        page,
        pageSize,
        status: 'new,contacted,qualified',
        search: search.trim() || undefined,
        jobId: jobId || undefined,
        sourceType: source || undefined,
        minFitScore: minFit ? Number(minFit) : undefined,
      });
      let list = res.items;
      const allowed = new Set(FEED_STATUSES);
      list = list.filter((l) => {
        const s = (l.status || 'new').toLowerCase();
        return allowed.has(s);
      });
      if (locationQ.trim()) {
        const q = locationQ.toLowerCase();
        list = list.filter(
          (l) =>
            (l.city && String(l.city).toLowerCase().includes(q)) ||
            (l.state && String(l.state).toLowerCase().includes(q))
        );
      }
      if (availability) {
        list = list.filter((l) => (l.availability || '').toLowerCase().includes(availability.toLowerCase()));
      }
      if (radius) {
        const r = Number(radius);
        if (Number.isFinite(r)) {
          list = list.filter((l) => l.distanceMiles == null || Number(l.distanceMiles) <= r);
        }
      }
      if (minFit) {
        const m = Number(minFit);
        if (Number.isFinite(m)) list = list.filter((l) => (l.fitScore ?? 0) >= m);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        list = list.filter((l) => leadDisplayName(l).toLowerCase().includes(q));
      }
      setItems(list);
      setTotal(res.total);
    } catch {
      try {
        const res = await getSourcingLeads({ page, pageSize });
        let list = res.items.filter((l) => FEED_STATUSES.includes((l.status || 'new').toLowerCase()));
        if (locationQ.trim()) {
          const q = locationQ.toLowerCase();
          list = list.filter(
            (l) =>
              (l.city && String(l.city).toLowerCase().includes(q)) ||
              (l.state && String(l.state).toLowerCase().includes(q))
          );
        }
        if (radius) {
          const r = Number(radius);
          if (Number.isFinite(r)) {
            list = list.filter((l) => l.distanceMiles == null || Number(l.distanceMiles) <= r);
          }
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter((l) => leadDisplayName(l).toLowerCase().includes(q));
        }
        setItems(list);
        setTotal(res.total);
      } catch (e2: unknown) {
        const msg = e2 && typeof e2 === 'object' && 'message' in e2 ? String((e2 as { message: string }).message) : t('sourcing.errors.loadLeads');
        setError(msg);
        setItems([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [shouldFetch, page, search, jobId, source, minFit, locationQ, availability, radius, t]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handlePipeline = async (lead: SourcingLead) => {
    const id = lead.id;
    if (id == null) return;
    setPendingId(String(id));
    try {
      await convertSourcingLeadToCandidate(id);
      onToastSuccess(t('sourcing.toast.addedToPipeline'));
      onRefreshDashboard();
      await load();
    } catch (e: unknown) {
      onToastError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.action'));
    } finally {
      setPendingId(null);
    }
  };

  const handleQualified = async (lead: SourcingLead) => {
    const id = lead.id;
    if (id == null) return;
    setPendingId(String(id));
    try {
      await updateSourcingLeadStatus(id, { status: 'qualified' });
      onToastSuccess(t('sourcing.toast.markedQualified'));
      onRefreshDashboard();
      await load();
    } catch (e: unknown) {
      onToastError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.action'));
    } finally {
      setPendingId(null);
    }
  };

  const handleReject = async (lead: SourcingLead) => {
    const id = lead.id;
    if (id == null) return;
    setPendingId(String(id));
    try {
      await updateSourcingLeadStatus(id, { status: 'rejected' });
      onToastSuccess(t('sourcing.toast.rejected'));
      onRefreshDashboard();
      await load();
    } catch (e: unknown) {
      onToastError(e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('sourcing.errors.action'));
    } finally {
      setPendingId(null);
    }
  };

  const wa = (lead: SourcingLead) => whatsappHref(lead.phone);

  const sourceOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: '', label: t('sourcing.filters.allSources') },
      ...sourcingPlatformSelectLabels(t),
    ];
    const s = source.trim();
    if (s && !(SOURCING_PLATFORM_CODES as readonly string[]).includes(s)) {
      opts.push({ value: s, label: s });
    }
    return opts;
  }, [t, source]);

  const availabilityOptions = [
    { value: '', label: t('sourcing.filters.anyAvailability') },
    { value: 'today', label: t('sourcing.availability.today') },
    { value: 'week', label: t('sourcing.availability.thisWeek') },
  ];

  const radiusOptions = [
    { value: '', label: t('sourcing.filters.anyRadius') },
    { value: '5', label: t('sourcing.filters.withinMiles', { n: 5 }) },
    { value: '10', label: t('sourcing.filters.withinMiles', { n: 10 }) },
    { value: '25', label: t('sourcing.filters.withinMiles', { n: 25 }) },
  ];

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-full sm:w-44">
          <SelectField label={t('sourcing.filters.job')} value={jobId} onChange={(e) => setJobId(e.target.value)} options={jobOptions} />
        </div>
        <div className="w-full sm:w-40">
          <TextField label={t('sourcing.filters.location')} value={locationQ} onChange={(e) => setLocationQ(e.target.value)} placeholder={t('sourcing.filters.locationPlaceholder')} />
        </div>
        <div className="w-full sm:w-40">
          <SelectField label={t('sourcing.filters.radius')} value={radius} onChange={(e) => setRadius(e.target.value)} options={radiusOptions} />
        </div>
        <div className="w-full sm:w-44">
          <SelectField
            label={t('sourcing.filters.availability')}
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            options={availabilityOptions}
          />
        </div>
        <div className="w-full sm:w-44">
          <SelectField label={t('sourcing.filters.source')} value={source} onChange={(e) => setSource(e.target.value)} options={sourceOptions} />
        </div>
        <div className="w-full sm:w-28">
          <TextField
            label={t('sourcing.filters.minFit')}
            type="number"
            min={0}
            max={100}
            value={minFit}
            onChange={(e) => setMinFit(e.target.value)}
          />
        </div>
        <div className="w-full sm:flex-1 min-w-[200px]">
          <TextField label={t('sourcing.filters.search')} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('sourcing.filters.searchPlaceholder')} />
        </div>
      </div>

      {error ? (
        <ErrorMessage message={error} />
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-white/60 border border-purple-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-purple-200 bg-white/60">
          <div className="mx-auto w-16 h-16 mb-4 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-dark-text mb-2">{t('sourcing.empty.noLeadsTitle')}</h3>
          <p className="text-sm text-gray-600">{t('sourcing.empty.noLeadsSubtitle')}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((lead) => {
            const id = leadId(lead);
            const busy = pendingId === id;
            const score = lead.fitScore ?? null;
            return (
              <li
                key={id}
                className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm flex flex-col lg:flex-row lg:items-center gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-200 flex items-center justify-center text-primary font-bold shrink-0">
                    {leadDisplayName(lead).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-dark-text truncate">{leadDisplayName(lead)}</span>
                      <LeadStatusPill status={lead.status} />
                    </div>
                    <p className="text-sm text-gray-700">{lead.desiredRole || lead.currentRole || '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {[lead.city, lead.state].filter(Boolean).join(', ') ||
                        (lead.distanceMiles != null ? t('sourcing.lead.milesAway', { n: lead.distanceMiles }) : '')}
                    </p>
                    <p className="text-xs text-purple-600/90 mt-1">
                      {lead.sourceType || lead.sourceTypeCode || t('sourcing.lead.unknownSource')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm lg:w-[340px] shrink-0">
                  <div>
                    <p className="text-xs text-gray-500">{t('sourcing.lead.availability')}</p>
                    <p className="font-medium text-gray-800">{lead.availability || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('sourcing.lead.experience')}</p>
                    <p className="font-medium text-gray-800">{lead.experienceYears != null ? `${lead.experienceYears} yrs` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('sourcing.lead.english')}</p>
                    <p className="font-medium text-gray-800">{lead.englishLevel || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('sourcing.lead.spanish')}</p>
                    <p className="font-medium text-gray-800">{lead.spanishLevel || '—'}</p>
                  </div>
                </div>

                <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center font-bold text-lg ${fitScoreTone(score)}`}>
                  {score != null ? Math.round(score) : '—'}
                </div>

                <div className="flex flex-col gap-2 lg:w-44 shrink-0">
                  <Button variant="outline" size="sm" className="!py-2 text-primary border-purple-200" onClick={() => lead.id != null && onOpenLead(lead.id)}>
                    {t('sourcing.actions.viewProfile')}
                  </Button>
                  <Button variant="outline" size="sm" className="!py-2" onClick={() => handlePipeline(lead)} disabled={busy}>
                    {t('sourcing.actions.addToPipeline')}
                  </Button>
                  {wa(lead) ? (
                    <a
                      href={wa(lead)!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <span className="text-lg leading-none">💬</span>
                      WhatsApp
                    </a>
                  ) : (
                    <Button variant="outline" size="sm" className="!py-2 opacity-50" disabled>
                      WhatsApp
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="!py-2 flex-1" onClick={() => handleQualified(lead)} disabled={busy}>
                      {t('sourcing.actions.qualified')}
                    </Button>
                    <Button variant="outline" size="sm" className="!py-2 flex-1 text-red-600 border-red-200" onClick={() => handleReject(lead)} disabled={busy}>
                      {t('sourcing.actions.reject')}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <p className="text-sm text-gray-600">
            {t('sourcing.pagination.showing', { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total), total })}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              {t('sourcing.pagination.prev')}
            </Button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              {t('sourcing.pagination.next')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

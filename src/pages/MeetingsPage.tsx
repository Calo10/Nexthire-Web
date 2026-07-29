import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import ErrorMessage from '../components/ErrorMessage';
import DashboardLoading from '../components/dashboard/DashboardLoading';
import BookMeetingModal from '../components/meetings/BookMeetingModal';
import {
  calendlyApi,
  type CalendlyBusyTime,
  type CalendlyConnectionStatus,
  type CalendlyScheduledEvent,
} from '../api/calendlyApi';
import type { ApiError } from '../lib/api';

const HOUR_START = 8;
const HOUR_END = 18;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function eventColor(index: number): string {
  const colors = [
    'bg-sky-100 border-sky-300 text-sky-900',
    'bg-emerald-100 border-emerald-300 text-emerald-900',
    'bg-amber-100 border-amber-300 text-amber-900',
    'bg-rose-100 border-rose-300 text-rose-900',
  ];
  return colors[index % colors.length];
}

function layoutBlock(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const gridStart = HOUR_START * 60;
  const gridEnd = HOUR_END * 60;
  const clampedStart = Math.max(startMinutes, gridStart);
  const clampedEnd = Math.min(endMinutes, gridEnd);
  if (clampedEnd <= gridStart || clampedStart >= gridEnd) return null;
  const topPct = ((clampedStart - gridStart) / (gridEnd - gridStart)) * 100;
  const heightPct = Math.max(((clampedEnd - clampedStart) / (gridEnd - gridStart)) * 100, 4);
  return { topPct, heightPct };
}

export default function MeetingsPage() {
  const { t, i18n } = useTranslation();
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [status, setStatus] = useState<CalendlyConnectionStatus | null>(null);
  const [events, setEvents] = useState<CalendlyScheduledEvent[]>([]);
  const [busyTimes, setBusyTimes] = useState<CalendlyBusyTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDays(weekAnchor, i)), [weekAnchor]);
  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[4];
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString(i18n.language, opts)} – ${end.toLocaleDateString(i18n.language, opts)}`;
  }, [weekDays, i18n.language]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = await calendlyApi.getMe();
      setStatus(me);
      if (!me.ready) {
        setEvents([]);
        setBusyTimes([]);
        return;
      }
      const minStart = weekDays[0].toISOString();
      const maxStart = addDays(weekDays[4], 1).toISOString();
      const [res, busy] = await Promise.all([
        calendlyApi.listScheduledEvents({ minStart, maxStart }),
        calendlyApi.listBusyTimes({ startTime: minStart, endTime: maxStart }).catch(() => [] as CalendlyBusyTime[]),
      ]);
      setEvents(res.items);
      setBusyTimes(busy);
      if (res.schedulingUrl || res.hostEmail) {
        setStatus((prev) =>
          prev
            ? {
                ...prev,
                schedulingUrl: res.schedulingUrl || prev.schedulingUrl,
                email: res.hostEmail || prev.email,
                name: res.hostName || prev.name,
              }
            : prev
        );
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || t('meetings.errors.load'));
      setEvents([]);
      setBusyTimes([]);
    } finally {
      setLoading(false);
    }
  }, [t, weekDays]);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => new Date(e.startTime).getTime() >= now - 60 * 60 * 1000)
      .slice(0, 8);
  }, [events]);

  const eventsForDay = (day: Date) => events.filter((e) => sameDay(new Date(e.startTime), day));
  const busyForDay = (day: Date) => busyTimes.filter((b) => sameDay(new Date(b.startTime), day));

  const copyLink = async () => {
    const url = status?.schedulingUrl?.trim();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('meetings.errors.copy'));
    }
  };

  if (loading && !status) {
    return <DashboardLoading />;
  }

  const notReady = status && !status.ready;

  return (
    <div className="p-6 lg:px-8 lg:pb-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">{t('meetings.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('meetings.subtitle')}</p>
          {status?.email || status?.schedulingUrl ? (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-50 text-sky-800 text-xs font-medium px-2.5 py-1">
              Calendly
              {status.email ? <span>· {status.email}</span> : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setWeekAnchor((w) => addDays(w, -7))}>
            ←
          </Button>
          <span className="text-sm font-medium text-gray-800 min-w-[12rem] text-center">{weekLabel}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setWeekAnchor((w) => addDays(w, 7))}>
            →
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setWeekAnchor(startOfWeek(new Date()))}>
            {t('meetings.today')}
          </Button>
          {!notReady ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setBookOpen(true)}>
                {t('meetings.book.button')}
              </Button>
            </>
          ) : null}
          {status?.schedulingUrl ? (
            <Button type="button" variant="primary" size="sm" onClick={() => void copyLink()}>
              {copied ? t('meetings.linkCopied') : t('meetings.copyBookingLink')}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
{info ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{info}</div>
      ) : null}

      {notReady ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3">
          <p className="text-sm text-amber-900 font-medium">{t('meetings.connectRequired')}</p>
          {status?.error ? <p className="text-sm text-amber-800">{status.error}</p> : null}
          <Link
            to="/sourcing?tab=sources"
            className="inline-flex text-sm font-medium text-[#0077E6] hover:underline"
          >
            {t('meetings.goToSources')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_minmax(0,18rem)] gap-4 items-start">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] border-b border-gray-100">
              <div className="bg-gray-50" />
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="px-2 py-3 text-center border-l border-gray-100">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">
                    {day.toLocaleDateString(i18n.language, { weekday: 'short' })}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{day.getDate()}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] relative" style={{ minHeight: 480 }}>
              <div className="relative">
                {HOURS.map((h) => (
                  <div key={h} className="h-12 border-b border-gray-50 pr-2 text-right">
                    <span className="text-[10px] text-gray-400 relative -top-2">
                      {`${String(h).padStart(2, '0')}:00`}
                    </span>
                  </div>
                ))}
              </div>
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="relative border-l border-gray-100">
                  {HOURS.map((h) => (
                    <div key={h} className="h-12 border-b border-gray-50" />
                  ))}
                  {busyForDay(day).map((busy) => {
                    const layout = layoutBlock(busy.startTime, busy.endTime);
                    if (!layout) return null;
                    return (
                      <div
                        key={`${busy.startTime}-${busy.endTime}`}
                        className="absolute left-0.5 right-0.5 rounded bg-gray-200/70 border border-gray-300/40 pointer-events-none"
                        style={{ top: `${layout.topPct}%`, height: `${layout.heightPct}%` }}
                        title={t('meetings.busy')}
                      />
                    );
                  })}
                  {eventsForDay(day).map((ev, idx) => {
                    const layout = layoutBlock(ev.startTime, ev.endTime);
                    if (!layout) return null;
                    const invitee = ev.inviteeNames[0] || ev.inviteeEmails[0] || '';
                    return (
                      <div
                        key={ev.uri}
                        className={`absolute left-1 right-1 rounded-md border px-1.5 py-1 text-[11px] leading-tight overflow-hidden z-[1] ${eventColor(idx)}`}
                        style={{ top: `${layout.topPct}%`, height: `${layout.heightPct}%` }}
                        title={`${ev.name}${invitee ? ` · ${invitee}` : ''}`}
                      >
                        <p className="font-semibold truncate">{ev.name}</p>
                        {invitee ? <p className="truncate opacity-80">{invitee}</p> : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">{t('meetings.upcoming')}</p>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500">{t('meetings.noUpcoming')}</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((ev) => {
                  const start = new Date(ev.startTime);
                  const invitee = ev.inviteeNames[0] || ev.inviteeEmails[0] || '—';
                  return (
                    <li key={ev.uri} className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{invitee}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {start.toLocaleString(i18n.language, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <BookMeetingModal
        isOpen={bookOpen}
        onClose={() => setBookOpen(false)}
        onBooked={() => {
          setInfo(t('meetings.book.success'));
          void load();
        }}
        hostTimezone={status?.timezone}
      />
    </div>
  );
}

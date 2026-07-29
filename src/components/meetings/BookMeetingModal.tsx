import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import Button from '../Button';
import TextField from '../TextField';
import ErrorMessage from '../ErrorMessage';
import {
  calendlyApi,
  type CalendlyAvailableTime,
  type CalendlyEventType,
} from '../../api/calendlyApi';
import type { ApiError } from '../../lib/api';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onBooked: () => void;
  hostTimezone?: string | null;
};

function addDaysIso(d: Date, days: number): string {
  const x = new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
  return x.toISOString();
}

export default function BookMeetingModal({ isOpen, onClose, onBooked, hostTimezone }: Props) {
  const { t, i18n } = useTranslation();
  const [eventTypes, setEventTypes] = useState<CalendlyEventType[]>([]);
  const [eventTypeUri, setEventTypeUri] = useState('');
  const [slots, setSlots] = useState<CalendlyAvailableTime[]>([]);
  const [selectedStart, setSelectedStart] = useState('');
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = useMemo(
    () => eventTypes.find((et) => et.uri === eventTypeUri) ?? null,
    [eventTypes, eventTypeUri]
  );

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true);
    setError(null);
    try {
      const list = await calendlyApi.listEventTypes();
      setEventTypes(list);
      if (list.length > 0) {
        setEventTypeUri((prev) => prev || list[0].uri);
      }
    } catch (err) {
      setError((err as ApiError).message || t('meetings.book.errors.loadTypes'));
      setEventTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isOpen) return;
    setInviteeName('');
    setInviteeEmail('');
    setSelectedStart('');
    setSlots([]);
    setError(null);
    void loadTypes();
  }, [isOpen, loadTypes]);

  useEffect(() => {
    if (!isOpen || !eventTypeUri) return;
    let cancelled = false;
    const run = async () => {
      setLoadingSlots(true);
      setError(null);
      setSelectedStart('');
      try {
        // Start a couple minutes ahead; Calendly rejects start_time in the past.
        // Keep the window under 7 days (6d 12h is safe).
        const start = new Date(Date.now() + 2 * 60 * 1000);
        const list = await calendlyApi.listAvailableTimes({
          eventType: eventTypeUri,
          startTime: start.toISOString(),
          endTime: addDaysIso(start, 6.5),
        });
        if (!cancelled) setSlots(list.filter((s) => s.status === 'available'));
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setError((err as ApiError).message || t('meetings.book.errors.loadSlots'));
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isOpen, eventTypeUri, t]);

  const slotsByDay = useMemo(() => {
    const map = new Map<string, CalendlyAvailableTime[]>();
    for (const slot of slots) {
      const dayKey = new Date(slot.startTime).toDateString();
      const list = map.get(dayKey) ?? [];
      list.push(slot);
      map.set(dayKey, list);
    }
    return Array.from(map.entries());
  }, [slots]);

  const canSubmit =
    !!eventTypeUri &&
    !!selectedStart &&
    inviteeName.trim().length > 1 &&
    inviteeEmail.includes('@') &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await calendlyApi.createInvitee({
        eventTypeUri,
        startTime: selectedStart,
        inviteeName: inviteeName.trim(),
        inviteeEmail: inviteeEmail.trim(),
        timezone: hostTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      onBooked();
      onClose();
    } catch (err) {
      setError((err as ApiError).message || t('meetings.book.errors.book'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('meetings.book.title')}
      subtitle={t('meetings.book.subtitle')}
      width="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button type="button" variant="primary" onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {submitting ? t('meetings.book.booking') : t('meetings.book.submit')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {error ? <ErrorMessage message={error} /> : null}

        <div>
          <label htmlFor="book-event-type" className="block text-sm font-medium text-gray-700 mb-2">
            {t('meetings.book.eventType')}
          </label>
          <select
            id="book-event-type"
            value={eventTypeUri}
            onChange={(e) => setEventTypeUri(e.target.value)}
            disabled={loadingTypes || eventTypes.length === 0}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {eventTypes.length === 0 ? (
              <option value="">{loadingTypes ? t('meetings.book.loadingTypes') : t('meetings.book.noTypes')}</option>
            ) : (
              eventTypes.map((et) => (
                <option key={et.uri} value={et.uri}>
                  {et.name} ({et.durationMinutes} min)
                </option>
              ))
            )}
          </select>
          {selectedType?.schedulingUrl ? (
            <p className="mt-1.5 text-xs text-gray-500 truncate">{selectedType.schedulingUrl}</p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{t('meetings.book.pickSlot')}</p>
          {loadingSlots ? (
            <p className="text-sm text-gray-500">{t('meetings.book.loadingSlots')}</p>
          ) : error ? null : slots.length === 0 ? (
            <p className="text-sm text-gray-500">{t('meetings.book.noSlots')}</p>
          ) : (
            <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
              {slotsByDay.map(([dayKey, daySlots]) => (
                <div key={dayKey}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {new Date(dayKey).toLocaleDateString(i18n.language, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {daySlots.map((slot) => {
                      const selected = selectedStart === slot.startTime;
                      const label = new Date(slot.startTime).toLocaleTimeString(i18n.language, {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          onClick={() => setSelectedStart(slot.startTime)}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            selected
                              ? 'border-[#0077E6] bg-sky-50 text-sky-900 font-semibold'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-sky-300'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label={t('meetings.book.inviteeName')}
            value={inviteeName}
            onChange={(e) => setInviteeName(e.target.value)}
            required
          />
          <TextField
            label={t('meetings.book.inviteeEmail')}
            type="email"
            value={inviteeEmail}
            onChange={(e) => setInviteeEmail(e.target.value)}
            required
          />
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">{t('meetings.book.paidPlanHint')}</p>
      </div>
    </Modal>
  );
}

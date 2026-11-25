import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/Button';
import ErrorMessage from '../../../components/ErrorMessage';
import { onboardingsApi } from '../api/onboardingsApi';
import CoreHrEmptyState from '../components/CoreHrEmptyState';
import CoreHrPageShell from '../components/CoreHrPageShell';
import HrToast, { type HrToastState } from '../components/HrToast';
import { useOnboardingCapabilities } from '../hooks/useOnboardingCapabilities';
import {
  ONBOARDING_PERMISSIONS,
  ONBOARDING_RECIPIENT_ROLES,
  ONBOARDING_TRIGGERS,
  type OnboardingNotificationSetting,
} from '../models/onboarding';
import { apiErrorMessage } from '../utils/employeeFormat';

const GROUPS: { key: 'lifecycle' | 'tasks'; triggers: string[] }[] = [
  {
    key: 'lifecycle',
    triggers: ['OnboardingCreated', 'OnboardingStarted', 'OnboardingInReview', 'OnboardingCompleted', 'OnboardingCancelled'],
  },
  {
    key: 'tasks',
    triggers: ['TaskAssigned', 'TaskDueSoon', 'TaskOverdue', 'TaskApprovalRequested', 'TaskApproved', 'TaskRejected'],
  },
];

function Switch({ checked, disabled, label, onChange }: { checked: boolean; disabled?: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-teal-600' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export default function CoreHrOnboardingAutomationsPage() {
  const { t } = useTranslation();
  const caps = useOnboardingCapabilities();
  const canManage = caps.can(ONBOARDING_PERMISSIONS.ManageAutomations);

  const [settings, setSettings] = useState<OnboardingNotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<HrToastState>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await onboardingsApi.notificationSettings());
    } catch (err) {
      if ((err as { status?: number })?.status === 403) setForbidden(true);
      else setError(apiErrorMessage(err, t('coreHr.onboarding.automations.loadError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!caps.ready) return;
    if (caps.denied) {
      setLoading(false);
      setForbidden(true);
      return;
    }
    void load();
  }, [caps.ready, caps.denied, load]);

  const byTrigger = useMemo(() => new Map(settings.map((s) => [s.triggerCode, s])), [settings]);

  /** Optimistically applies `patch`, persists only that trigger, and reverts on failure. */
  const update = async (trigger: string, patch: Partial<OnboardingNotificationSetting>) => {
    const current = byTrigger.get(trigger);
    if (!current || !canManage) return;
    const next = { ...current, ...patch };
    const previous = settings;
    setSettings((list) => list.map((s) => (s.triggerCode === trigger ? next : s)));
    setSaving(trigger);
    try {
      const saved = await onboardingsApi.updateNotificationSettings([
        {
          triggerCode: trigger,
          isEnabled: next.isEnabled,
          channelEmail: next.channelEmail,
          channelWhatsapp: next.channelWhatsapp,
          daysBefore: next.daysBefore ?? null,
          recipients: next.recipients,
        },
      ]);
      if (saved.length > 0) setSettings(saved);
    } catch (err) {
      setSettings(previous);
      setToast({ tone: 'error', text: apiErrorMessage(err, t('coreHr.onboarding.automations.saveError')) });
    } finally {
      setSaving(null);
    }
  };

  const breadcrumbs = [
    { label: t('modules.coreHr'), to: '/app/hr/dashboard' },
    { label: t('coreHr.onboarding.title'), to: '/app/hr/onboarding' },
    { label: t('coreHr.onboarding.automations.title') },
  ];

  if (forbidden) {
    return (
      <CoreHrPageShell title={t('coreHr.onboarding.automations.title')} breadcrumbs={breadcrumbs}>
        <CoreHrEmptyState title={t('coreHr.onboarding.forbiddenTitle')} description={t('coreHr.onboarding.forbiddenDescription')} />
      </CoreHrPageShell>
    );
  }

  // Known triggers first (in a stable order); anything else the API returns is appended under "other".
  const known = new Set<string>(ONBOARDING_TRIGGERS);
  const extra = settings.filter((s) => !known.has(s.triggerCode)).map((s) => s.triggerCode);

  return (
    <CoreHrPageShell
      title={t('coreHr.onboarding.automations.title')}
      subtitle={t('coreHr.onboarding.automations.subtitle')}
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {!canManage && caps.ready ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {t('coreHr.onboarding.automations.readOnly')}
          </div>
        ) : null}

        {error ? (
          <div className="space-y-3">
            <ErrorMessage message={error} />
            <Button variant="outline" size="sm" onClick={() => void load()}>
              {t('coreHr.onboarding.retry')}
            </Button>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-gray-200 bg-white" />
            ))}
          </div>
        ) : settings.length === 0 ? (
          <CoreHrEmptyState
            title={t('coreHr.onboarding.automations.emptyTitle')}
            description={t('coreHr.onboarding.automations.emptyDescription')}
          />
        ) : (
          [...GROUPS, ...(extra.length ? [{ key: 'other' as const, triggers: extra }] : [])].map((group) => {
            const rows = group.triggers.map((tr) => byTrigger.get(tr)).filter(Boolean) as OnboardingNotificationSetting[];
            if (rows.length === 0) return null;
            return (
              <section key={group.key} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  {t(`coreHr.onboarding.automations.groups.${group.key}`)}
                </h2>
                <ul className="divide-y divide-gray-100">
                  {rows.map((s) => {
                    const disabled = !canManage || saving === s.triggerCode;
                    const label = t(`coreHr.onboarding.automations.triggers.${s.triggerCode}.title`, { defaultValue: s.triggerCode });
                    return (
                      <li key={s.triggerCode} className="space-y-3 px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-dark-text">{label}</p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {t(`coreHr.onboarding.automations.triggers.${s.triggerCode}.description`, { defaultValue: '' })}
                            </p>
                          </div>
                          <Switch
                            checked={s.isEnabled}
                            disabled={disabled}
                            label={label}
                            onChange={(v) => void update(s.triggerCode, { isEnabled: v })}
                          />
                        </div>
                        {s.isEnabled ? (
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                disabled={disabled}
                                checked={s.channelEmail}
                                onChange={(e) => void update(s.triggerCode, { channelEmail: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              {t('coreHr.onboarding.automations.email')}
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                disabled={disabled}
                                checked={s.channelWhatsapp}
                                onChange={(e) => void update(s.triggerCode, { channelWhatsapp: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              {t('coreHr.onboarding.automations.whatsapp')}
                            </label>
                            {s.daysBefore != null || s.triggerCode === 'TaskDueSoon' ? (
                              <label className="flex items-center gap-2">
                                {t('coreHr.onboarding.automations.daysBefore')}
                                <input
                                  type="number"
                                  min={0}
                                  max={60}
                                  disabled={disabled}
                                  defaultValue={s.daysBefore ?? ''}
                                  key={`${s.triggerCode}-${s.daysBefore ?? ''}`}
                                  onBlur={(e) => {
                                    const raw = e.target.value.trim();
                                    const n = raw === '' ? null : Math.max(0, Math.min(60, Math.round(Number(raw))));
                                    if (n !== (s.daysBefore ?? null) && (n === null || Number.isFinite(n))) {
                                      void update(s.triggerCode, { daysBefore: n });
                                    }
                                  }}
                                  className="h-8 w-16 rounded-lg border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                              </label>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-gray-500">{t('coreHr.onboarding.automations.recipients')}:</span>
                              {ONBOARDING_RECIPIENT_ROLES.map((role) => {
                                const on = s.recipients.some((r) => r.toLowerCase() === role.toLowerCase());
                                return (
                                  <button
                                    key={role}
                                    type="button"
                                    disabled={disabled}
                                    aria-pressed={on}
                                    onClick={() =>
                                      void update(s.triggerCode, {
                                        recipients: on
                                          ? s.recipients.filter((r) => r.toLowerCase() !== role.toLowerCase())
                                          : [...s.recipients, role],
                                      })
                                    }
                                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                      on ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    {t(`coreHr.onboarding.automations.recipientRoles.${role}`)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}
      </div>
      <HrToast toast={toast} onDismiss={dismissToast} />
    </CoreHrPageShell>
  );
}

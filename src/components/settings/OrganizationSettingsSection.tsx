import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { orgSettingsApi } from '../../api/orgSettingsApi';
import type { ApiError } from '../../lib/api';
import type { OrganizationSettings } from '../../types/organizationBranding';
import Button from '../Button';
import Card from '../Card';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';

export default function OrganizationSettingsSection() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [fitScoringEnabled, setFitScoringEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const settingsData = await orgSettingsApi.getSettings();
        if (cancelled) return;
        setSettings(settingsData);
        setFitScoringEnabled(settingsData.fitScoringEnabled ?? false);
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as ApiError;
        if (apiErr.status === 403) {
          setForbidden(true);
          return;
        }
        setError(apiErr.message || t('settings.orgSettings.errors.load'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const trimmedName = String(settings.displayName ?? '').trim();
      const payload: Parameters<typeof orgSettingsApi.saveSettings>[0] = {
        colorPalette: settings.colorPalette,
        fitScoringEnabled,
        website: String(settings.website ?? '').trim(),
        contactEmail: String(settings.contactEmail ?? '').trim(),
        contactPhone: String(settings.contactPhone ?? '').trim(),
      };
      if (trimmedName) payload.displayName = trimmedName;

      const saved = await orgSettingsApi.saveSettings(payload);
      setSettings(saved);
      setFitScoringEnabled(saved.fitScoringEnabled ?? false);
      setSuccess(t('settings.orgSettings.toast.saved'));
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 403) {
        setForbidden(true);
        return;
      }
      setError(apiErr.message || t('settings.orgSettings.errors.save'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-gray-200" />
          <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </Card>
    );
  }

  if (forbidden) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-dark-text mb-2">{t('settings.orgSettings.title')}</h3>
        <p className="text-sm text-gray-600">{t('settings.orgSettings.forbidden')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-dark-text mb-2">{t('settings.orgSettings.title')}</h3>
        <p className="text-sm text-gray-600">{t('settings.orgSettings.description')}</p>
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorMessage message={error} />
        </div>
      ) : null}
      {success ? (
        <div className="mb-4">
          <SuccessMessage message={success} />
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer select-none">
          <div>
            <p className="text-sm font-medium text-gray-900">{t('settings.orgSettings.fields.fitScoringEnabled')}</p>
            <p className="text-xs text-gray-500 mt-0.5">{t('settings.orgSettings.fitScoringHint')}</p>
          </div>
          <span className="inline-flex items-center gap-3 shrink-0">
            <input
              type="checkbox"
              checked={fitScoringEnabled}
              onChange={(e) => setFitScoringEnabled(e.target.checked)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                fitScoringEnabled ? 'bg-emerald-500 border-emerald-600' : 'bg-gray-200 border-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  fitScoringEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </span>
          </span>
        </label>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? t('common.actions.saving') : t('settings.orgSettings.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

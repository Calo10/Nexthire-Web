import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { orgSettingsApi } from '../../api/orgSettingsApi';
import type { ApiError } from '../../lib/api';
import { brandingLogoSrc, readLogoFile, validateOrganizationContactFields } from '../../lib/organizationBranding';
import { useAuth } from '../../contexts/AuthContext';
import type {
  ColorPaletteId,
  ColorPaletteOption,
  OrganizationSettings,
} from '../../types/organizationBranding';
import Button from '../Button';
import Card from '../Card';
import ErrorMessage from '../ErrorMessage';
import SuccessMessage from '../SuccessMessage';
import TextField from '../TextField';

interface FormState {
  displayName: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  colorPalette: ColorPaletteId;
}

type ContactField = 'website' | 'contactEmail' | 'contactPhone';

export default function OrganizationBrandingSection() {
  const { t } = useTranslation();
  const { org } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [palettes, setPalettes] = useState<ColorPaletteOption[]>([]);
  const [form, setForm] = useState<FormState>({
    displayName: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    colorPalette: 'nexa_default',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<{ base64: string; contentType: string } | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const [settingsData, paletteData] = await Promise.all([
          orgSettingsApi.getSettings(),
          orgSettingsApi.listPalettes(),
        ]);
        if (cancelled) return;

        setSettings(settingsData);
        setPalettes(Array.isArray(paletteData) ? paletteData : []);
        setForm({
          displayName: settingsData.displayName ?? '',
          website: settingsData.website ?? '',
          contactEmail: settingsData.contactEmail ?? '',
          contactPhone: settingsData.contactPhone ?? '',
          colorPalette: settingsData.colorPalette,
        });
        setFieldErrors({});
        setLogoPreview(brandingLogoSrc(settingsData.logoBase64, settingsData.logoContentType));
        setPendingLogo(null);
        setRemoveLogo(false);
      } catch (err) {
        if (cancelled) return;
        const apiErr = err as ApiError;
        if (apiErr.status === 403) {
          setForbidden(true);
          return;
        }
        setError(apiErr.message || t('settings.branding.errors.load'));
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

  const selectedPalette = useMemo(
    () => palettes.find((palette) => palette.id === form.colorPalette),
    [palettes, form.colorPalette]
  );

  const handleLogoChange = async (file: File | null) => {
    setLogoError(null);
    if (!file) return;

    try {
      const parsed = await readLogoFile(file);
      setPendingLogo(parsed);
      setRemoveLogo(false);
      setLogoPreview(brandingLogoSrc(parsed.base64, parsed.contentType));
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'TOO_LARGE') {
        setLogoError(t('settings.branding.validation.logoTooLarge'));
      } else if (code === 'INVALID_TYPE') {
        setLogoError(t('settings.branding.validation.logoInvalidType'));
      } else {
        setLogoError(t('settings.branding.validation.logoReadFailed'));
      }
    }
  };

  const handleRemoveLogo = () => {
    setPendingLogo(null);
    setLogoPreview(null);
    setRemoveLogo(true);
    setLogoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const contactValidationMessage = (field: ContactField, code: string): string => {
    if (code === 'INVALID_URL') return t('settings.branding.validation.websiteInvalid');
    if (code === 'INVALID_EMAIL') return t('settings.branding.validation.contactEmailInvalid');
    if (code === 'MAX_LENGTH') {
      if (field === 'website') return t('settings.branding.validation.websiteMaxLength');
      if (field === 'contactEmail') return t('settings.branding.validation.contactEmailMaxLength');
      return t('settings.branding.validation.contactPhoneMaxLength');
    }
    return t('settings.branding.errors.save');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({});

    const trimmedName = form.displayName.trim();
    const contactErrors = validateOrganizationContactFields({
      website: form.website,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
    });

    if (Object.keys(contactErrors).length > 0) {
      const mapped: Partial<Record<ContactField, string>> = {};
      for (const [field, code] of Object.entries(contactErrors) as [ContactField, string][]) {
        mapped[field] = contactValidationMessage(field, code);
      }
      setFieldErrors(mapped);
      setIsSaving(false);
      return;
    }

    try {
      const payload: Parameters<typeof orgSettingsApi.saveSettings>[0] = {
        colorPalette: form.colorPalette,
        removeLogo,
        website: form.website.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
      };

      if (trimmedName) {
        payload.displayName = trimmedName;
      }

      if (pendingLogo) {
        payload.logoBase64 = pendingLogo.base64;
        payload.logoContentType = pendingLogo.contentType;
        payload.removeLogo = false;
      }

      const saved = await orgSettingsApi.saveSettings(payload);
      setSettings(saved);
      setForm({
        displayName: saved.displayName ?? '',
        website: saved.website ?? '',
        contactEmail: saved.contactEmail ?? '',
        contactPhone: saved.contactPhone ?? '',
        colorPalette: saved.colorPalette,
      });
      setLogoPreview(brandingLogoSrc(saved.logoBase64, saved.logoContentType));
      setPendingLogo(null);
      setRemoveLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess(t('settings.branding.toast.saved'));
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 403) {
        setForbidden(true);
        return;
      }
      setError(apiErr.message || t('settings.branding.errors.save'));
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
          <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </Card>
    );
  }

  if (forbidden) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-dark-text mb-2">{t('settings.branding.title')}</h3>
        <p className="text-sm text-gray-600">{t('settings.branding.forbidden')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-dark-text mb-2">{t('settings.branding.title')}</h3>
        <p className="text-sm text-gray-600">{t('settings.branding.description')}</p>
        {org?.name ? (
          <p className="mt-2 text-xs text-gray-500">
            {t('settings.branding.nexaOrgNameHint', { name: org.name })}
          </p>
        ) : null}
      </div>

      {error ? <div className="mb-4"><ErrorMessage message={error} /></div> : null}
      {success ? <div className="mb-4"><SuccessMessage message={success} /></div> : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <TextField
          label={t('settings.branding.fields.displayName')}
          value={form.displayName}
          onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
          placeholder={t('settings.branding.placeholders.displayName')}
          maxLength={120}
        />

        <div>
          <h4 className="text-sm font-semibold text-dark-text mb-3">{t('settings.branding.contactSection')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label={t('settings.branding.fields.website')}
              value={form.website}
              onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
              placeholder={t('settings.branding.placeholders.website')}
              maxLength={500}
              error={fieldErrors.website}
            />
            <TextField
              label={t('settings.branding.fields.contactEmail')}
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
              placeholder={t('settings.branding.placeholders.contactEmail')}
              maxLength={320}
              error={fieldErrors.contactEmail}
            />
            <TextField
              label={t('settings.branding.fields.contactPhone')}
              value={form.contactPhone}
              onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
              placeholder={t('settings.branding.placeholders.contactPhone')}
              maxLength={80}
              error={fieldErrors.contactPhone}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.branding.fields.logo')}
          </label>
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
              {logoPreview ? (
                <img src={logoPreview} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-gray-400">{t('settings.branding.noLogo')}</span>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={['image/png', 'image/jpeg', 'image/webp'].join(',')}
                className="block text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
                onChange={(e) => void handleLogoChange(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-gray-500">{t('settings.branding.logoHint')}</p>
              {logoPreview || settings?.logoBase64 ? (
                <button
                  type="button"
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                  onClick={handleRemoveLogo}
                >
                  {t('settings.branding.removeLogo')}
                </button>
              ) : null}
              {logoError ? <p className="text-sm text-red-600">{logoError}</p> : null}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('settings.branding.fields.colorPalette')}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {palettes.map((palette) => {
              const selected = form.colorPalette === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, colorPalette: palette.id }))}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    selected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-dark-text">{palette.name}</p>
                      <p className="mt-1 text-xs text-gray-600">{palette.description}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {[palette.tokens.primary, palette.tokens.secondary, palette.tokens.accent].map((color) => (
                        <span
                          key={color}
                          className="h-5 w-5 rounded-full border border-black/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {!palettes.length ? (
            <p className="text-sm text-gray-500">{t('settings.branding.noPalettes')}</p>
          ) : null}
        </div>

        {selectedPalette ? (
          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              {t('settings.branding.preview')}
            </p>
            <div className="rounded-lg p-4 bg-[#f7fafc]">
              <div
                className="rounded-lg border bg-white p-4 shadow-sm"
                style={{
                  borderColor: selectedPalette.tokens.border,
                  color: selectedPalette.tokens.text,
                }}
              >
                <p className="font-semibold" style={{ color: selectedPalette.tokens.secondary }}>
                  {form.displayName.trim() || org?.name || t('settings.branding.previewTitle')}
                </p>
                <p className="mt-1 text-sm" style={{ color: selectedPalette.tokens.textMuted }}>
                  {t('settings.branding.previewSubtitle')}
                </p>
                <button
                  type="button"
                  className="mt-4 rounded-lg px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: selectedPalette.tokens.primary,
                    color: selectedPalette.tokens.primaryForeground,
                  }}
                >
                  {t('settings.branding.previewButton')}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? t('common.actions.saving') : t('settings.branding.save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}

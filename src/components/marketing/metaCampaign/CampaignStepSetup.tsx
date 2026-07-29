import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextField from '../../TextField';
import MoneyField from '../../MoneyField';
import AgeRangeSlider from './AgeRangeSlider';
import MetaGeoLocationPicker from './MetaGeoLocationPicker';
import GeneratedUrlPreview from './GeneratedUrlPreview';
import {
  META_BID_STRATEGIES,
  META_BILLING_EVENTS,
  META_CAMPAIGN_OBJECTIVES,
  META_OPTIMIZATION_GOALS,
  formatDailyBudgetUsd,
  type MetaDestinationType,
  type MetaGeoSelection,
} from '../../../types/metaCampaign';

interface Props {
  destinationType: MetaDestinationType;
  onDestinationType: (v: MetaDestinationType) => void;
  campaignName: string;
  onCampaignName: (v: string) => void;
  objective: string;
  onObjective: (v: string) => void;
  dailyBudget: number;
  onDailyBudget: (v: number) => void;
  geoSelection: MetaGeoSelection | null;
  onGeoSelection: (v: MetaGeoSelection | null) => void;
  ageMin: number;
  onAgeMin: (v: number) => void;
  ageMax: number;
  onAgeMax: (v: number) => void;
  ageRangeLocked?: boolean;
  platformFacebook: boolean;
  onPlatformFacebook: (v: boolean) => void;
  platformInstagram: boolean;
  onPlatformInstagram: (v: boolean) => void;
  campaignActive: boolean;
  onCampaignActive: (v: boolean) => void;
  billingEvent: string;
  onBillingEvent: (v: string) => void;
  optimizationGoal: string;
  onOptimizationGoal: (v: string) => void;
  bidStrategy: string;
  onBidStrategy: (v: string) => void;
  whatsappMessage: string;
  onWhatsappMessage: (v: string) => void;
  jobPostUrlOverride: string;
  onJobPostUrlOverride: (v: string) => void;
  destinationUrlPreview: string;
  whatsappConfigured: boolean;
  calendlyConfigured: boolean;
  calendlySchedulingUrl: string;
  onGoToCalendlySources?: () => void;
  fieldErrors: Record<string, string>;
}

function AdvancedSelect({
  id,
  label,
  tooltip,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  tooltip: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {tooltip ? <p className="mt-1 text-xs text-gray-500 leading-relaxed">{tooltip}</p> : null}
    </div>
  );
}

export default function CampaignStepSetup({
  destinationType,
  onDestinationType,
  campaignName,
  onCampaignName,
  objective,
  onObjective,
  dailyBudget,
  onDailyBudget,
  geoSelection,
  onGeoSelection,
  ageMin,
  onAgeMin,
  ageMax,
  onAgeMax,
  ageRangeLocked = false,
  platformFacebook,
  onPlatformFacebook,
  platformInstagram,
  onPlatformInstagram,
  campaignActive,
  onCampaignActive,
  billingEvent,
  onBillingEvent,
  optimizationGoal,
  onOptimizationGoal,
  bidStrategy,
  onBidStrategy,
  whatsappMessage,
  onWhatsappMessage,
  jobPostUrlOverride,
  onJobPostUrlOverride,
  destinationUrlPreview,
  whatsappConfigured,
  calendlyConfigured,
  calendlySchedulingUrl,
  onGoToCalendlySources,
  fieldErrors,
}: Props) {
  const { t } = useTranslation();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const objectiveOpts = useMemo(
    () =>
      META_CAMPAIGN_OBJECTIVES.map((code) => ({
        value: code,
        label: t(`metaCampaign.objectives.${code}.label`),
      })),
    [t]
  );

  const objectiveHelp = META_CAMPAIGN_OBJECTIVES.includes(objective as (typeof META_CAMPAIGN_OBJECTIVES)[number])
    ? t(`metaCampaign.objectives.${objective}.help`)
    : '';

  const billingOpts = META_BILLING_EVENTS.map((code) => ({
    value: code,
    label: t(`metaCampaign.advanced.billing.${code}.label`),
    tooltip: t(`metaCampaign.advanced.billing.${code}.tooltip`),
  }));

  const optimizationOpts = META_OPTIMIZATION_GOALS.map((code) => ({
    value: code,
    label: t(`metaCampaign.advanced.optimization.${code}.label`),
    tooltip: t(`metaCampaign.advanced.optimization.${code}.tooltip`),
  }));

  const bidOpts = META_BID_STRATEGIES.map((code) => ({
    value: code,
    label: t(`metaCampaign.advanced.bid.${code}.label`),
    tooltip: t(`metaCampaign.advanced.bid.${code}.tooltip`),
  }));

  const destinationCards: { id: MetaDestinationType; title: string; desc: string }[] = [
    {
      id: 'job_post_url',
      title: t('metaCampaign.destination.webTitle'),
      desc: t('metaCampaign.destination.webDesc'),
    },
    {
      id: 'whatsapp',
      title: t('metaCampaign.destination.whatsappTitle'),
      desc: t('metaCampaign.destination.whatsappDesc'),
    },
    {
      id: 'calendly',
      title: t('metaCampaign.destination.calendlyTitle'),
      desc: t('metaCampaign.destination.calendlyDesc'),
    },
  ];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">{t('metaCampaign.destination.section')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {destinationCards.map((card) => {
            const selected = destinationType === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onDestinationType(card.id)}
                className={`text-left rounded-xl border-2 p-4 transition-colors ${
                  selected ? 'border-primary bg-purple-50/80' : 'border-gray-200 bg-white hover:border-purple-200'
                }`}
              >
                <p className="font-semibold text-dark-text">{card.title}</p>
                <p className="mt-1 text-sm text-gray-600">{card.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 border-t border-gray-100 pt-6">
        <TextField
          label={t('metaCampaign.setup.campaignName')}
          value={campaignName}
          onChange={(e) => onCampaignName(e.target.value)}
          error={fieldErrors.campaignName}
        />

        <div>
          <label htmlFor="meta-campaign-objective" className="block text-sm font-medium text-gray-700 mb-2">
            {t('metaCampaign.setup.objective')}
          </label>
          <select
            id="meta-campaign-objective"
            value={objective}
            onChange={(e) => onObjective(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {objectiveOpts.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {objectiveHelp ? <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{objectiveHelp}</p> : null}
        </div>

        <div>
          <MoneyField
            label={t('metaCampaign.setup.dailyBudget')}
            value={dailyBudget}
            onValue={onDailyBudget}
            min={1}
            max={50}
            step={0.5}
            narrow
            error={fieldErrors.dailyBudget}
          />
          <p className="mt-1 text-xs text-gray-500">{formatDailyBudgetUsd(dailyBudget)}</p>
        </div>

        <MetaGeoLocationPicker
          value={geoSelection}
          onChange={onGeoSelection}
          countryCode={geoSelection?.countryCode ?? 'US'}
          error={fieldErrors.location}
        />

        {ageRangeLocked ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm font-medium text-gray-800">{t('metaCampaign.setup.ageRange')}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900 tabular-nums">
              {t('metaCampaign.setup.ageRangeFixed')}
            </p>
            <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
              {t('metaCampaign.setup.ageRangeLockedHint')}
            </p>
          </div>
        ) : (
          <AgeRangeSlider
            label={t('metaCampaign.setup.ageRange')}
            valueMin={ageMin}
            valueMax={ageMax}
            onChangeMin={onAgeMin}
            onChangeMax={onAgeMax}
            error={fieldErrors.ageMin || fieldErrors.ageMax}
          />
        )}

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{t('metaCampaign.setup.platforms')}</p>
          {fieldErrors.platforms ? <p className="text-sm text-red-600 mb-2">{fieldErrors.platforms}</p> : null}
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={platformFacebook}
                onChange={(e) => onPlatformFacebook(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Facebook
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={platformInstagram}
                onChange={(e) => onPlatformInstagram(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              Instagram
            </label>
          </div>
        </div>

        {fieldErrors.calendly ? <p className="text-sm text-red-600">{fieldErrors.calendly}</p> : null}
        {destinationType === 'whatsapp' ? (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <TextField
              label={t('metaCampaign.destination.message')}
              value={whatsappMessage}
              onChange={(e) => onWhatsappMessage(e.target.value)}
              error={fieldErrors.whatsapp || fieldErrors.destination}
            />
            {!whatsappConfigured ? (
              <p className="text-sm text-amber-700">{t('metaCampaign.destination.noWhatsappEnv')}</p>
            ) : null}
            {destinationUrlPreview ? <GeneratedUrlPreview url={destinationUrlPreview} /> : null}
          </div>
        ) : destinationType === 'calendly' ? (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            {!calendlyConfigured ? (
              <div className="space-y-2">
                <p className="text-sm text-amber-800">{t('metaCampaign.destination.calendlyRequired')}</p>
                {onGoToCalendlySources ? (
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={onGoToCalendlySources}
                  >
                    {t('metaCampaign.destination.calendlyGoToSources')}
                  </button>
                ) : null}
              </div>
            ) : !calendlySchedulingUrl.trim() ? (
              <p className="text-sm text-amber-800">{t('metaCampaign.destination.calendlyMissingUrl')}</p>
            ) : (
              <p className="text-xs text-gray-500">{t('metaCampaign.destination.calendlyUrlHint')}</p>
            )}
            {calendlySchedulingUrl.trim() ? <GeneratedUrlPreview url={calendlySchedulingUrl} /> : null}
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <TextField
              label={t('metaCampaign.destination.urlOverride')}
              value={jobPostUrlOverride}
              onChange={(e) => onJobPostUrlOverride(e.target.value)}
              placeholder={t('metaCampaign.destination.urlOverridePlaceholder')}
              error={fieldErrors.url}
            />
            <p className="text-xs text-gray-500">{t('metaCampaign.destination.defaultUrlHint')}</p>
            {destinationUrlPreview ? <GeneratedUrlPreview url={destinationUrlPreview} /> : null}
          </div>
        )}

        <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer select-none">
          <div>
            <p className="text-sm font-medium text-gray-900">{t('metaCampaign.setup.activeToggleTitle')}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {campaignActive ? t('metaCampaign.setup.activeToggleOn') : t('metaCampaign.setup.activeToggleOff')}
            </p>
          </div>
          <span className="inline-flex items-center gap-3 shrink-0">
            <input
              type="checkbox"
              checked={campaignActive}
              onChange={(e) => onCampaignActive(e.target.checked)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                campaignActive ? 'bg-emerald-500 border-emerald-600' : 'bg-gray-200 border-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  campaignActive ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </span>
          </span>
        </label>
      </section>

      <section className="border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between text-sm font-semibold text-gray-800 py-2"
        >
          {t('metaCampaign.advanced.title')}
          <span className="text-gray-500">{advancedOpen ? '−' : '+'}</span>
        </button>
        {advancedOpen ? (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
            <AdvancedSelect
              id="meta-billing"
              label={t('metaCampaign.advanced.billingLabel')}
              tooltip={billingOpts.find((o) => o.value === billingEvent)?.tooltip ?? ''}
              value={billingEvent}
              options={billingOpts.map(({ value, label }) => ({ value, label }))}
              onChange={onBillingEvent}
            />
            <AdvancedSelect
              id="meta-optimization"
              label={t('metaCampaign.advanced.optimizationLabel')}
              tooltip={optimizationOpts.find((o) => o.value === optimizationGoal)?.tooltip ?? ''}
              value={optimizationGoal}
              options={optimizationOpts.map(({ value, label }) => ({ value, label }))}
              onChange={onOptimizationGoal}
            />
            <AdvancedSelect
              id="meta-bid"
              label={t('metaCampaign.advanced.bidLabel')}
              tooltip={bidOpts.find((o) => o.value === bidStrategy)?.tooltip ?? ''}
              value={bidStrategy}
              options={bidOpts.map(({ value, label }) => ({ value, label }))}
              onChange={onBidStrategy}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

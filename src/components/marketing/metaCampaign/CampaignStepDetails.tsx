import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextField from '../../TextField';
import SelectField from '../../SelectField';
import MoneyField from '../../MoneyField';
import type { MetaPlatformChoice } from '../../../types/metaCampaign';
import {
  META_BID_STRATEGIES,
  META_BILLING_EVENTS,
  META_CAMPAIGN_OBJECTIVES,
  META_COUNTRY_OPTIONS,
  META_OPTIMIZATION_GOALS,
} from '../../../types/metaCampaign';

interface Props {
  campaignName: string;
  onCampaignName: (v: string) => void;
  objective: string;
  onObjective: (v: string) => void;
  campaignActive: boolean;
  onCampaignActive: (v: boolean) => void;
  adSetName: string;
  onAdSetName: (v: string) => void;
  dailyBudget: number;
  onDailyBudget: (v: number) => void;
  billingEvent: string;
  onBillingEvent: (v: string) => void;
  optimizationGoal: string;
  onOptimizationGoal: (v: string) => void;
  bidStrategy: string;
  onBidStrategy: (v: string) => void;
  countries: string[];
  onToggleCountry: (code: string) => void;
  ageMin: number;
  onAgeMin: (v: number) => void;
  ageMax: number;
  onAgeMax: (v: number) => void;
  platformChoice: MetaPlatformChoice;
  onPlatformChoice: (v: MetaPlatformChoice) => void;
  advantageAudience: number;
  onAdvantageAudience: (v: number) => void;
  fieldErrors: Record<string, string>;
}

function optionsFrom(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function AgeRangeSlider({
  min = 13,
  max = 65,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  error,
  label,
}: {
  min?: number;
  max?: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  error?: string;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null);
  const [focused, setFocused] = useState<'min' | 'max' | null>(null);

  let a = clampInt(valueMin, min, max - 1);
  let b = clampInt(valueMax, min + 1, max);
  if (a >= b) {
    b = Math.min(max, a + 1);
    a = Math.max(min, b - 1);
  }

  const toPct = (v: number) => ((v - min) / (max - min)) * 100;
  const leftPct = toPct(a);
  const rightPct = toPct(b);

  const valueFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return a;
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width, clientX - r.left));
    const ratio = r.width > 0 ? x / r.width : 0;
    const raw = min + ratio * (max - min);
    return clampInt(Math.round(raw), min, max);
  };

  const setNearestThumb = (v: number) => {
    const distMin = Math.abs(v - a);
    const distMax = Math.abs(v - b);
    const next = distMin <= distMax ? 'min' : 'max';
    setDragging(next);
    return next;
  };

  const applyValue = (thumb: 'min' | 'max', next: number) => {
    if (thumb === 'min') {
      onChangeMin(clampInt(next, min, b - 1));
    } else {
      onChangeMax(clampInt(next, a + 1, max));
    }
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const v = valueFromClientX(e.clientX);
      applyValue(dragging, v);
    };
    const onUp = () => setDragging(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, a, b, min, max]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm text-gray-600 tabular-nums">
          {a}–{b}
        </p>
      </div>

      <div className="relative">
        <div
          ref={trackRef}
          className="relative h-12 select-none"
          onPointerDown={(e) => {
            const v = valueFromClientX(e.clientX);
            const thumb = setNearestThumb(v);
            applyValue(thumb, v);
          }}
          role="presentation"
        >
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gray-200" />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-emerald-500"
            style={{ left: `${leftPct}%`, width: `${Math.max(0, rightPct - leftPct)}%` }}
          />

          <button
            type="button"
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border bg-white shadow ring-0 transition ${
              dragging === 'min' || focused === 'min' ? 'border-emerald-600 ring-4 ring-emerald-100' : 'border-gray-300'
            }`}
            style={{ left: `${leftPct}%` }}
            aria-label={`${label} min`}
            onPointerDown={(e) => {
              e.stopPropagation();
              setDragging('min');
            }}
            onFocus={() => setFocused('min')}
            onBlur={() => setFocused((f) => (f === 'min' ? null : f))}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 5 : 1;
              if (e.key === 'ArrowLeft') onChangeMin(clampInt(a - step, min, b - 1));
              if (e.key === 'ArrowRight') onChangeMin(clampInt(a + step, min, b - 1));
              if (e.key === 'Home') onChangeMin(min);
              if (e.key === 'End') onChangeMin(b - 1);
            }}
          />

          <button
            type="button"
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-6 w-6 rounded-full border bg-white shadow ring-0 transition ${
              dragging === 'max' || focused === 'max' ? 'border-emerald-600 ring-4 ring-emerald-100' : 'border-gray-300'
            }`}
            style={{ left: `${rightPct}%` }}
            aria-label={`${label} max`}
            onPointerDown={(e) => {
              e.stopPropagation();
              setDragging('max');
            }}
            onFocus={() => setFocused('max')}
            onBlur={() => setFocused((f) => (f === 'max' ? null : f))}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 5 : 1;
              if (e.key === 'ArrowLeft') onChangeMax(clampInt(b - step, a + 1, max));
              if (e.key === 'ArrowRight') onChangeMax(clampInt(b + step, a + 1, max));
              if (e.key === 'Home') onChangeMax(a + 1);
              if (e.key === 'End') onChangeMax(max);
            }}
          />
        </div>
      </div>

      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

export default function CampaignStepDetails({
  campaignName,
  onCampaignName,
  objective,
  onObjective,
  campaignActive,
  onCampaignActive,
  adSetName,
  onAdSetName,
  dailyBudget,
  onDailyBudget,
  billingEvent,
  onBillingEvent,
  optimizationGoal,
  onOptimizationGoal,
  bidStrategy,
  onBidStrategy,
  countries,
  onToggleCountry,
  ageMin,
  onAgeMin,
  ageMax,
  onAgeMax,
  platformChoice,
  onPlatformChoice,
  advantageAudience,
  onAdvantageAudience,
  fieldErrors,
}: Props) {
  const { t } = useTranslation();

  const platformOpts: { value: MetaPlatformChoice; label: string }[] = [
    { value: 'both', label: t('metaCampaign.details.platformBoth') },
    { value: 'facebook', label: t('metaCampaign.details.platformFacebook') },
    { value: 'instagram', label: t('metaCampaign.details.platformInstagram') },
  ];

  const objectiveOpts = useMemo(
    () =>
      META_CAMPAIGN_OBJECTIVES.map((code) => ({
        value: code,
        label: t(`metaCampaign.details.objectives.${code}.label`),
      })),
    [t]
  );

  const objectiveHelpKey = `metaCampaign.details.objectives.${objective}.help`;
  const objectiveHelp = META_CAMPAIGN_OBJECTIVES.includes(objective as (typeof META_CAMPAIGN_OBJECTIVES)[number])
    ? t(objectiveHelpKey)
    : '';

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-900">{t('metaCampaign.details.sectionCampaign')}</h3>
        <TextField
          label={t('metaCampaign.details.campaignName')}
          value={campaignName}
          onChange={(e) => onCampaignName(e.target.value)}
          error={fieldErrors.campaignName}
        />
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2">
          <label htmlFor="meta-campaign-objective" className="text-sm font-medium text-gray-700">
            {t('metaCampaign.details.objective')}
          </label>
          <span className="hidden md:block text-sm font-medium text-gray-700 md:text-right">
            {t('metaCampaign.details.activeCampaign')}
          </span>

          <select
            id="meta-campaign-objective"
            value={objective}
            onChange={(e) => onObjective(e.target.value)}
            className="w-full min-w-0 px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          >
            {objectiveOpts.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <label className="flex items-center justify-start gap-3 cursor-pointer select-none md:justify-end md:self-center">
            <input
              type="checkbox"
              checked={campaignActive}
              onChange={(e) => onCampaignActive(e.target.checked)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                campaignActive ? 'bg-emerald-500 border-emerald-600' : 'bg-gray-200 border-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  campaignActive ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </span>
            <span
              className={`text-sm font-medium whitespace-nowrap md:sr-only ${
                campaignActive ? 'text-emerald-700' : 'text-gray-700'
              }`}
            >
              {t('metaCampaign.details.activeCampaign')}
            </span>
          </label>

          {objectiveHelp ? (
            <p className="text-xs text-gray-500 leading-relaxed md:col-start-1">{objectiveHelp}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">{t('metaCampaign.details.sectionAdSet')}</h3>
        <TextField
          label={t('metaCampaign.details.adSetName')}
          value={adSetName}
          onChange={(e) => onAdSetName(e.target.value)}
          error={fieldErrors.adSetName}
        />
        <div className="grid grid-cols-1 gap-4">
          <MoneyField
            label={t('metaCampaign.details.dailyBudget')}
            value={dailyBudget}
            onValue={onDailyBudget}
            min={1}
            max={50}
            error={fieldErrors.dailyBudget}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label={t('metaCampaign.details.billingEvent')}
            value={billingEvent}
            onChange={(e) => onBillingEvent(e.target.value)}
            options={optionsFrom(META_BILLING_EVENTS)}
          />
          <SelectField
            label={t('metaCampaign.details.optimizationGoal')}
            value={optimizationGoal}
            onChange={(e) => onOptimizationGoal(e.target.value)}
            options={optionsFrom(META_OPTIMIZATION_GOALS)}
          />
          <SelectField
            label={t('metaCampaign.details.bidStrategy')}
            value={bidStrategy}
            onChange={(e) => onBidStrategy(e.target.value)}
            options={optionsFrom(META_BID_STRATEGIES)}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">{t('metaCampaign.details.sectionTargeting')}</h3>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">{t('metaCampaign.details.countries')}</p>
          {fieldErrors.countries ? <p className="text-sm text-red-600 mb-2">{fieldErrors.countries}</p> : null}
          <div className="flex flex-wrap gap-3">
            {META_COUNTRY_OPTIONS.map((code) => (
              <label key={code} className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={countries.includes(code)}
                  onChange={() => onToggleCountry(code)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                {code}
              </label>
            ))}
          </div>
        </div>
        <AgeRangeSlider
          label={t('metaCampaign.details.ageRange')}
          min={13}
          max={65}
          valueMin={ageMin}
          valueMax={ageMax}
          onChangeMin={onAgeMin}
          onChangeMax={onAgeMax}
          error={fieldErrors.ageMin || fieldErrors.ageMax}
        />
        <SelectField
          label={t('metaCampaign.details.platforms')}
          value={platformChoice}
          onChange={(e) => onPlatformChoice(e.target.value as MetaPlatformChoice)}
          options={platformOpts}
        />
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
          <input
            type="checkbox"
            checked={advantageAudience === 1}
            onChange={(e) => onAdvantageAudience(e.target.checked ? 1 : 0)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          {t('metaCampaign.details.advantageAudience')}
        </label>
      </section>
    </div>
  );
}

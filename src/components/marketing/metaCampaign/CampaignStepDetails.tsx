import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import TextField from '../../TextField';
import SelectField from '../../SelectField';
import type { MetaPlatformChoice } from '../../../types/metaCampaign';

const MAP_CENTER_LAT = 25.6866;
const MAP_CENTER_LNG = -100.3161;

interface Props {
  campaignName: string;
  onCampaignName: (v: string) => void;
  objective: string;
  onObjective: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  dailyBudget: number;
  onDailyBudget: (v: number) => void;
  ageMin: number;
  onAgeMin: (v: number) => void;
  ageMax: number;
  onAgeMax: (v: number) => void;
  country: string;
  onCountry: (v: string) => void;
  platformChoice: MetaPlatformChoice;
  onPlatformChoice: (v: MetaPlatformChoice) => void;
  fieldErrors: Record<string, string>;
}

export default function CampaignStepDetails({
  campaignName,
  onCampaignName,
  objective,
  onObjective,
  status,
  onStatus,
  dailyBudget,
  onDailyBudget,
  ageMin,
  onAgeMin,
  ageMax,
  onAgeMax,
  country,
  onCountry,
  platformChoice,
  onPlatformChoice,
  fieldErrors,
}: Props) {
  const { t } = useTranslation();
  const [radiusKm, setRadiusKm] = useState(25);

  const objectiveOpts = [{ value: 'OUTCOME_TRAFFIC', label: 'OUTCOME_TRAFFIC' }];
  const statusOpts = [{ value: 'PAUSED', label: 'PAUSED' }];
  const platformOpts: { value: MetaPlatformChoice; label: string }[] = [
    { value: 'both', label: t('metaCampaign.details.platformBoth') },
    { value: 'facebook', label: t('metaCampaign.details.platformFacebook') },
    { value: 'instagram', label: t('metaCampaign.details.platformInstagram') },
  ];
  const googleEmbedUrl = useMemo(() => {
    const query = encodeURIComponent(`${MAP_CENTER_LAT},${MAP_CENTER_LNG}`);
    return `https://www.google.com/maps?q=${query}&z=11&output=embed`;
  }, []);
  const coverageCircleSizePx = useMemo(() => {
    const min = 80;
    const max = 240;
    const normalized = Math.min(1, Math.max(0, (radiusKm - 5) / 195));
    return Math.round(min + normalized * (max - min));
  }, [radiusKm]);

  return (
    <div className="space-y-4">
      <TextField
        label={t('metaCampaign.details.campaignName')}
        value={campaignName}
        onChange={(e) => onCampaignName(e.target.value)}
        error={fieldErrors.campaignName}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label={t('metaCampaign.details.objective')}
          value={objective}
          onChange={(e) => onObjective(e.target.value)}
          options={objectiveOpts}
        />
        <SelectField
          label={t('metaCampaign.details.status')}
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          options={statusOpts}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label={t('metaCampaign.details.dailyBudget')}
          type="number"
          min={1}
          value={Number.isFinite(dailyBudget) ? String(dailyBudget) : ''}
          onChange={(e) => onDailyBudget(Number(e.target.value))}
          error={fieldErrors.dailyBudget}
        />
        <TextField
          label={t('metaCampaign.details.country')}
          value={country}
          onChange={(e) => onCountry(e.target.value.toUpperCase().slice(0, 2))}
          placeholder="US"
          maxLength={2}
          error={fieldErrors.country}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label={t('metaCampaign.details.ageMin')}
          type="number"
          min={13}
          max={65}
          value={String(ageMin)}
          onChange={(e) => onAgeMin(Number(e.target.value))}
          error={fieldErrors.ageMin}
        />
        <TextField
          label={t('metaCampaign.details.ageMax')}
          type="number"
          min={13}
          max={65}
          value={String(ageMax)}
          onChange={(e) => onAgeMax(Number(e.target.value))}
          error={fieldErrors.ageMax}
        />
      </div>
      <SelectField
        label={t('metaCampaign.details.platforms')}
        value={platformChoice}
        onChange={(e) => onPlatformChoice(e.target.value as MetaPlatformChoice)}
        options={platformOpts}
      />
      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h4 className="text-sm font-semibold text-gray-900">{t('metaCampaign.details.mapTitle')}</h4>
        </div>
        <div className="relative h-64 w-full overflow-hidden rounded-lg border border-slate-300">
          <iframe
            title={t('metaCampaign.details.mapAria')}
            src={googleEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0"
          />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full border-2 border-primary bg-primary/15 shadow-[0_0_0_9999px_rgba(15,23,42,0.08)_inset]"
              style={{ width: `${coverageCircleSizePx}px`, height: `${coverageCircleSizePx}px` }}
            />
            <div className="absolute h-3 w-3 rounded-full border border-white bg-primary shadow" />
          </div>
          <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow">
            {radiusKm} km
          </div>
          <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-gray-700 shadow">
            {t('metaCampaign.details.mapCenterLabel', {
              lat: MAP_CENTER_LAT.toFixed(4),
              lng: MAP_CENTER_LNG.toFixed(4),
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="mock-radius" className="text-sm font-medium text-gray-800">
              {t('metaCampaign.details.mapRadius')}
            </label>
            <span className="text-sm font-semibold text-primary">{radiusKm} km</span>
          </div>
          <input
            id="mock-radius"
            type="range"
            min={5}
            max={200}
            step={5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        <p className="text-xs text-gray-600">
          {t('metaCampaign.details.mapSelectionReady', {
            lat: MAP_CENTER_LAT.toFixed(4),
            lng: MAP_CENTER_LNG.toFixed(4),
            radius: radiusKm,
          })}
        </p>
      </div>
    </div>
  );
}

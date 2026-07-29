import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../Modal';
import Button from '../Button';
import Card from '../Card';
import ErrorMessage from '../ErrorMessage';
import { resolveTenantId } from '../../lib/resolveTenantId';
import { sourcingWhatsAppPhoneFromEnv } from '../../lib/sourcingWhatsAppApplyLink';
import {
  buildPublicJobPostUrl,
  buildWhatsappDestinationUrl,
  defaultWhatsappApplyMessage,
  resolveSiteOrigin,
} from '../../lib/metaCampaignUrls';
import type { Job } from '../../types/dashboard';
import type {
  GeneratedMetaCreativePreview,
  MetaCampaignCreatePayload,
  MetaCampaignCreateResult,
  MetaDestinationType,
  MetaGeoSelection,
} from '../../types/metaCampaign';
import {
  buildMetaCampaignPayload,
  derivedCampaignChildNames,
  isAbsoluteHttpUrl,
  isPublicHttpsUrl,
  isValidWhatsappMeUrl,
  jobCodeFromJob,
  META_EMPLOYMENT_SPECIAL_AD_CATEGORIES,
  META_SPECIAL_AD_AGE_MAX,
  META_SPECIAL_AD_AGE_MIN,
  metaDefaultsForDestination,
  specialAdCategoriesRequireCountry,
  specialAdCategoriesRequireFixedAge,
  specialAdCategoryCountryFromGeo,
} from '../../types/metaCampaign';
import { createMetaCampaign, metaErrorMessageFromUnknown } from '../../api/metaCampaignApi';
import { useCalendlySourceConnection } from '../../hooks/useCalendlySourceConnection';
import { createSourcingCampaign } from '../../api/sourcingApi';
import CampaignStepJobSelector from '../marketing/metaCampaign/CampaignStepJobSelector';
import CampaignStepSetup from '../marketing/metaCampaign/CampaignStepSetup';
import CampaignStepCreative from '../marketing/metaCampaign/CampaignStepCreative';
import CampaignStepReview from '../marketing/metaCampaign/CampaignStepReview';
import CampaignCreationResult from '../marketing/metaCampaign/CampaignCreationResult';
import type { MetaCreativeImageReady } from '../marketing/metaCampaign/ImageUploadPreview';

const STEPS = 4;

function jobIdForSourcingApi(jobId: string): string | number {
  const s = String(jobId).trim();
  if (/^\d+$/.test(s)) return Number(s);
  return s;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  jobsLoading?: boolean;
  metaAdsReady?: boolean;
  onGoToSources?: () => void;
  onSuccess: () => void;
}

export default function MetaCampaignBuilderModal({
  isOpen,
  onClose,
  jobs,
  jobsLoading = false,
  metaAdsReady = true,
  onGoToSources,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const { org } = useAuth();
  const tenantId = useMemo(() => resolveTenantId(org), [org]);

  const [step, setStep] = useState(1);

  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobCode, setJobCode] = useState('');

  const [destinationType, setDestinationType] = useState<MetaDestinationType>('job_post_url');
  const [campaignName, setCampaignName] = useState('');
  const [objective, setObjective] = useState('OUTCOME_TRAFFIC');
  const [campaignActive, setCampaignActive] = useState(false);
  const [dailyBudget, setDailyBudget] = useState(5);
  const [geoSelection, setGeoSelection] = useState<MetaGeoSelection | null>(null);
  const [ageMin, setAgeMin] = useState(META_SPECIAL_AD_AGE_MIN);
  const [ageMax, setAgeMax] = useState(META_SPECIAL_AD_AGE_MAX);
  const [platformFacebook, setPlatformFacebook] = useState(true);
  const [platformInstagram, setPlatformInstagram] = useState(true);

  const [billingEvent, setBillingEvent] = useState('IMPRESSIONS');
  const [optimizationGoal, setOptimizationGoal] = useState('LINK_CLICKS');
  const [bidStrategy, setBidStrategy] = useState('LOWEST_COST_WITHOUT_CAP');

  const [adSetName, setAdSetName] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [jobPostUrlOverride, setJobPostUrlOverride] = useState('');

  const [creativeName, setCreativeName] = useState('');
  const [creativeMessage, setCreativeMessage] = useState('Estamos contratando. Aplica hoy.');
  const [aiInstructions, setAiInstructions] = useState('');
  const [adName, setAdName] = useState('');
  const [imageHash, setImageHash] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageContentType, setImageContentType] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedMetaCreativePreview | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createResult, setCreateResult] = useState<MetaCampaignCreateResult | null>(null);
  const [sourcingSyncError, setSourcingSyncError] = useState<string | null>(null);

  const whatsappConfigured = Boolean(sourcingWhatsAppPhoneFromEnv());
  const {
    isReady: calendlyReady,
    schedulingUrl: calendlySchedulingUrl,
  } = useCalendlySourceConnection(isOpen);

  const ageRangeLocked = specialAdCategoriesRequireFixedAge(META_EMPLOYMENT_SPECIAL_AD_CATEGORIES);

  const applyDestinationDefaults = useCallback((dest: MetaDestinationType) => {
    const d = metaDefaultsForDestination(dest);
    setObjective(d.objective);
    setBillingEvent(d.billingEvent);
    setOptimizationGoal(d.optimizationGoal);
    setBidStrategy(d.bidStrategy);
  }, []);

  const resetForm = useCallback(() => {
    setStep(1);
    setSelectedJobId('');
    setSelectedJob(null);
    setJobCode('');
    setDestinationType('job_post_url');
    setCampaignName('');
    setCampaignActive(false);
    setDailyBudget(5);
    setGeoSelection(null);
    setAgeMin(META_SPECIAL_AD_AGE_MIN);
    setAgeMax(META_SPECIAL_AD_AGE_MAX);
    setPlatformFacebook(true);
    setPlatformInstagram(true);
    applyDestinationDefaults('job_post_url');
    setAdSetName('');
    setWhatsappMessage('');
    setJobPostUrlOverride('');
    setCreativeName('');
    setCreativeMessage('Estamos contratando. Aplica hoy.');
    setAiInstructions('');
    setAdName('');
    setImageHash('');
    setImageBase64('');
    setImageContentType('');
    setImagePreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    setGeneratedPreview(null);
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(false);
    setCreateResult(null);
    setSourcingSyncError(null);
  }, [applyDestinationDefaults]);

  useEffect(() => {
    if (!isOpen) return;
    resetForm();
  }, [isOpen, resetForm]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleDestinationType = (dest: MetaDestinationType) => {
    setDestinationType(dest);
    applyDestinationDefaults(dest);
  };

  const handleSelectJob = (jobId: string, job: Job | null) => {
    setSelectedJobId(jobId);
    setSelectedJob(job);
    if (job) {
      const code = jobCodeFromJob(job);
      setJobCode(code);
      const name = `NextHire - ${job.title}`;
      setCampaignName(name);
      const derived = derivedCampaignChildNames(name);
      setAdSetName(derived.adSetName);
      setCreativeName(derived.creativeName);
      setAdName(derived.adName);
      setWhatsappMessage(defaultWhatsappApplyMessage(code));
    } else {
      setJobCode('');
    }
  };

  const publisherPlatforms = useMemo(() => {
    const p: ('facebook' | 'instagram')[] = [];
    if (platformFacebook) p.push('facebook');
    if (platformInstagram) p.push('instagram');
    return p;
  }, [platformFacebook, platformInstagram]);

  const destinationUrlForPayload = useMemo(() => {
    if (destinationType === 'whatsapp') return buildWhatsappDestinationUrl(whatsappMessage);
    if (destinationType === 'calendly') return calendlySchedulingUrl.trim();
    const origin = resolveSiteOrigin();
    const def = buildPublicJobPostUrl(origin, tenantId, selectedJobId);
    return jobPostUrlOverride.trim() || def;
  }, [destinationType, whatsappMessage, calendlySchedulingUrl, jobPostUrlOverride, tenantId, selectedJobId]);

  const objectiveLabel = t(`metaCampaign.objectives.${objective}.label`, { defaultValue: objective });
  const destinationLabel =
    destinationType === 'whatsapp'
      ? t('metaCampaign.destination.whatsappTitle')
      : destinationType === 'calendly'
        ? t('metaCampaign.destination.calendlyTitle')
        : t('metaCampaign.destination.webTitle');
  const platformsLabel = [
    platformFacebook ? 'Facebook' : null,
    platformInstagram ? 'Instagram' : null,
  ]
    .filter(Boolean)
    .join(', ');
  const statusLabel = campaignActive ? t('metaCampaign.setup.statusActive') : t('metaCampaign.setup.statusPaused');
  const billingLabel = t(`metaCampaign.advanced.billing.${billingEvent}.label`, { defaultValue: billingEvent });
  const optimizationLabel = t(`metaCampaign.advanced.optimization.${optimizationGoal}.label`, {
    defaultValue: optimizationGoal,
  });
  const bidLabel = t(`metaCampaign.advanced.bid.${bidStrategy}.label`, { defaultValue: bidStrategy });

  const validateStep = useCallback(
    (s: number): boolean => {
      const next: Record<string, string> = {};
      if (s === 1) {
        if (!selectedJobId || !selectedJob) next.job = t('metaCampaign.validation.jobRequired');
      }
      if (s === 2) {
        if (!campaignName.trim()) next.campaignName = t('metaCampaign.validation.required');
        if (!Number.isFinite(dailyBudget) || dailyBudget < 1 || dailyBudget > 50) {
          next.dailyBudget = t('metaCampaign.validation.budget');
        }
        if (!geoSelection) next.location = t('metaCampaign.validation.location');
        else if (
          specialAdCategoriesRequireCountry(META_EMPLOYMENT_SPECIAL_AD_CATEGORIES) &&
          !specialAdCategoryCountryFromGeo(geoSelection).length
        ) {
          next.location = t('metaCampaign.validation.specialAdCategoryCountry');
        }
        if (!publisherPlatforms.length) next.platforms = t('metaCampaign.validation.platforms');
        if (
          !ageRangeLocked &&
          (!Number.isFinite(ageMin) ||
            !Number.isFinite(ageMax) ||
            ageMin < 13 ||
            ageMax > 65 ||
            ageMin >= ageMax)
        ) {
          next.ageMin = t('metaCampaign.validation.age');
        }
        if (destinationType === 'whatsapp') {
          if (!whatsappConfigured) next.whatsapp = t('metaCampaign.validation.whatsappEnv');
          else {
            const waUrl = buildWhatsappDestinationUrl(whatsappMessage);
            if (!whatsappMessage.trim() || !waUrl || !isValidWhatsappMeUrl(waUrl)) {
              next.destination = t('metaCampaign.validation.destination');
            }
          }
        } else if (destinationType === 'calendly') {
          if (!calendlyReady) next.calendly = t('metaCampaign.validation.calendlyRequired');
          else if (!calendlySchedulingUrl.trim() || !isPublicHttpsUrl(calendlySchedulingUrl.trim())) {
            next.calendly = t('metaCampaign.validation.calendlyUrl');
          }
        } else {
          const override = jobPostUrlOverride.trim();
          if (override) {
            // Only validate when the user provides a custom URL.
            if (!isPublicHttpsUrl(override)) next.url = t('metaCampaign.validation.publicUrl');
          } else if (!tenantId || !selectedJobId || !resolveSiteOrigin()) {
            next.url = t('metaCampaign.validation.orgMissing');
          }
        }
      }
      if (s === 3) {
        if (!creativeMessage.trim()) next.creativeMessage = t('metaCampaign.validation.required');
        if (!imageHash.trim()) next.imageHash = t('metaCampaign.validation.image');
      }
      if (s === 4) {
        setFieldErrors({});
        return true;
      }
      setFieldErrors(next);
      return Object.keys(next).length === 0;
    },
    [
      selectedJobId,
      selectedJob,
      campaignName,
      dailyBudget,
      geoSelection,
      publisherPlatforms.length,
      ageMin,
      ageMax,
      ageRangeLocked,
      destinationType,
      whatsappConfigured,
      whatsappMessage,
      calendlyReady,
      calendlySchedulingUrl,
      jobPostUrlOverride,
      tenantId,
      creativeMessage,
      imageHash,
      t,
    ]
  );

  const goNext = () => {
    if (!validateStep(step)) return;
    setFieldErrors({});
    setSubmitError(null);
    setStep((x) => Math.min(STEPS, x + 1));
  };

  const goBack = () => {
    setSubmitError(null);
    setStep((x) => Math.max(1, x - 1));
  };

  const handleImageReady = (image: MetaCreativeImageReady) => {
    setImageHash(image.imageHash);
    setImageBase64(image.imageBase64);
    setImageContentType(image.imageContentType);
    setImagePreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return image.previewUrl;
    });
    setFieldErrors((fe) => {
      const { imageHash: _, ...rest } = fe;
      return rest;
    });
  };

  const handleGeneratedPreviewChange = (preview: GeneratedMetaCreativePreview | null) => {
    setGeneratedPreview(preview);
    if (preview) {
      setImageHash('');
      setImageBase64('');
      setImageContentType('');
    }
    setFieldErrors((fe) => {
      const { imageHash: _, ...rest } = fe;
      return rest;
    });
  };

  const buildPayload = (): MetaCampaignCreatePayload | null => {
    if (!tenantId || !selectedJobId || !geoSelection) return null;

    let resolvedBase64 = imageBase64.trim();
    let resolvedContentType = imageContentType.trim();
    if (!resolvedBase64 && generatedPreview?.dataUrl) {
      const match = generatedPreview.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        resolvedContentType = match[1] || generatedPreview.contentType || 'image/png';
        resolvedBase64 = match[2];
      }
    }

    return buildMetaCampaignPayload({
      tenantId,
      jobId: selectedJobId,
      destinationType,
      activateOnCreate: campaignActive,
      campaignName,
      dailyBudgetUsd: dailyBudget,
      geoSelection,
      ageMin,
      ageMax,
      publisherPlatforms,
      jobPostLink:
        destinationType === 'job_post_url' || destinationType === 'calendly'
          ? destinationUrlForPayload
          : undefined,
      whatsappLink:
        destinationType === 'whatsapp' ? destinationUrlForPayload : undefined,
      whatsappMessage,
      creativeMessage,
      imageHash,
      imageBase64: resolvedBase64,
      imageContentType: resolvedContentType || undefined,
      adSetName,
      creativeName,
      adName,
    });
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setSubmitError(null);
    setSourcingSyncError(null);
    const payload = buildPayload();
    if (!payload) {
      if (
        destinationType === 'job_post_url' &&
        jobPostUrlOverride.trim() &&
        !isPublicHttpsUrl(jobPostUrlOverride.trim())
      ) {
        setSubmitError(t('metaCampaign.validation.publicUrl'));
      } else if (
        destinationType === 'job_post_url' &&
        destinationUrlForPayload.trim() &&
        !isAbsoluteHttpUrl(destinationUrlForPayload)
      ) {
        setSubmitError(t('metaCampaign.validation.destination'));
      } else {
        setSubmitError(t('metaCampaign.errors.missingTenant'));
      }
      return;
    }
    setSubmitting(true);
    try {
      const res = await createMetaCampaign(payload);
      setCreateResult(res);
      try {
        if (res.localRecordId) {
          onSuccess();
        } else {
          await createSourcingCampaign({
            jobId: jobIdForSourcingApi(selectedJobId),
            name: campaignName.trim(),
            platform: 'meta_ads',
            status: campaignActive ? 'active' : 'paused',
            dailyBudget,
            currency: 'USD',
            landingPageUrl: destinationUrlForPayload,
            externalCampaignId: res.campaignId || undefined,
            externalAdAccountId: res.adAccountId || undefined,
          });
          onSuccess();
        }
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'message' in e
            ? String((e as { message: string }).message)
            : t('metaCampaign.errors.sourcingSync');
        setSourcingSyncError(msg);
      }
    } catch (e: unknown) {
      setSubmitError(metaErrorMessageFromUnknown(e) ?? t('metaCampaign.errors.create'));
    } finally {
      setSubmitting(false);
    }
  };

  const stepValid = useMemo(() => {
    const next: Record<string, string> = {};
    if (step === 1) {
      if (!selectedJobId || !selectedJob) next._ = 'x';
    } else if (step === 2) {
      if (!campaignName.trim()) next._ = 'x';
      if (!Number.isFinite(dailyBudget) || dailyBudget < 1 || dailyBudget > 50) next._ = 'x';
      if (!geoSelection) next._ = 'x';
      else if (
        specialAdCategoriesRequireCountry(META_EMPLOYMENT_SPECIAL_AD_CATEGORIES) &&
        !specialAdCategoryCountryFromGeo(geoSelection).length
      ) {
        next._ = 'x';
      }
      if (!publisherPlatforms.length) next._ = 'x';
      if (!ageRangeLocked && ageMin >= ageMax) next._ = 'x';
      if (destinationType === 'whatsapp') {
        const waUrl = buildWhatsappDestinationUrl(whatsappMessage);
        if (!whatsappConfigured || !whatsappMessage.trim() || !waUrl || !isValidWhatsappMeUrl(waUrl)) {
          next._ = 'x';
        }
      } else if (destinationType === 'calendly') {
        if (!calendlyReady || !calendlySchedulingUrl.trim() || !isPublicHttpsUrl(calendlySchedulingUrl.trim())) {
          next._ = 'x';
        }
      } else {
        const override = jobPostUrlOverride.trim();
        if (override) {
          if (!isPublicHttpsUrl(override)) next._ = 'x';
        } else if (!tenantId || !selectedJobId || !resolveSiteOrigin()) {
          next._ = 'x';
        }
      }
    } else if (step === 3) {
      if (!creativeMessage.trim() || !imageHash.trim()) next._ = 'x';
    } else if (step === 4) {
      if (!tenantId || !selectedJobId || !selectedJob) next._ = 'x';
    }
    return Object.keys(next).length === 0;
  }, [
    step,
    selectedJobId,
    selectedJob,
    campaignName,
    dailyBudget,
    geoSelection,
    publisherPlatforms.length,
    ageMin,
    ageMax,
    ageRangeLocked,
    destinationType,
    whatsappConfigured,
    whatsappMessage,
    calendlyReady,
    calendlySchedulingUrl,
    jobPostUrlOverride,
    tenantId,
    creativeMessage,
    imageHash,
  ]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('metaCampaign.title')}
      subtitle={t('metaCampaign.subtitle')}
      width="xl"
    >
      <div className="flex flex-wrap gap-2 mb-4">
        {metaAdsReady
          ? Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  n === step ? 'bg-primary text-white' : n < step ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {t('metaCampaign.stepLabel', { current: n, total: STEPS })} — {t(`metaCampaign.steps.s${n}`)}
              </div>
            ))
          : null}
      </div>

      <Card className="p-4 md:p-6 border-0 shadow-none">
        {!metaAdsReady ? (
          <div className="space-y-4">
            <ErrorMessage message={t('sourcing.metaAds.configureRequired')} />
            <div className="flex flex-wrap justify-end gap-2">
              {onGoToSources ? (
                <Button type="button" variant="primary" onClick={onGoToSources}>
                  {t('sourcing.metaAds.goToSources')}
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.actions.close')}
              </Button>
            </div>
          </div>
        ) : createResult ? (
          <div className="space-y-4">
            <CampaignCreationResult result={createResult} />
            {sourcingSyncError ? <ErrorMessage message={sourcingSyncError} /> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.actions.close')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {submitError ? <ErrorMessage message={submitError} className="mb-4" /> : null}

            {step === 1 && (
              <CampaignStepJobSelector
                jobs={jobs}
                loading={jobsLoading}
                loadError={null}
                selectedJobId={selectedJobId}
                onSelectJobId={handleSelectJob}
              />
            )}

            {step === 2 && (
              <CampaignStepSetup
                destinationType={destinationType}
                onDestinationType={handleDestinationType}
                campaignName={campaignName}
                onCampaignName={setCampaignName}
                objective={objective}
                onObjective={setObjective}
                dailyBudget={dailyBudget}
                onDailyBudget={setDailyBudget}
                geoSelection={geoSelection}
                onGeoSelection={setGeoSelection}
                ageMin={ageMin}
                onAgeMin={setAgeMin}
                ageMax={ageMax}
                onAgeMax={setAgeMax}
                ageRangeLocked={ageRangeLocked}
                platformFacebook={platformFacebook}
                onPlatformFacebook={setPlatformFacebook}
                platformInstagram={platformInstagram}
                onPlatformInstagram={setPlatformInstagram}
                campaignActive={campaignActive}
                onCampaignActive={setCampaignActive}
                billingEvent={billingEvent}
                onBillingEvent={setBillingEvent}
                optimizationGoal={optimizationGoal}
                onOptimizationGoal={setOptimizationGoal}
                bidStrategy={bidStrategy}
                onBidStrategy={setBidStrategy}
                whatsappMessage={whatsappMessage}
                onWhatsappMessage={setWhatsappMessage}
                jobPostUrlOverride={jobPostUrlOverride}
                onJobPostUrlOverride={setJobPostUrlOverride}
                destinationUrlPreview={destinationUrlForPayload}
                whatsappConfigured={whatsappConfigured}
                calendlyConfigured={calendlyReady}
                calendlySchedulingUrl={calendlySchedulingUrl}
                onGoToCalendlySources={onGoToSources}
                fieldErrors={fieldErrors}
              />
            )}

            {step === 3 && (
              <CampaignStepCreative
                selectedJobId={selectedJobId}
                creativeMessage={creativeMessage}
                onCreativeMessage={setCreativeMessage}
                aiInstructions={aiInstructions}
                onAiInstructions={setAiInstructions}
                imageHash={imageHash}
                imagePreviewUrl={imagePreviewUrl}
                generatedPreview={generatedPreview}
                onGeneratedPreviewChange={handleGeneratedPreviewChange}
                onImageReady={handleImageReady}
                fieldErrors={fieldErrors}
              />
            )}

            {step === 4 && selectedJob && (
              <CampaignStepReview
                job={selectedJob}
                jobCode={jobCode}
                destinationType={destinationType}
                destinationLabel={destinationLabel}
                campaignName={campaignName}
                objectiveLabel={objectiveLabel}
                dailyBudget={dailyBudget}
                geoSelection={geoSelection}
                ageMin={ageMin}
                ageMax={ageMax}
                platformsLabel={platformsLabel}
                destinationUrl={destinationUrlForPayload}
                creativeMessage={creativeMessage}
                statusLabel={statusLabel}
                billingLabel={billingLabel}
                optimizationLabel={optimizationLabel}
                bidLabel={bidLabel}
                imagePreviewUrl={imagePreviewUrl}
                imageReady={Boolean(imageHash.trim())}
              />
            )}

            <div className="flex flex-wrap justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || submitting}>
                {t('metaCampaign.nav.back')}
              </Button>
              {step < STEPS ? (
                <Button type="button" variant="primary" onClick={goNext} disabled={submitting}>
                  {t('metaCampaign.nav.next')}
                </Button>
              ) : (
                <Button type="button" variant="primary" onClick={() => void handleSubmit()} disabled={!stepValid || submitting || !tenantId}>
                  {submitting ? t('metaCampaign.nav.creating') : t('metaCampaign.nav.create')}
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </Modal>
  );
}

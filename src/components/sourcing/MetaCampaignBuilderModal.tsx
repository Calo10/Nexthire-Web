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
  MetaCtaType,
  MetaDestinationType,
  MetaPlatformChoice,
} from '../../types/metaCampaign';
import { jobCodeFromJob, platformsFromChoice } from '../../types/metaCampaign';
import { createMetaCampaign } from '../../api/metaCampaignApi';
import { createSourcingCampaign } from '../../api/sourcingApi';
import CampaignStepJobSelector from '../marketing/metaCampaign/CampaignStepJobSelector';
import CampaignStepDetails from '../marketing/metaCampaign/CampaignStepDetails';
import CampaignStepDestination from '../marketing/metaCampaign/CampaignStepDestination';
import CampaignStepCreative from '../marketing/metaCampaign/CampaignStepCreative';
import CampaignStepReview from '../marketing/metaCampaign/CampaignStepReview';
import CampaignCreationResult from '../marketing/metaCampaign/CampaignCreationResult';

const STEPS = 5;

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

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
  onSuccess: () => void;
}

export default function MetaCampaignBuilderModal({ isOpen, onClose, jobs, jobsLoading = false, onSuccess }: Props) {
  const { t } = useTranslation();
  const { org } = useAuth();
  const tenantId = useMemo(() => resolveTenantId(org), [org]);

  const [step, setStep] = useState(1);

  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobCode, setJobCode] = useState('');

  const [campaignName, setCampaignName] = useState('');
  const [objective, setObjective] = useState('OUTCOME_TRAFFIC');
  const [status, setStatus] = useState('PAUSED');
  const [dailyBudget, setDailyBudget] = useState(1000);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(55);
  const [country, setCountry] = useState('US');
  const [platformChoice, setPlatformChoice] = useState<MetaPlatformChoice>('both');

  const [destinationType, setDestinationType] = useState<MetaDestinationType>('whatsapp');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [jobPostUrlOverride, setJobPostUrlOverride] = useState('');

  const [adText, setAdText] = useState("We're hiring! Apply in seconds 🚀");
  const [ctaType, setCtaType] = useState<MetaCtaType>('LEARN_MORE');
  const [imageHash, setImageHash] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedMetaCreativePreview | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createResult, setCreateResult] = useState<MetaCampaignCreateResult | null>(null);
  const [sourcingSyncError, setSourcingSyncError] = useState<string | null>(null);

  const whatsappConfigured = Boolean(sourcingWhatsAppPhoneFromEnv());

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setSelectedJobId('');
    setSelectedJob(null);
    setJobCode('');
    setCampaignName('');
    setObjective('OUTCOME_TRAFFIC');
    setStatus('PAUSED');
    setDailyBudget(1000);
    setAgeMin(18);
    setAgeMax(55);
    setCountry('US');
    setPlatformChoice('both');
    setDestinationType('whatsapp');
    setWhatsappMessage('');
    setJobPostUrlOverride('');
    setAdText("We're hiring! Apply in seconds 🚀");
    setCtaType('LEARN_MORE');
    setImageHash('');
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
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleSelectJob = (jobId: string, job: Job | null) => {
    setSelectedJobId(jobId);
    setSelectedJob(job);
    if (job) {
      const code = jobCodeFromJob(job);
      setJobCode(code);
      setCampaignName(`NextHire - ${job.title}`);
      setWhatsappMessage(defaultWhatsappApplyMessage(code));
    } else {
      setJobCode('');
    }
  };

  const destinationUrlForPayload = useMemo(() => {
    if (destinationType === 'whatsapp') return buildWhatsappDestinationUrl(whatsappMessage);
    const origin = resolveSiteOrigin();
    const def = buildPublicJobPostUrl(origin, tenantId, selectedJobId);
    return jobPostUrlOverride.trim() || def;
  }, [destinationType, whatsappMessage, jobPostUrlOverride, tenantId, selectedJobId]);

  const destinationUrlPreview = destinationUrlForPayload;

  const validateStep = useCallback(
    (s: number): boolean => {
      const next: Record<string, string> = {};
      if (s === 1) {
        if (!selectedJobId || !selectedJob) {
          next.job = t('metaCampaign.validation.jobRequired');
        }
      }
      if (s === 2) {
        if (!campaignName.trim()) next.campaignName = t('metaCampaign.validation.required');
        if (!Number.isFinite(dailyBudget) || dailyBudget < 1) next.dailyBudget = t('metaCampaign.validation.budget');
        if (!country.trim() || country.length !== 2) next.country = t('metaCampaign.validation.country');
        if (!Number.isFinite(ageMin) || !Number.isFinite(ageMax) || ageMin < 13 || ageMax > 65 || ageMin >= ageMax) {
          next.ageMin = t('metaCampaign.validation.age');
          next.ageMax = t('metaCampaign.validation.age');
        }
      }
      if (s === 3) {
        if (destinationType === 'whatsapp') {
          if (!whatsappConfigured) next.whatsapp = t('metaCampaign.validation.whatsappEnv');
          else if (!buildWhatsappDestinationUrl(whatsappMessage)) next.destination = t('metaCampaign.validation.destination');
        } else {
          const override = jobPostUrlOverride.trim();
          if (!override && (!tenantId || !resolveSiteOrigin())) {
            next.url = t('metaCampaign.validation.orgMissing');
          } else {
            const url = override || buildPublicJobPostUrl(resolveSiteOrigin(), tenantId, selectedJobId);
            if (!isValidHttpUrl(url)) next.url = t('metaCampaign.validation.url');
          }
        }
      }
      if (s === 4) {
        if (!adText.trim()) next.adText = t('metaCampaign.validation.required');
        if (!imageHash.trim()) next.imageHash = t('metaCampaign.validation.image');
      }
      if (s === 5) {
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
      country,
      ageMin,
      ageMax,
      destinationType,
      whatsappConfigured,
      whatsappMessage,
      jobPostUrlOverride,
      tenantId,
      adText,
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

  const handleImageReady = (hash: string, preview: string | null) => {
    setImageHash(hash);
    setImagePreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return preview;
    });
    setFieldErrors((fe) => {
      const { imageHash: _, ...rest } = fe;
      return rest;
    });
  };

  const handleGeneratedPreviewChange = (preview: GeneratedMetaCreativePreview | null) => {
    setGeneratedPreview(preview);
    if (preview) {
      // Generated preview is not an uploaded Meta asset yet; hash is only valid after explicit upload.
      setImageHash('');
    }
    setFieldErrors((fe) => {
      const { imageHash: _, ...rest } = fe;
      return rest;
    });
  };

  const buildPayload = (): MetaCampaignCreatePayload | null => {
    if (!tenantId || !selectedJobId) return null;
    return {
      tenantId,
      jobId: selectedJobId,
      campaignName: campaignName.trim(),
      objective,
      dailyBudget,
      country: country.trim().toUpperCase(),
      ageMin,
      ageMax,
      platforms: platformsFromChoice(platformChoice),
      destinationType,
      destinationUrl: destinationUrlForPayload,
      whatsappMessage: whatsappMessage.trim(),
      adText: adText.trim(),
      ctaType,
      imageHash: imageHash.trim(),
      status: 'PAUSED',
    };
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setSubmitError(null);
    setSourcingSyncError(null);
    const payload = buildPayload();
    if (!payload) {
      setSubmitError(t('metaCampaign.errors.missingTenant'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await createMetaCampaign(payload);
      setCreateResult(res);
      try {
        await createSourcingCampaign({
          jobId: jobIdForSourcingApi(selectedJobId),
          name: campaignName.trim(),
          platform: 'meta_ads',
          dailyBudget,
          currency: 'USD',
          landingPageUrl: destinationUrlForPayload,
        });
        onSuccess();
        onClose();
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('metaCampaign.errors.sourcingSync');
        setSourcingSyncError(msg);
      }
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: string }).message) : t('metaCampaign.errors.create');
      setSubmitError(msg);
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
      if (!Number.isFinite(dailyBudget) || dailyBudget < 1) next._ = 'x';
      if (!country.trim() || country.length !== 2) next._ = 'x';
      if (ageMin >= ageMax) next._ = 'x';
    } else if (step === 3) {
      if (destinationType === 'whatsapp') {
        if (!whatsappConfigured || !buildWhatsappDestinationUrl(whatsappMessage)) next._ = 'x';
      } else {
        const override = jobPostUrlOverride.trim();
        if (!override && (!tenantId || !resolveSiteOrigin())) next._ = 'x';
        else {
          const url = override || buildPublicJobPostUrl(resolveSiteOrigin(), tenantId, selectedJobId);
          if (!isValidHttpUrl(url)) next._ = 'x';
        }
      }
    } else if (step === 4) {
      if (!adText.trim() || !imageHash.trim()) next._ = 'x';
    } else if (step === 5) {
      if (!tenantId || !selectedJobId || !selectedJob) next._ = 'x';
    }
    return Object.keys(next).length === 0;
  }, [
    step,
    selectedJobId,
    selectedJob,
    campaignName,
    dailyBudget,
    country,
    ageMin,
    ageMax,
    destinationType,
    whatsappConfigured,
    whatsappMessage,
    jobPostUrlOverride,
    tenantId,
    adText,
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
        {Array.from({ length: STEPS }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              n === step ? 'bg-primary text-white' : n < step ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {t('metaCampaign.stepLabel', { current: n, total: STEPS })} — {t(`metaCampaign.steps.s${n}`)}
          </div>
        ))}
      </div>

      <Card className="p-4 md:p-6 border-0 shadow-none">
        {createResult ? (
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
              <CampaignStepDetails
                campaignName={campaignName}
                onCampaignName={setCampaignName}
                objective={objective}
                onObjective={setObjective}
                status={status}
                onStatus={setStatus}
                dailyBudget={dailyBudget}
                onDailyBudget={setDailyBudget}
                ageMin={ageMin}
                onAgeMin={setAgeMin}
                ageMax={ageMax}
                onAgeMax={setAgeMax}
                country={country}
                onCountry={setCountry}
                platformChoice={platformChoice}
                onPlatformChoice={setPlatformChoice}
                fieldErrors={fieldErrors}
              />
            )}

            {step === 3 && (
              <CampaignStepDestination
                destinationType={destinationType}
                onDestinationType={setDestinationType}
                whatsappMessage={whatsappMessage}
                onWhatsappMessage={setWhatsappMessage}
                jobPostUrlOverride={jobPostUrlOverride}
                onJobPostUrlOverride={setJobPostUrlOverride}
                orgSegment={tenantId}
                jobId={selectedJobId}
                whatsappConfigured={whatsappConfigured}
                fieldErrors={{
                  url: fieldErrors.url,
                  whatsapp: fieldErrors.whatsapp,
                  destination: fieldErrors.destination,
                }}
              />
            )}

            {step === 4 && (
              <CampaignStepCreative
                selectedJobId={selectedJobId}
                adText={adText}
                onAdText={setAdText}
                ctaType={ctaType}
                onCtaType={setCtaType}
                imageHash={imageHash}
                imagePreviewUrl={imagePreviewUrl}
                generatedPreview={generatedPreview}
                onGeneratedPreviewChange={handleGeneratedPreviewChange}
                onImageReady={handleImageReady}
                fieldErrors={fieldErrors}
              />
            )}

            {step === 5 && selectedJob && (
              <CampaignStepReview
                job={selectedJob}
                jobCode={jobCode}
                campaignName={campaignName}
                dailyBudget={dailyBudget}
                country={country}
                ageMin={ageMin}
                ageMax={ageMax}
                platformChoice={platformChoice}
                destinationType={destinationType}
                destinationUrl={destinationUrlPreview}
                adText={adText}
                ctaType={ctaType}
                status="PAUSED"
                imagePreviewUrl={imagePreviewUrl}
                imageHash={imageHash}
              />
            )}

            <div className="flex flex-wrap justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || submitting}>
                {t('metaCampaign.nav.back')}
              </Button>
              {step < STEPS ? (
                <Button type="button" variant="primary" onClick={goNext} disabled={!stepValid || submitting}>
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

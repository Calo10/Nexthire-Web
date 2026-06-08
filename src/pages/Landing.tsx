import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Card from '../components/Card';
import LandingBackground from '../components/landing/LandingBackground';
import LandingHeroPreview from '../components/landing/LandingHeroPreview';
import LandingShowcaseVisual from '../components/landing/LandingShowcaseVisual';
import LandingAiVisual from '../components/landing/LandingAiVisual';
import LandingCampaignVisual from '../components/landing/LandingCampaignVisual';
import LandingWhatsAppVisual from '../components/landing/LandingWhatsAppVisual';
import LandingChannelStrip from '../components/landing/LandingChannelStrip';
import {
  landingFeatures,
  landingShowcases,
  landingStatKeys,
  landingStepKeys,
  landingTeamBulletKeys,
  landingAiCapabilityKeys,
  landingCampaignBulletKeys,
  landingWhatsappBulletKeys,
  pricingPlanKeys,
  pricingPlanPrices,
} from '../components/landing/landingContent';

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-gray-700">
          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function bulletsFromKeys(t: (key: string) => string, prefix: string, keys: readonly string[]) {
  return keys.map((key) => t(`${prefix}.${key}`));
}

function SectionHeading({
  title,
  description,
  className = '',
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={`text-center mb-14 max-w-3xl mx-auto ${className}`}>
      <h2 className="text-3xl lg:text-4xl font-bold text-dark-text mb-4">{title}</h2>
      <p className="text-lg text-gray-600">{description}</p>
    </div>
  );
}

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-purple-50/70 border-b border-purple-100/60">
        <LandingBackground />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center rounded-full bg-white/80 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary mb-6 shadow-sm">
                {t('landing.heroBadge')}
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark-text mb-6 leading-tight">
                {t('landing.heroTitle')}
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                {t('landing.heroDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    {t('landing.startTrial')}
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white/80">
                    {t('landing.viewPricing')}
                  </Button>
                </Link>
              </div>
              <p className="mt-5 text-sm text-gray-500">{t('landing.heroTrialNote')}</p>
              <LandingChannelStrip />
            </div>
            <LandingHeroPreview />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {landingStatKeys.map((key) => (
              <div key={key} className="text-center">
                <p className="text-2xl lg:text-3xl font-bold text-primary mb-1">
                  {t(`landing.stats.${key}.value`)}
                </p>
                <p className="text-sm text-gray-600">{t(`landing.stats.${key}.label`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <SectionHeading
          title={t('landing.featuresTitle')}
          description={t('landing.featuresDescription')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {landingFeatures.map((feature) => (
            <Card
              key={feature.key}
              className="p-6 h-full hover:border-primary/30 hover:shadow-md hover:shadow-purple-500/5 transition-all"
            >
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-base font-semibold text-dark-text mb-2">
                {t(`landing.featureItems.${feature.key}.title`)}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t(`landing.featureItems.${feature.key}.description`)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <SectionHeading
            title={t('landing.howItWorksTitle')}
            description={t('landing.howItWorksDescription')}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {landingStepKeys.map((step, index) => (
              <div key={step} className="relative text-center md:text-left">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-purple-700 text-white text-lg font-bold mb-5 shadow-lg shadow-purple-500/20">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-dark-text mb-3">
                  {t(`landing.steps.${step}.title`)}
                </h3>
                <p className="text-gray-600 leading-relaxed">{t(`landing.steps.${step}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI highlight */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950 to-primary">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(167,139,250,0.35), transparent 45%), radial-gradient(circle at 80% 70%, rgba(139,92,246,0.25), transparent 40%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-medium text-purple-100 mb-6">
                <svg className="h-4 w-4 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"
                  />
                </svg>
                {t('landing.aiSection.badge')}
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                {t('landing.aiSection.title')}
              </h2>
              <p className="text-lg text-purple-100/90 mb-8 leading-relaxed">
                {t('landing.aiSection.description')}
              </p>
              <ul className="space-y-4">
                {bulletsFromKeys(t, 'landing.aiSection.capabilities', landingAiCapabilityKeys).map(
                  (item) => (
                    <li key={item} className="flex items-start gap-3 text-purple-50">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/30 text-white ring-1 ring-primary/50">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <span>{item}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
            <LandingAiVisual />
          </div>
        </div>
      </section>

      {/* Multi-channel campaigns */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <LandingCampaignVisual />
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-dark-text mb-4">
              {t('landing.campaignsSection.title')}
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              {t('landing.campaignsSection.description')}
            </p>
            <BulletList
              items={bulletsFromKeys(t, 'landing.campaignsSection.bullets', landingCampaignBulletKeys)}
            />
          </div>
        </div>
      </section>

      {/* WhatsApp apply bots */}
      <section className="bg-emerald-50/50 border-y border-emerald-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center lg:[direction:rtl]">
            <div className="lg:[direction:ltr]">
              <LandingWhatsAppVisual />
            </div>
            <div className="lg:[direction:ltr]">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 border border-emerald-200 px-4 py-1.5 text-sm font-medium text-emerald-800 mb-6">
                <img
                  src="https://cdn.simpleicons.org/whatsapp/25D366"
                  alt=""
                  className="h-4 w-4"
                  loading="lazy"
                />
                {t('landing.whatsappSection.badge')}
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-dark-text mb-4">
                {t('landing.whatsappSection.title')}
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {t('landing.whatsappSection.description')}
              </p>
              <BulletList
                items={bulletsFromKeys(t, 'landing.whatsappSection.bullets', landingWhatsappBulletKeys)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <SectionHeading
          title={t('landing.showcaseTitle')}
          description={t('landing.showcaseDescription')}
        />
        <div className="space-y-20">
          {landingShowcases.map((key, index) => {
            const isReversed = index % 2 === 1;
            const bullets = t(`landing.showcases.${key}.bullets`, { returnObjects: true }) as Record<
              string,
              string
            >;

            return (
              <div
                key={key}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${isReversed ? 'lg:[direction:rtl]' : ''}`}
              >
                <div className={isReversed ? 'lg:[direction:ltr]' : ''}>
                  <LandingShowcaseVisual variant={key} />
                </div>
                <div className={isReversed ? 'lg:[direction:ltr]' : ''}>
                  <h3 className="text-2xl lg:text-3xl font-bold text-dark-text mb-4">
                    {t(`landing.showcases.${key}.title`)}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {t(`landing.showcases.${key}.description`)}
                  </p>
                  <ul className="space-y-3">
                    {Object.keys(bullets)
                      .sort()
                      .map((bulletKey) => (
                        <li key={bulletKey} className="flex items-start gap-3 text-gray-700">
                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span>{bullets[bulletKey]}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Teams */}
      <section className="bg-purple-50/60 border-y border-purple-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-dark-text mb-4">
                {t('landing.teamsTitle')}
              </h2>
              <p className="text-lg text-gray-600 mb-8">{t('landing.teamsDescription')}</p>
              <ul className="space-y-4">
                {landingTeamBulletKeys.map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-gray-700">{t(`landing.teamsBullets.${key}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="p-6 lg:p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-dark-text">Acme Corp · Team</p>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    5 members
                  </span>
                </div>
                {[
                  { name: 'Jane Admin', role: 'Org Admin', tone: 'bg-purple-100 text-purple-700' },
                  { name: 'Carlos Recruiter', role: 'Recruiter', tone: 'bg-blue-100 text-blue-700' },
                  { name: 'Laura Hiring', role: 'Hiring Manager', tone: 'bg-emerald-100 text-emerald-700' },
                ].map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-700 text-white text-sm font-semibold flex items-center justify-center">
                        {member.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-dark-text">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.role}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${member.tone}`}>
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
        <SectionHeading
          title={t('landing.pricingTitle')}
          description={t('landing.pricingDescription')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {pricingPlanKeys.map((planKey) => {
            const isPopular = planKey === 'growth';
            const price = pricingPlanPrices[planKey];

            return (
              <Card
                key={planKey}
                className={`p-6 relative ${isPopular ? 'border-2 border-primary shadow-lg shadow-purple-500/10' : ''}`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {t('pricing.mostPopular')}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-dark-text mb-2">{t(`pricing.${planKey}`)}</h3>
                <p className="text-sm text-gray-500 mb-4 min-h-[40px]">
                  {t(`pricing.${planKey}Description`)}
                </p>
                <div className="mb-5">
                  <span className="text-3xl font-bold text-dark-text">${price}</span>
                  <span className="text-gray-600">{t('pricing.perMonth')}</span>
                </div>
                <Link to="/pricing">
                  <Button variant={isPopular ? 'primary' : 'outline'} className="w-full">
                    {t('landing.learnMore')}
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500 mb-4">{t('pricing.trial')}</p>
          <Link to="/pricing">
            <Button variant="outline" size="lg">
              {t('landing.viewAllPricing')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-800" aria-hidden="true" />
        <LandingBackground />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">{t('landing.ctaTitle')}</h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">{t('landing.ctaDescription')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-purple-50">
                {t('landing.ctaButton')}
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10"
              >
                {t('common.login')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

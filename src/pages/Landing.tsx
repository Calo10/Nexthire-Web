import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Card from '../components/Card';

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div>
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          <h1 className="text-5xl lg:text-6xl font-bold text-dark-text mb-6">
            {t('landing.heroTitle')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('landing.heroDescription')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login">
              <Button size="lg">{t('common.getStarted')}</Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg">{t('landing.viewPricing')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-dark-text mb-4">
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('landing.featuresDescription')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-dark-text mb-2">{t('landing.jobs')}</h3>
            <p className="text-gray-600">
              {t('landing.jobsDescription')}
            </p>
          </Card>
          <Card className="p-8 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-dark-text mb-2">{t('landing.pipeline')}</h3>
            <p className="text-gray-600">
              {t('landing.pipelineDescription')}
            </p>
          </Card>
          <Card className="p-8 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-dark-text mb-2">{t('landing.candidates')}</h3>
            <p className="text-gray-600">
              {t('landing.candidatesDescription')}
            </p>
          </Card>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-dark-text mb-4">
            {t('landing.pricingTitle')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('landing.pricingDescription')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-dark-text mb-2">{t('pricing.free')}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-dark-text">$0</span>
              <span className="text-gray-600">{t('pricing.perMonth')}</span>
            </div>
            <Link to="/pricing">
              <Button variant="outline" className="w-full">{t('landing.learnMore')}</Button>
            </Link>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-dark-text mb-2">{t('pricing.starter')}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-dark-text">$12</span>
              <span className="text-gray-600">{t('pricing.perMonth')}</span>
            </div>
            <Link to="/pricing">
              <Button variant="outline" className="w-full">{t('landing.learnMore')}</Button>
            </Link>
          </Card>
          <Card className="p-6 border-2 border-primary">
            <div className="text-xs font-semibold text-primary mb-2">{t('pricing.mostPopular')}</div>
            <h3 className="text-lg font-semibold text-dark-text mb-2">{t('pricing.growth')}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-dark-text">$29</span>
              <span className="text-gray-600">{t('pricing.perMonth')}</span>
            </div>
            <Link to="/pricing">
              <Button className="w-full">{t('landing.learnMore')}</Button>
            </Link>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-dark-text mb-2">{t('pricing.pro')}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-dark-text">$79</span>
              <span className="text-gray-600">{t('pricing.perMonth')}</span>
            </div>
            <Link to="/pricing">
              <Button variant="outline" className="w-full">{t('landing.learnMore')}</Button>
            </Link>
          </Card>
        </div>
        <div className="text-center mt-12">
          <Link to="/pricing">
            <Button variant="outline" size="lg">{t('landing.viewAllPricing')}</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}


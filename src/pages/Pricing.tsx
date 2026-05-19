import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../components/Button';
import Card from '../components/Card';

interface Plan {
  key: 'free' | 'starter' | 'growth' | 'pro';
  price: number;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    key: 'free',
    price: 0,
  },
  {
    key: 'starter',
    price: 12,
  },
  {
    key: 'growth',
    price: 29,
    popular: true,
  },
  {
    key: 'pro',
    price: 79,
  },
];

export default function Pricing() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold text-dark-text mb-4">
          {t('pricing.title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('pricing.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {plans.map((plan) => {
          const features = t(`pricing.features.${plan.key}`, { returnObjects: true }) as Record<string, string>;
          const featureKeys = Object.keys(features).sort();
          
          return (
            <Card
              key={plan.key}
              className={`p-8 relative ${plan.popular ? 'border-2 border-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {t('pricing.mostPopular')}
                  </span>
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-dark-text mb-2">
                  {t(`pricing.${plan.key}`)}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {t(`pricing.${plan.key}Description`)}
                </p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-dark-text">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-gray-600">{t('pricing.perMonth')}</span>
                  )}
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {featureKeys.map((key) => (
                  <li key={key} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-primary mr-2 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-600 text-sm">{features[key]}</span>
                  </li>
                ))}
              </ul>
              <Link to="/login">
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {t('common.getStarted')}
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <p className="text-gray-600 mb-4">
          {t('pricing.trial')}
        </p>
        <Link to="/login">
          <Button variant="outline" size="lg">
            {t('pricing.startTrial')}
          </Button>
        </Link>
      </div>
    </div>
  );
}


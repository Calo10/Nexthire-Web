import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ErrorMessage from '../../../../components/ErrorMessage';
import { onboardingsApi } from '../../api/onboardingsApi';
import type { OnboardingActivity } from '../../models/onboarding';
import { apiErrorMessage, formatDateTime } from '../../utils/employeeFormat';

type Props = {
  onboardingId: string;
  locale: string;
  refreshKey?: number;
};

export default function OnboardingActivityPanel({ onboardingId, locale, refreshKey = 0 }: Props) {
  const { t } = useTranslation();
  const [items, setItems] = useState<OnboardingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    onboardingsApi
      .activity(onboardingId, 50)
      .then((res) => {
        if (!cancelled) setItems(res);
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, t('coreHr.onboarding.activity.loadError')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onboardingId, refreshKey, t]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }
  if (error) return <ErrorMessage message={error} />;
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
        {t('coreHr.onboarding.activity.empty')}
      </p>
    );
  }
  return (
    <ol className="space-y-4 border-l border-gray-200 pl-4">
      {items.map((a) => (
        <li key={a.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal-500" />
          <p className="text-sm text-dark-text">{a.summary}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {a.createdByName ? `${a.createdByName} · ` : ''}
            {formatDateTime(a.createdAt, locale)}
          </p>
        </li>
      ))}
    </ol>
  );
}

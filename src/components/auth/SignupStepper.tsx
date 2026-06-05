import { useTranslation } from 'react-i18next';

export type SignupStep = 1 | 2;

export default function SignupStepper({ current }: { current: SignupStep }) {
  const { t } = useTranslation();
  const steps: { n: SignupStep; label: string }[] = [
    { n: 1, label: t('register.steps.trial') },
    { n: 2, label: t('register.steps.email') },
  ];

  return (
    <nav aria-label={t('register.steps.aria')} className="mb-6">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, idx) => {
          const done = step.n < current;
          const active = step.n === current;
          return (
            <li key={step.n} className="flex flex-1 items-center min-w-0">
              <div className="flex flex-col items-center flex-1 min-w-0">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold border-2 transition-colors ${
                    active
                      ? 'border-primary bg-primary text-white'
                      : done
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {done ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.n
                  )}
                </span>
                <span
                  className={`mt-1.5 text-[10px] sm:text-xs font-medium text-center truncate w-full px-0.5 ${
                    active ? 'text-primary' : done ? 'text-gray-700' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 ? (
                <div
                  className={`h-0.5 flex-1 mx-1 mb-5 min-w-[12px] max-w-[60px] ${done || active ? 'bg-primary/40' : 'bg-gray-200'}`}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

import { useTranslation } from 'react-i18next';
import type { LoginOrganizationChoice } from '../../contexts/AuthContext';

type Props = {
  organizations: LoginOrganizationChoice[];
  isLoading: boolean;
  error: string | null;
  onSelect: (organizationId: string) => void;
};

export default function OrganizationSelectStep({ organizations, isLoading, error, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-dark-text">{t('login.chooseOrganization')}</h2>
        <p className="mt-2 text-sm text-gray-600">{t('login.chooseOrganizationHint')}</p>
      </div>
      {error ? <p className="text-sm text-red-600 text-center">{error}</p> : null}
      <div className="space-y-2">
        {organizations.map((organization) => {
          const suspended = organization.status.toLowerCase() === 'suspended';
          return (
            <button
              key={organization.id}
              type="button"
              disabled={isLoading}
              onClick={() => onSelect(organization.id)}
              className="w-full rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-primary hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="block font-medium text-dark-text">{organization.name}</span>
              {suspended ? (
                <span className="mt-1 block text-xs font-medium text-amber-700">{t('login.organizationSuspended')}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

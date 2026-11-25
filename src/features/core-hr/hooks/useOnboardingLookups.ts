import { useCallback, useEffect, useState } from 'react';
import { orgUsersApi } from '../../../api/orgUsersApi';
import { orgUserDisplayName } from '../../../types/orgUsers';
import { onboardingTemplatesApi } from '../api/onboardingTemplatesApi';
import type { OnboardingTemplateListItem } from '../models/onboarding';

export type OnboardingOwnerOption = { id: string; name: string };

export type OnboardingLookups = {
  owners: OnboardingOwnerOption[];
  templates: OnboardingTemplateListItem[];
  loading: boolean;
  reload: () => Promise<void>;
};

/** Org users (owners / assignees) and active templates used by filters, wizard and editors. */
export function useOnboardingLookups(enabled = true): OnboardingLookups {
  const [owners, setOwners] = useState<OnboardingOwnerOption[]>([]);
  const [templates, setTemplates] = useState<OnboardingTemplateListItem[]>([]);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    setLoading(true);
    const [users, tpls] = await Promise.allSettled([orgUsersApi.list(), onboardingTemplatesApi.list()]);
    if (users.status === 'fulfilled') {
      setOwners(
        users.value
          .map((u) => ({ id: u.id, name: orgUserDisplayName(u) }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    }
    if (tpls.status === 'fulfilled') {
      setTemplates([...tpls.value].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { owners, templates, loading, reload };
}

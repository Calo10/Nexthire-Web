import { useCallback, useEffect, useState } from 'react';
import { orgUsersApi } from '../../../api/orgUsersApi';
import { orgUserDisplayName } from '../../../types/orgUsers';
import { offboardingTemplatesApi } from '../api/offboardingTemplatesApi';
import type { OffboardingTemplateListItem } from '../models/offboarding';

export type OffboardingOwnerOption = { id: string; name: string };

export type OffboardingLookups = {
  owners: OffboardingOwnerOption[];
  templates: OffboardingTemplateListItem[];
  loading: boolean;
  reload: () => Promise<void>;
};

/** Org users (owners / assignees) and active templates used by filters, wizard and editors. */
export function useOffboardingLookups(enabled = true): OffboardingLookups {
  const [owners, setOwners] = useState<OffboardingOwnerOption[]>([]);
  const [templates, setTemplates] = useState<OffboardingTemplateListItem[]>([]);
  const [loading, setLoading] = useState(enabled);

  const reload = useCallback(async () => {
    setLoading(true);
    const [users, tpls] = await Promise.allSettled([orgUsersApi.list(), offboardingTemplatesApi.list()]);
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

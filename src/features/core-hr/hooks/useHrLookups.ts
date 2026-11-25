import { useCallback, useEffect, useState } from 'react';
import { hrLookupsApi } from '../api/hrLookupsApi';
import type { HrLookup, WorkLocation } from '../models/employee';

export type HrLookupsState = {
  departments: HrLookup[];
  jobTitles: HrLookup[];
  locations: WorkLocation[];
  employmentTypes: HrLookup[];
  loading: boolean;
  error: boolean;
  reload: () => Promise<void>;
  addDepartment: (name: string) => Promise<HrLookup>;
  addJobTitle: (name: string) => Promise<HrLookup>;
  addLocation: (name: string) => Promise<WorkLocation>;
};

const upsert = <T extends HrLookup>(list: T[], item: T): T[] =>
  [...list.filter((x) => x.id !== item.id), item].sort((a, b) => a.name.localeCompare(b.name));

export function useHrLookups(enabled = true): HrLookupsState {
  const [departments, setDepartments] = useState<HrLookup[]>([]);
  const [jobTitles, setJobTitles] = useState<HrLookup[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<HrLookup[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [d, j, l, t] = await Promise.all([
        hrLookupsApi.departments(),
        hrLookupsApi.jobTitles(),
        hrLookupsApi.locations(),
        hrLookupsApi.employmentTypes(),
      ]);
      setDepartments(d);
      setJobTitles(j);
      setLocations(l);
      setEmploymentTypes(t);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  const addDepartment = useCallback(async (name: string) => {
    const created = await hrLookupsApi.createDepartment({ name: name.trim() });
    setDepartments((list) => upsert(list, created));
    return created;
  }, []);
  const addJobTitle = useCallback(async (name: string) => {
    const created = await hrLookupsApi.createJobTitle({ name: name.trim() });
    setJobTitles((list) => upsert(list, created));
    return created;
  }, []);
  const addLocation = useCallback(async (name: string) => {
    const created = await hrLookupsApi.createLocation({ name: name.trim() });
    setLocations((list) => upsert(list, created));
    return created;
  }, []);

  return {
    departments,
    jobTitles,
    locations,
    employmentTypes,
    loading,
    error,
    reload,
    addDepartment,
    addJobTitle,
    addLocation,
  };
}

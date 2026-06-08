import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { resolveTenantId } from '../lib/resolveTenantId';
import { useJobs } from './useJobs';
import type { Job } from '../types/dashboard';

function jobMatchesDateRange(createdAt: string | undefined, range: string): boolean {
  if (range === 'all') return true;
  if (!createdAt) return false;

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;

  let days = 7;
  if (range === '30d') days = 30;
  else if (range === '90d') days = 90;
  else if (range !== '7d') return true;

  const from = new Date();
  from.setDate(from.getDate() - days);
  return created.getTime() >= from.getTime();
}

export function useJobsPage() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: authLoading, org } = useAuth();
  const publicJobsPath = useMemo(() => {
    const orgSegment = resolveTenantId(org);
    if (!orgSegment) return null;
    return `/org/${encodeURIComponent(orgSegment)}/jobs`;
  }, [org]);
  const { data: jobs, isLoading: jobsLoading, error: jobsError, refetch: refetchJobs } = useJobs(
    isAuthenticated && !authLoading,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const dateFilterRef = useRef<HTMLDivElement>(null);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const filtersMenuRef = useRef<HTMLDivElement>(null);

  const filteredJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return [];

    return jobs.filter((job: Job) => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || job.status.toLowerCase() === selectedStatus.toLowerCase();
      const matchesDate = jobMatchesDateRange(job.createdAt, selectedDate);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [jobs, searchQuery, selectedStatus, selectedDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setShowDateFilter(false);
      }
      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target as Node)) {
        setShowStatusFilter(false);
      }
      if (filtersMenuRef.current && !filtersMenuRef.current.contains(event.target as Node)) {
        setShowFiltersMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dateOptions = [
    { value: 'all', label: t('dashboard.dateRange.allTime') },
    { value: '7d', label: t('dashboard.dateRange.last7Days') },
    { value: '30d', label: t('dashboard.dateRange.last30Days') },
    { value: '90d', label: t('dashboard.dateRange.last90Days') },
  ];

  const statusOptions = [
    { value: 'all', label: t('jobs.status.all') },
    { value: 'open', label: t('jobs.status.open') },
    { value: 'closed', label: t('jobs.status.closed') },
    { value: 'draft', label: t('jobs.status.draft') },
    { value: 'on_hold', label: t('jobs.status.on_hold') },
  ];

  const selectedDateLabel = dateOptions.find((opt) => opt.value === selectedDate)?.label || dateOptions[0].label;
  const selectedStatusLabel = statusOptions.find((opt) => opt.value === selectedStatus)?.label || statusOptions[0].label;

  const openJobDrawer = (job: Job) => {
    setSelectedJob(job);
    setIsJobDrawerOpen(true);
  };

  return {
    t,
    publicJobsPath,
    jobsLoading,
    jobsError,
    refetchJobs,
    searchQuery,
    setSearchQuery,
    showDateFilter,
    setShowDateFilter,
    showStatusFilter,
    setShowStatusFilter,
    showFiltersMenu,
    setShowFiltersMenu,
    selectedDate,
    setSelectedDate,
    selectedStatus,
    setSelectedStatus,
    isNewJobModalOpen,
    setIsNewJobModalOpen,
    isJobDrawerOpen,
    setIsJobDrawerOpen,
    selectedJob,
    setSelectedJob,
    dateFilterRef,
    statusFilterRef,
    filtersMenuRef,
    filteredJobs,
    dateOptions,
    statusOptions,
    selectedDateLabel,
    selectedStatusLabel,
    openJobDrawer,
  };
}

export type JobsPageState = ReturnType<typeof useJobsPage>;

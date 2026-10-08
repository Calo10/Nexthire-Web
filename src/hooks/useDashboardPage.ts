import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardSummary } from './useDashboardSummary';
import { useCandidates } from './useCandidates';
import { useApplicationsByStage } from './useApplicationsByStage';
import { useActivityTrend } from './useActivityTrend';
import { useUpcomingTasks } from './useUpcomingTasks';
import { useJobs } from './useJobs';
import { useCurrentDisplayName } from './useCurrentDisplayName';
import type { Job, Task } from '../types/dashboard';

export function useDashboardPage() {
  const { t } = useTranslation();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const [dateRange, setDateRange] = useState('7d');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  const filterParams = useMemo(() => {
    if (dateRange === 'all') {
      return { from: '', to: '' };
    }

    const now = new Date();
    const to = now.toISOString();
    const days = dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : dateRange === '1y' ? 365 : 7;
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - days);

    return { from: fromDate.toISOString(), to };
  }, [dateRange]);

  const shouldFetch = isAuthenticated && !authLoading;

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useDashboardSummary(
    shouldFetch ? filterParams : undefined,
  );
  const { data: candidates, isLoading: candidatesLoading, error: candidatesError } = useCandidates(
    shouldFetch ? filterParams : undefined,
  );
  const { data: applicationsByStage, isLoading: applicationsLoading, error: applicationsError } =
    useApplicationsByStage(shouldFetch ? filterParams : undefined);
  const { data: activityTrend, isLoading: activityLoading, error: activityError } = useActivityTrend(
    shouldFetch ? filterParams : undefined,
  );
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useUpcomingTasks(
    shouldFetch ? filterParams : undefined,
  );
  const { data: allJobs, isLoading: jobsLoading, error: jobsError } = useJobs(shouldFetch);
  const myJobs = useMemo(
    () => (allJobs || []).filter((job) => String(job.status || '').toLowerCase() === 'open'),
    [allJobs],
  );

  const interviewStageCount = useMemo(() => {
    if (applicationsLoading || applicationsError) return null;
    return (applicationsByStage || [])
      .filter((s) => String(s.stageName || '').toLowerCase().includes('interview'))
      .reduce((sum, s) => sum + (Number(s.count) || 0), 0);
  }, [applicationsByStage, applicationsLoading, applicationsError]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setShowDateFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const getStageInfo = (stageName: string) => {
    const normalized = stageName.toLowerCase();
    if (normalized.includes('screen')) {
      return { color: 'bg-blue-100 text-blue-700', translation: stageName };
    }
    if (normalized.includes('applied')) {
      return { color: 'bg-purple-100 text-purple-700', translation: stageName };
    }
    if (normalized.includes('interview')) {
      return { color: 'bg-orange-100 text-orange-700', translation: stageName };
    }
    if (normalized.includes('offer')) {
      return { color: 'bg-amber-100 text-amber-700', translation: stageName };
    }
    if (normalized.includes('hired')) {
      return { color: 'bg-green-100 text-green-700', translation: stageName };
    }
    return { color: 'bg-gray-100 text-gray-700', translation: stageName };
  };

  const getJobStatusColor = (status: Job['status']) => {
    const statusMap: Record<string, string> = {
      open: 'bg-yellow-100 text-yellow-700',
      closed: 'bg-gray-100 text-gray-700',
      draft: 'bg-slate-100 text-slate-700',
      on_hold: 'bg-purple-100 text-purple-700',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  const getTaskStatusColor = (status: Task['status']) => {
    const statusMap: Record<string, string> = {
      open: 'bg-yellow-100 text-yellow-700',
      todo: 'bg-yellow-100 text-yellow-700',
      in_progress: 'bg-orange-100 text-orange-700',
      completed: 'bg-green-100 text-green-700',
      done: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      blocked: 'bg-amber-100 text-amber-700',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-700';
  };

  const formatStatusLabel = (raw: string) => {
    const s = String(raw || '').trim();
    if (!s) return '';
    return s
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDateShort = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const dateRangeOptions = [
    { value: '7d', label: t('dashboard.dateRange.last7Days') },
    { value: '30d', label: t('dashboard.dateRange.last30Days') },
    { value: '90d', label: t('dashboard.dateRange.last90Days') },
    { value: 'all', label: t('dashboard.dateRange.allTime') },
  ];

  const selectedDateRangeLabel =
    dateRangeOptions.find((opt) => opt.value === dateRange)?.label || t('dashboard.dateRange.last7Days');

  const displayName = useCurrentDisplayName();
  const welcomeTitle = t('dashboard.welcome').replace('Carlos', displayName);

  return {
    t,
    user,
    authLoading,
    dateRange,
    setDateRange,
    showUserMenu,
    setShowUserMenu,
    showDateFilter,
    setShowDateFilter,
    userMenuRef,
    dateFilterRef,
    summary,
    summaryLoading,
    summaryError,
    candidates,
    candidatesLoading,
    candidatesError,
    applicationsByStage,
    applicationsLoading,
    applicationsError,
    activityTrend,
    activityLoading,
    activityError,
    myJobs,
    jobsLoading,
    jobsError,
    tasks,
    tasksLoading,
    tasksError,
    allJobs,
    interviewStageCount,
    handleLogout,
    getStageInfo,
    getJobStatusColor,
    getTaskStatusColor,
    formatStatusLabel,
    formatDateShort,
    dateRangeOptions,
    selectedDateRangeLabel,
    welcomeTitle,
  };
}

export type DashboardPageState = ReturnType<typeof useDashboardPage>;

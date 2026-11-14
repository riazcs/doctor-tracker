'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { DashboardStats, StatsRange } from '@/lib/types';

export const RANGE_OPTIONS: { value: StatsRange; label: string; long: string }[] = [
  { value: '7d', label: '7D', long: 'last 7 days' },
  { value: '30d', label: '30D', long: 'last 30 days' },
  { value: '90d', label: '90D', long: 'last 90 days' },
  { value: '12m', label: '12M', long: 'last 12 months' },
];

export function useDashboardStats(range: StatsRange) {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.stats(range),
    queryFn: ({ signal }) => api<{ data: DashboardStats }>('/stats', { params: { range }, signal }).then((r) => r.data),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { User } from '@/lib/types';
import type { LoginValues } from '@/lib/validators';

export function useCurrentUser() {
  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => api<{ data: User }>('/auth/me', { signal }).then((r) => r.data),
    staleTime: Infinity,
  });
  return { user: query.data, isAdmin: query.data?.role === 'admin', isLoading: query.isLoading };
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: LoginValues) => api<{ data: User }>('/auth/login', { method: 'POST', body: values }),
    onSuccess: ({ data }) => queryClient.setQueryData(queryKeys.me, data),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      queryClient.clear(); // drop all cached PHI from memory
      router.replace('/login');
    },
  });
}

'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Paginated, Patient } from '@/lib/types';
import type { PatientValues } from '@/lib/validators';

export const PATIENT_FILTER_DEFAULTS = {
  page: 1,
  limit: 10,
  search: '',
  condition: '',
  status: '',
  gender: '',
  doctor: '',
  from: '',
  to: '',
  sort: 'newest',
};
export type PatientFilters = typeof PATIENT_FILTER_DEFAULTS;

export const PATIENT_SORT_OPTIONS = [
  { value: 'newest', label: 'Recently admitted' },
  { value: 'oldest', label: 'Oldest admission' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'age', label: 'Age (oldest)' },
];

export function usePatients(filters: PatientFilters) {
  return useQuery({
    queryKey: queryKeys.patients.list(filters),
    queryFn: ({ signal }) => api<Paginated<Patient>>('/patients', { params: filters, signal }),
    placeholderData: keepPreviousData,
  });
}

export function usePatientFacets() {
  return useQuery({
    queryKey: queryKeys.patients.facets,
    queryFn: ({ signal }) => api<{ data: { conditions: string[] } }>('/patients/facets', { signal }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.patients.all }),
      qc.invalidateQueries({ queryKey: queryKeys.doctors.all }),
      qc.invalidateQueries({ queryKey: ['stats'] }),
    ]);
}

export function useUpdatePatient() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<PatientValues> }) =>
      api<{ data: Patient }>(`/patients/${id}`, { method: 'PATCH', body: values }),
    onSuccess: invalidate,
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/patients/${id}`, { method: 'DELETE' }),
    // Optimistic removal: the row disappears immediately; rolled back if the request fails.
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.patients.all });
      const snapshots = qc.getQueriesData<Paginated<Patient>>({ queryKey: queryKeys.patients.all });
      qc.setQueriesData<Paginated<Patient>>({ queryKey: ['patients', 'list'] }, (old) =>
        old ? { ...old, data: old.data.filter((p) => p._id !== id), meta: { ...old.meta, total: old.meta.total - 1 } } : old,
      );
      return { snapshots };
    },
    onError: (_err, _id, ctx) => ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: invalidate,
  });
}

'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Doctor, Paginated, Patient } from '@/lib/types';
import type { DoctorValues, PatientValues } from '@/lib/validators';

export const DOCTOR_FILTER_DEFAULTS = {
  page: 1,
  limit: 10,
  search: '',
  specialization: '',
  hospital: '',
  from: '',
  to: '',
  sort: 'newest',
};
export type DoctorFilters = typeof DOCTOR_FILTER_DEFAULTS;

export const DOCTOR_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'patients', label: 'Most patients' },
];

export function useDoctors(filters: DoctorFilters) {
  return useQuery({
    queryKey: queryKeys.doctors.list(filters),
    queryFn: ({ signal }) => api<Paginated<Doctor>>('/doctors', { params: filters, signal }),
    placeholderData: keepPreviousData, // keep the old page visible while the next one loads
  });
}

export function useDoctorFacets() {
  return useQuery({
    queryKey: queryKeys.doctors.facets,
    queryFn: ({ signal }) => api<{ data: { specializations: string[]; hospitals: string[] } }>('/doctors/facets', { signal }).then((r) => r.data),
    staleTime: 5 * 60_000,
  });
}

export function useDoctorOptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.doctors.options,
    queryFn: ({ signal }) => api<{ data: Pick<Doctor, '_id' | 'name' | 'specialization'>[] }>('/doctors/options', { signal }).then((r) => r.data),
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: ({ signal }) => api<{ data: Doctor }>(`/doctors/${id}`, { signal }).then((r) => r.data),
  });
}

export function useDoctorPatients(id: string, params: { page: number; limit: number; search: string }) {
  return useQuery({
    queryKey: queryKeys.doctors.patients(id, params),
    queryFn: ({ signal }) => api<Paginated<Patient>>(`/doctors/${id}/patients`, { params, signal }),
    placeholderData: keepPreviousData,
  });
}

/** Any doctor/patient write can affect lists, counts and dashboard numbers. */
function useInvalidateAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.doctors.all }),
      qc.invalidateQueries({ queryKey: queryKeys.patients.all }),
      qc.invalidateQueries({ queryKey: ['stats'] }),
    ]);
}

export function useSaveDoctor(id?: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (values: DoctorValues) =>
      id
        ? api<{ data: Doctor }>(`/doctors/${id}`, { method: 'PATCH', body: values })
        : api<{ data: Doctor }>('/doctors', { method: 'POST', body: values }),
    onSuccess: invalidate,
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/doctors/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, id) =>
      Promise.all([
        // Skip the deleted doctor's own queries — refetching them would just 404.
        qc.invalidateQueries({
          queryKey: queryKeys.doctors.all,
          predicate: (q) => !(q.queryKey[1] === 'detail' && q.queryKey[2] === id),
        }),
        qc.invalidateQueries({ queryKey: ['stats'] }),
      ]),
  });
}

export function useAddPatient(doctorId: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (values: Omit<PatientValues, 'doctor'>) =>
      api<{ data: Patient }>(`/doctors/${doctorId}/patients`, { method: 'POST', body: values }),
    onSuccess: invalidate,
  });
}

export function useRemoveDoctorPatient(doctorId: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (patientId: string) => api<void>(`/doctors/${doctorId}/patients/${patientId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

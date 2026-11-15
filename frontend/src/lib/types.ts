export type Role = 'admin' | 'viewer';

export interface User {
  sample?: boolean;
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
  updatedAt: string;
}

export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export const PATIENT_STATUSES = ['stable', 'under_observation', 'critical', 'recovered'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export interface Patient {
  _id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string | null;
  condition: string;
  status: PatientStatus;
  admissionDate: string;
  notes?: string;
  doctor: Pick<Doctor, '_id' | 'name' | 'specialization' | 'hospital'> | null;
  createdAt: string;
}

export type StatsRange = '7d' | '30d' | '90d' | '12m';

export interface DashboardStats {
  range: StatsRange;
  unit: 'day' | 'week' | 'month';
  totals: {
    doctors: number;
    patients: number;
    avgPatientsPerDoctor: number;
    newPatients: number;
    newPatientsChange: number | null;
    criticalPatients: number;
    newDoctors: number;
  };
  trend: { date: string; patients: number; critical: number }[];
  byCondition: { name: string; count: number }[];
  byStatus: { name: PatientStatus; count: number }[];
  byGender: { name: Gender; count: number }[];
  byAge: { name: string; count: number }[];
  bySpecialization: { name: string; doctors: number; patients: number }[];
  topDoctors: { id: string; name: string; specialization: string; hospital: string; patients: number }[];
}

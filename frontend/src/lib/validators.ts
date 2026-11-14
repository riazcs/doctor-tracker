import { z } from 'zod';
import { GENDERS, PATIENT_STATUSES } from './types';

const required = (label: string, max = 120) => z.string().trim().min(1, `${label} is required`).max(max);
const phone = z
  .string()
  .trim()
  .min(6, 'Phone number is too short')
  .max(30)
  .regex(/^[+\d][\d\s\-().]*$/, 'Use digits, spaces, + - ( ) only');

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const doctorSchema = z.object({
  name: required('Name'),
  specialization: required('Specialization', 80),
  hospital: required('Hospital'),
  phone,
  email: z.email('Enter a valid email address'),
});
export type DoctorValues = z.infer<typeof doctorSchema>;

export const patientSchema = z.object({
  name: required('Name'),
  age: z.coerce.number<string | number>().int('Whole years only').min(0, 'Invalid age').max(130, 'Invalid age'),
  gender: z.enum(GENDERS, 'Select a gender'),
  phone,
  email: z.union([z.email('Enter a valid email address'), z.literal('')]).optional(),
  condition: required('Condition', 80),
  status: z.enum(PATIENT_STATUSES),
  admissionDate: z.iso.date('Pick a date'),
  notes: z.string().trim().max(1000).optional(),
  doctor: z.string().optional(),
});
export type PatientValues = z.infer<typeof patientSchema>;

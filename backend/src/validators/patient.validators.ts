import { z } from 'zod';
import { GENDERS, PATIENT_STATUSES } from '../models/Patient.js';
import { emailField, isoDate, nameField, objectId, paginationQuery, phoneField, trimmed, withDateOrder } from './common.js';

const patientFields = {
  name: nameField,
  age: z.coerce.number().int().min(0).max(130),
  gender: z.enum(GENDERS),
  phone: phoneField,
  email: z.union([emailField, z.literal('')]).optional(),
  condition: trimmed(80),
  status: z.enum(PATIENT_STATUSES).default('stable'),
  admissionDate: isoDate.optional(),
  notes: z.string().trim().max(1000).optional(),
};

/** Body for POST /doctors/:id/patients — doctor comes from the URL. */
export const patientBody = z.object(patientFields);
/** Body for PATCH /patients/:id — the doctor may be reassigned. */
export const patientUpdateBody = z
  .object({ ...patientFields, status: z.enum(PATIENT_STATUSES), doctor: objectId })
  .partial()
  .refine((b) => Object.keys(b).length > 0, 'Nothing to update');

export const PATIENT_SORTS = {
  newest: { admissionDate: -1 },
  oldest: { admissionDate: 1 },
  name: { name: 1 },
  age: { age: -1 },
} as const;

export const patientListQuery = withDateOrder(
  paginationQuery.extend({
    condition: z.string().trim().max(80).optional(),
    status: z.enum(PATIENT_STATUSES).optional(),
    gender: z.enum(GENDERS).optional(),
    doctor: objectId.optional(),
    sort: z.enum(Object.keys(PATIENT_SORTS) as [keyof typeof PATIENT_SORTS]).default('newest'),
  }),
);
export type PatientListQuery = z.infer<typeof patientListQuery>;

export const statsQuery = z.object({
  range: z.enum(['7d', '30d', '90d', '12m']).default('30d'),
});

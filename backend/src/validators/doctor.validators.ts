import { z } from 'zod';
import { emailField, nameField, paginationQuery, phoneField, trimmed, withDateOrder } from './common.js';

export const doctorBody = z.object({
  name: nameField,
  specialization: trimmed(80),
  hospital: trimmed(120),
  phone: phoneField,
  email: emailField,
});
export const doctorUpdateBody = doctorBody.partial().refine((b) => Object.keys(b).length > 0, 'Nothing to update');

export const DOCTOR_SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  patients: { patientCount: -1 },
} as const;

export const doctorListQuery = withDateOrder(
  paginationQuery.extend({
    specialization: z.string().trim().max(80).optional(),
    hospital: z.string().trim().max(120).optional(),
    sort: z.enum(Object.keys(DOCTOR_SORTS) as [keyof typeof DOCTOR_SORTS]).default('newest'),
  }),
);
export type DoctorListQuery = z.infer<typeof doctorListQuery>;

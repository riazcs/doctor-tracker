import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

// Friendlier message for missing fields than zod's default "expected string, received undefined".
z.config({ customError: (issue) => (issue.input === undefined ? 'This field is required' : undefined) });

export const objectId = z.string().refine((v) => isValidObjectId(v), 'Invalid id');
export const idParams = z.object({ id: objectId });

const trimmed = (max: number) => z.string().trim().min(1, 'Required').max(max);
export const nameField = trimmed(120);
export const phoneField = z
  .string()
  .trim()
  .min(6, 'Phone number is too short')
  .max(30)
  .regex(/^[+\d][\d\s\-().]*$/, 'Invalid phone number');
export const emailField = z.email('Invalid email').trim().toLowerCase().max(160);
export const isoDate = z.iso.date('Use YYYY-MM-DD');

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export const withDateOrder = <T extends z.ZodType<{ from?: string; to?: string }>>(schema: T) =>
  schema.refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '"from" must be on or before "to"',
    path: ['to'],
  });

export { trimmed };

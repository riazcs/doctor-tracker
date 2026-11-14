import type { z } from 'zod';

/** Parses input with a zod schema; a thrown ZodError is turned into a 400 by the error handler. */
export const parse = <S extends z.ZodType>(schema: S, input: unknown): z.output<S> => schema.parse(input);

import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError, errorMessage } from './api';

/** Maps API validation/conflict errors onto form fields; anything else becomes a toast. */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, fields: readonly string[]) {
  if (err instanceof ApiError && err.details?.length) {
    let mapped = false;
    for (const d of err.details) {
      if (fields.includes(d.field)) {
        setError(d.field as Path<T>, { type: 'server', message: d.message }, { shouldFocus: !mapped });
        mapped = true;
      }
    }
    if (mapped) return;
  }
  toast.error(errorMessage(err));
}

'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

type Primitive = string | number;

/**
 * Keeps list state (search, filters, sort, page) in the URL query string.
 * → shareable/bookmarkable links, working back/forward buttons, state survives refresh.
 * Values equal to their default are omitted to keep URLs short.
 *
 * `defaults` must be a module-level constant (stable reference).
 */
export function useUrlState<T extends Record<string, Primitive>>(defaults: T) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state = useMemo(() => {
    const out: Record<string, Primitive> = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const raw = searchParams.get(key);
      if (raw === null) continue;
      if (typeof defaults[key] === 'number') {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) out[key] = n;
      } else {
        out[key] = raw;
      }
    }
    return out as T;
  }, [searchParams, defaults]);

  /** Patch state. Any change other than `page` itself resets to page 1. */
  const setState = useCallback(
    (patch: Partial<T>) => {
      // Read the live URL rather than a captured snapshot so this callback stays stable.
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === '' || value === defaults[key]) next.delete(key);
        else next.set(key, String(value));
      }
      if (!('page' in patch)) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [defaults, pathname, router],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);

  const activeCount = useMemo(
    () => Object.keys(defaults).filter((k) => !['page', 'limit', 'sort', 'search'].includes(k) && state[k] !== defaults[k]).length,
    [defaults, state],
  );

  return { state, setState, reset, activeCount };
}

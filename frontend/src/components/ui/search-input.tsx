'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { controlClass } from './input';

interface SearchInputProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
}

/** Typing updates local state instantly; the (URL / network) update is debounced. */
export function SearchInput({ value, onSearch, placeholder = 'Search…', className, delay = 300 }: SearchInputProps) {
  const [local, setLocal] = useState(value);
  const [synced, setSynced] = useState(value);

  // External change (e.g. "Clear filters" or back button) → adopt it.
  if (value !== synced) {
    setSynced(value);
    setLocal(value);
  }

  useEffect(() => {
    if (local.trim() === value) return;
    const t = setTimeout(() => onSearch(local.trim()), delay);
    return () => clearTimeout(t);
  }, [local, value, delay, onSearch]);

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        role="searchbox"
        aria-label={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className={cn(controlClass, 'h-10 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden')}
      />
      {local && (
        <button
          type="button"
          onClick={() => {
            setLocal('');
            onSearch('');
          }}
          className="absolute top-1/2 right-2 rounded p-1 text-muted hover:text-fg"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';

interface FilterBarProps {
  search: ReactNode;
  /** Sort control — always visible */
  sort?: ReactNode;
  /** Filter controls — inline on desktop, collapsible on mobile */
  children: ReactNode;
  activeCount: number;
  onClear: () => void;
}

export function FilterBar({ search, sort, children, activeCount, onClear }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line p-4 sm:px-5">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">{search}</div>
        <Button
          variant="secondary"
          className="lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filter-panel"
        >
          <SlidersHorizontal />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-fg">{activeCount}</span>}
        </Button>
        {sort && <div className="hidden w-44 sm:block">{sort}</div>}
      </div>
      <div
        id="filter-panel"
        className={cn('mt-3 grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-3 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]', open ? 'grid' : 'hidden')}
      >
        {sort && <div className="sm:hidden">{sort}</div>}
        {children}
        {activeCount > 0 && (
          <Button variant="ghost" onClick={onClear} className="justify-self-start text-danger hover:text-danger">
            <X />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

/** Date range as two native date inputs (accessible, mobile-friendly pickers). */
export function DateRangeFilter({ from, to, onChange, label = 'Date' }: { from: string; to: string; onChange: (v: { from?: string; to?: string }) => void; label?: string }) {
  return (
    <fieldset className="col-span-1 grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 sm:col-span-2 lg:col-span-2">
      <legend className="sr-only">{label} range</legend>
      {(['from', 'to'] as const).map((key) => (
        <label key={key} className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-muted">{key === 'from' ? 'From' : 'To'}</span>
          <Input
            type="date"
            aria-label={`${label} ${key}`}
            className={key === 'from' ? 'pl-12' : 'pl-8'}
            value={key === 'from' ? from : to}
            min={key === 'to' ? from || undefined : undefined}
            max={key === 'from' ? to || undefined : undefined}
            onChange={(e) => onChange({ [key]: e.target.value })}
          />
        </label>
      ))}
    </fieldset>
  );
}

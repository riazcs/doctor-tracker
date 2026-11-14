'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo } from 'react';
import { formatNumber } from '@/lib/format';
import type { PageMeta } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from './button';

const PAGE_SIZES = [10, 20, 50];

/** 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(page: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

interface PaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  noun?: string;
}

export const Pagination = memo(function Pagination({ meta, onPageChange, onLimitChange, noun = 'results' }: PaginationProps) {
  const { page, limit, total, totalPages } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" className="flex flex-col-reverse items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row sm:px-5">
      <div className="flex items-center gap-3 text-[13px] text-muted">
        <span aria-live="polite">
          <span className="font-medium text-fg-2">{formatNumber(from)}–{formatNumber(to)}</span> of {formatNumber(total)} {noun}
        </span>
        <label className="hidden items-center gap-1.5 sm:flex">
          <span className="sr-only sm:not-sr-only">Rows</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-8 rounded-md border border-line bg-surface px-1.5 text-[13px] text-fg"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap-${i}`} className="w-6 text-center text-muted" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              className={cn(
                'h-8 min-w-8 rounded-md px-2 text-[13px] font-medium tabular-nums transition-colors',
                p === page ? 'bg-primary text-primary-fg' : 'text-fg-2 hover:bg-surface-2',
              )}
            >
              {p}
            </button>
          ),
        )}
        <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
});

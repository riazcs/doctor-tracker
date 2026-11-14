'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide below the `lg` breakpoint to keep tablets uncluttered */
  priority?: 'high' | 'low';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading: boolean;
  /** Background refetch (e.g. new page) — dims stale rows instead of flashing skeletons */
  isFetching?: boolean;
  /** Compact card layout used below the `md` breakpoint */
  mobileCard: (row: T) => ReactNode;
  empty: ReactNode;
  caption: string;
  onRowClick?: (row: T) => void;
}

/** Table on desktop, stacked cards on mobile — same data, layouts tuned per viewport. */
export function DataTable<T>({ columns, rows, rowKey, isLoading, isFetching, mobileCard, empty, caption, onRowClick }: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="divide-y divide-line" aria-busy="true" aria-label="Loading">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
          </div>
        ))}
      </div>
    );
  }
  if (!rows?.length) return <>{empty}</>;

  return (
    <div className={cn('transition-opacity duration-200', isFetching && 'pointer-events-none opacity-60')} aria-busy={isFetching || undefined}>
      <ul className="divide-y divide-line md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)}>{mobileCard(row)}</li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line bg-surface-2/60 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn('px-5 py-2.5 text-xs font-medium tracking-wide text-muted uppercase', col.priority === 'low' && 'hidden xl:table-cell', col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('group transition-colors hover:bg-surface-2/60', onRowClick && 'cursor-pointer')}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-5 py-3 align-middle', col.priority === 'low' && 'hidden xl:table-cell', col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

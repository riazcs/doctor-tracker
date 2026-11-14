'use client';

import { BarChart3, Table2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  /** Accessible tabular alternative to the chart */
  table: { columns: string[]; rows: (string | number)[][] };
  children: ReactNode;
  className?: string;
  legend?: ReactNode;
}

export function ChartCard({ title, description, table, children, className, legend }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader
        title={title}
        description={description}
        action={
          <button
            onClick={() => setShowTable((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
            aria-pressed={showTable}
          >
            {showTable ? <BarChart3 className="size-3.5" aria-hidden /> : <Table2 className="size-3.5" aria-hidden />}
            {showTable ? 'Chart' : 'Table'}
          </button>
        }
      />
      {legend && !showTable && <div className="px-5 pt-3">{legend}</div>}
      <div className="flex-1 px-3 pt-3 pb-4 sm:px-4">
        {showTable ? (
          <div className="max-h-72 overflow-auto px-2">
            <table className="w-full text-sm">
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  {table.columns.map((c, i) => (
                    <th key={c} scope="col" className={cn('py-2 font-medium', i > 0 && 'text-right')}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {table.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, i) => (
                      <td key={i} className={cn('py-1.5 text-fg-2', i > 0 && 'text-right tabular-nums')}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

export function LegendItem({ color, label, value, icon }: { color: string; label: string; value?: string; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-fg-2">
      <span aria-hidden className="size-2.5 rounded-sm" style={{ background: color }} />
      {icon}
      {label}
      {value && <span className="font-medium text-fg tabular-nums">{value}</span>}
    </span>
  );
}

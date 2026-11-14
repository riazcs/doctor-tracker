'use client';

import { formatNumber } from '@/lib/format';

interface TooltipPayloadItem {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

/** Shared tooltip: label in secondary ink, values in primary ink, color chip carries identity. */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  labelFormatter?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-36 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] shadow-pop">
      <p className="mb-1 text-muted">{labelFormatter ? labelFormatter(String(label)) : label}</p>
      {payload.map((item) => (
        <p key={String(item.dataKey)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-fg-2">
            <span className="size-2 rounded-full" style={{ background: item.color }} aria-hidden />
            {item.name}
          </span>
          <span className="font-semibold text-fg tabular-nums">{formatNumber(Number(item.value))}</span>
        </p>
      ))}
    </div>
  );
}

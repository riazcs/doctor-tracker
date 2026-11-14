import { AlertTriangle, ArrowDownRight, ArrowUpRight, CalendarPlus, Stethoscope, Users } from 'lucide-react';
import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/lib/format';
import type { DashboardStats } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TileProps {
  label: string;
  value: string;
  icon: typeof Users;
  footnote: React.ReactNode;
  tone?: 'default' | 'danger';
}

function Tile({ label, value, icon: Icon, footnote, tone = 'default' }: TileProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span className={cn('inline-flex size-8 items-center justify-center rounded-lg', tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary-soft-fg')}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
      <div className="mt-1.5 text-xs text-muted sm:text-[13px]">{footnote}</div>
    </Card>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="font-medium text-success">New</span>;
  const up = value >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-medium', up ? 'text-success' : 'text-danger')}>
      <Icon className="size-3.5" aria-hidden />
      <span className="sr-only">{up ? 'up' : 'down'}</span>
      {Math.abs(value)}%
    </span>
  );
}

export const StatTiles = memo(function StatTiles({ stats, rangeLabel }: { stats?: DashboardStats; rangeLabel: string }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-3 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
    );
  }
  const t = stats.totals;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <Tile label="Total doctors" value={formatNumber(t.doctors)} icon={Stethoscope} footnote={<>+{formatNumber(t.newDoctors)} joined in the {rangeLabel}</>} />
      <Tile label="Total patients" value={formatNumber(t.patients)} icon={Users} footnote={<>{t.avgPatientsPerDoctor} avg. per doctor</>} />
      <Tile
        label="New admissions"
        value={formatNumber(t.newPatients)}
        icon={CalendarPlus}
        footnote={
          <>
            <Delta value={t.newPatientsChange} /> vs previous period
          </>
        }
      />
      <Tile
        label="Critical cases"
        value={formatNumber(t.criticalPatients)}
        icon={AlertTriangle}
        tone="danger"
        footnote={<>{t.newPatients ? Math.round((t.criticalPatients / t.newPatients) * 100) : 0}% of admissions in the {rangeLabel}</>}
      />
    </div>
  );
});

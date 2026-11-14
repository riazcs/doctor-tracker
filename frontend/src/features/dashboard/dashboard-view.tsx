'use client';

import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { useCurrentUser } from '@/features/auth/use-auth';
import { useUrlState } from '@/hooks/use-url-state';
import { errorMessage } from '@/lib/api';
import type { StatsRange } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RANGE_OPTIONS, useDashboardStats } from './api';
import { StatTiles } from './stat-tiles';

// Recharts is ~100KB gz — split it out of the initial bundle and stream it in after the tiles render.
const DashboardCharts = dynamic(() => import('./dashboard-grid').then((m) => m.DashboardGrid), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
});

const DEFAULTS = { range: '30d' };

function ChartsSkeleton() {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      {[2, 1, 1, 1, 1].map((span, i) => (
        <Card key={i} className={cn('space-y-4 p-5', span === 2 && 'lg:col-span-2')}>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-56 w-full" />
        </Card>
      ))}
    </div>
  );
}

export function DashboardView() {
  const { user } = useCurrentUser();
  const { state, setState } = useUrlState(DEFAULTS);
  const range = (RANGE_OPTIONS.some((r) => r.value === state.range) ? state.range : '30d') as StatsRange;
  const { data, error, isFetching, isPlaceholderData } = useDashboardStats(range);
  const rangeLabel = RANGE_OPTIONS.find((r) => r.value === range)!.long;

  return (
    <>
      <PageHeader
        title={user ? `Hello, ${user.name.split(' ')[0]}` : 'Dashboard'}
        description={`Overview of doctors and patient activity over the ${rangeLabel}.`}
        actions={
          <div role="radiogroup" aria-label="Date range" className="inline-flex rounded-lg border border-line bg-surface p-0.5 shadow-card">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                role="radio"
                aria-checked={range === o.value}
                onClick={() => setState({ range: o.value })}
                className={cn(
                  'h-8 rounded-md px-3 text-[13px] font-medium transition-colors',
                  range === o.value ? 'bg-primary text-primary-fg shadow-card' : 'text-fg-2 hover:text-fg',
                )}
              >
                <span aria-hidden>{o.label}</span>
                <span className="sr-only">{o.long}</span>
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <Card className="p-6 text-sm text-danger" role="alert">
          Could not load dashboard: {errorMessage(error)}
        </Card>
      ) : (
        <div className={cn('transition-opacity', isFetching && isPlaceholderData && 'opacity-60')}>
          <StatTiles stats={data} rangeLabel={rangeLabel} />
          {data ? <DashboardCharts stats={data} /> : <ChartsSkeleton />}
        </div>
      )}
    </>
  );
}

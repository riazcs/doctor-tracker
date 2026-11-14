'use client';

import { formatNumber } from '@/lib/format';
import type { DashboardStats } from '@/lib/types';
import { AgeChart, RankedBars, StatusBreakdown, TrendChart } from './dashboard-charts';

export function DashboardGrid({ stats }: { stats: DashboardStats }) {
  // "Other" is reported in the description rather than as a bar: its long tail would dwarf every real category.
  const conditions = stats.byCondition.filter((c) => c.name !== 'Other');
  const otherConditions = stats.byCondition.find((c) => c.name === 'Other')?.count ?? 0;
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <TrendChart stats={stats} />
      <StatusBreakdown stats={stats} />
      <RankedBars
        title="Patients per doctor"
        description="Top 10 doctors by current caseload"
        valueLabel="Patients"
        className="lg:col-span-2"
        data={stats.topDoctors.map((d) => ({ name: d.name, value: d.patients, href: `/doctors/${d.id}`, sub: d.specialization }))}
      />
      <AgeChart stats={stats} />
      <RankedBars
        title="Top conditions"
        description={otherConditions ? `Admissions in this period · ${formatNumber(otherConditions)} more in other conditions` : 'Admissions in this period'}
        valueLabel="Patients"
        data={conditions.map((x) => ({ name: x.name, value: x.count }))}
      />
      <RankedBars
        title="Caseload by specialization"
        description="All patients, grouped by doctor specialization"
        valueLabel="Patients"
        className="lg:col-span-2"
        data={stats.bySpecialization.map((s) => ({ name: s.name, value: s.patients, sub: `${s.doctors} doctors` }))}
      />
    </div>
  );
}

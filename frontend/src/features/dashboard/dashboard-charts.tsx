'use client';

import Link from 'next/link';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard, LegendItem } from '@/components/charts/chart-card';
import { ChartTooltip } from '@/components/charts/chart-tooltip';
import { useChartPalette, type ChartPalette } from '@/components/charts/palette';
import { STATUS_META } from '@/components/ui/badge';
import { formatNumber, titleCase } from '@/lib/format';
import type { DashboardStats, PatientStatus } from '@/lib/types';

const AXIS = { fontSize: 12, tickLine: false, axisLine: false } as const;

function bucketLabel(iso: string, unit: DashboardStats['unit'], long = false) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (unit === 'month') return d.toLocaleDateString('en', { month: long ? 'long' : 'short', year: long ? 'numeric' : '2-digit', timeZone: 'UTC' });
  const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric', timeZone: 'UTC', ...(long ? { year: 'numeric' } : {}) });
  return unit === 'week' && long ? `Week of ${label}` : label;
}

/* ── Admissions over time ─────────────────────────────────────────────── */

export function TrendChart({ stats }: { stats: DashboardStats }) {
  const c = useChartPalette();
  const total = stats.trend.reduce((s, t) => s + t.patients, 0);
  const critical = stats.trend.reduce((s, t) => s + t.critical, 0);
  return (
    <ChartCard
      title="Admissions over time"
      description={`New patients per ${stats.unit}`}
      className="lg:col-span-2"
      legend={
        <div className="flex flex-wrap gap-4">
          <LegendItem color={c.series1} label="All admissions" value={formatNumber(total)} />
          <LegendItem color={c.critical} label="Critical" value={formatNumber(critical)} />
        </div>
      }
      table={{
        columns: [titleCase(stats.unit), 'Admissions', 'Critical'],
        rows: stats.trend.map((t) => [bucketLabel(t.date, stats.unit, true), t.patients, t.critical]),
      }}
    >
      <div className="h-72">
        <ResponsiveContainer>
          <AreaChart data={stats.trend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="fill-admissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.series1} stopOpacity={0.22} />
                <stop offset="100%" stopColor={c.series1} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis
              dataKey="date"
              {...AXIS}
              tick={{ fill: c.tick }}
              tickFormatter={(v) => bucketLabel(v, stats.unit)}
              minTickGap={24}
              tickMargin={8}
            />
            <YAxis {...AXIS} tick={{ fill: c.tick }} allowDecimals={false} width={44} />
            <Tooltip
              cursor={{ stroke: c.axis, strokeWidth: 1 }}
              content={<ChartTooltip labelFormatter={(l) => bucketLabel(l, stats.unit, true)} />}
            />
            <Area type="monotone" dataKey="patients" name="Admissions" stroke={c.series1} strokeWidth={2} fill="url(#fill-admissions)" activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }} />
            <Area type="monotone" dataKey="critical" name="Critical" stroke={c.critical} strokeWidth={2} fill="none" activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/* ── Status breakdown (segmented bar + labelled rows) ─────────────────── */

const STATUS_ORDER: PatientStatus[] = ['stable', 'under_observation', 'critical', 'recovered'];
const statusColor = (s: PatientStatus, c: ChartPalette) =>
  ({ stable: c.series1, under_observation: c.warning, critical: c.critical, recovered: c.good })[s];

export function StatusBreakdown({ stats }: { stats: DashboardStats }) {
  const c = useChartPalette();
  const counts = new Map(stats.byStatus.map((s) => [s.name, s.count]));
  const total = stats.byStatus.reduce((s, x) => s + x.count, 0) || 1;
  const rows = STATUS_ORDER.map((s) => ({ status: s, count: counts.get(s) ?? 0, pct: ((counts.get(s) ?? 0) / total) * 100 }));
  return (
    <ChartCard
      title="Patient status"
      description="Admissions in this period"
      table={{ columns: ['Status', 'Patients', 'Share'], rows: rows.map((r) => [STATUS_META[r.status].label, r.count, `${r.pct.toFixed(1)}%`]) }}
    >
      <div className="px-2">
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={rows.map((r) => `${STATUS_META[r.status].label} ${r.pct.toFixed(0)}%`).join(', ')}>
          {rows.filter((r) => r.count > 0).map((r) => (
            <div key={r.status} style={{ width: `${r.pct}%`, background: statusColor(r.status, c) }} title={`${STATUS_META[r.status].label}: ${r.count}`} />
          ))}
        </div>
        <ul className="mt-5 space-y-3">
          {rows.map((r) => {
            const Icon = STATUS_META[r.status].icon;
            return (
              <li key={r.status} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-fg-2">
                  <span className="size-2.5 rounded-sm" style={{ background: statusColor(r.status, c) }} aria-hidden />
                  <Icon className="size-4 text-muted" aria-hidden />
                  {STATUS_META[r.status].label}
                </span>
                <span className="tabular-nums">
                  <span className="font-semibold">{formatNumber(r.count)}</span>
                  <span className="ml-2 inline-block w-12 text-right text-muted">{r.pct.toFixed(1)}%</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </ChartCard>
  );
}

/* ── Horizontal ranked bars (patients per doctor / condition / specialization) ── */

interface RankedBarsProps {
  title: string;
  description: string;
  data: { name: string; value: number; href?: string; sub?: string }[];
  valueLabel: string;
  className?: string;
}

export function RankedBars({ title, description, data, valueLabel, className }: RankedBarsProps) {
  const c = useChartPalette();
  const height = Math.max(160, data.length * 34 + 16);
  return (
    <ChartCard
      title={title}
      description={description}
      className={className}
      table={{ columns: ['Name', valueLabel], rows: data.map((d) => [d.sub ? `${d.name} (${d.sub})` : d.name, d.value]) }}
    >
      <div style={{ height }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }} barCategoryGap={8}>
            <XAxis type="number" hide domain={[0, 'dataMax']} />
            <YAxis
              type="category"
              dataKey="name"
              {...AXIS}
              width={150}
              tick={({ x, y, payload, index }) => {
                const item = data[index];
                const label = String(payload.value);
                const short = label.length > 22 ? `${label.slice(0, 21)}…` : label;
                const text = (
                  <text x={Number(x) - 8} y={Number(y)} dy={4} textAnchor="end" fontSize={12.5} fill={c.tick} className={item?.href ? 'hover:underline' : undefined}>
                    <title>{label}</title>
                    {short}
                  </text>
                );
                return item?.href ? <Link href={item.href}>{text}</Link> : text;
              }}
            />
            <Tooltip cursor={{ fill: c.cursor }} content={<ChartTooltip />} />
            <Bar
              dataKey="value"
              name={valueLabel}
              fill={c.series1}
              radius={[0, 4, 4, 0]}
              maxBarSize={20}
              label={{ position: 'right', fontSize: 12, fill: c.tick, formatter: (v: unknown) => formatNumber(Number(v)) }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

/* ── Age distribution (columns) + gender split ───────────────────────── */

export function AgeChart({ stats }: { stats: DashboardStats }) {
  const c = useChartPalette();
  const genderTotal = stats.byGender.reduce((s, g) => s + g.count, 0) || 1;
  return (
    <ChartCard
      title="Age groups"
      description="Admissions in this period"
      table={{
        columns: ['Group', 'Patients'],
        rows: [...stats.byAge.map((a) => [a.name, a.count]), ...stats.byGender.map((g) => [titleCase(g.name), g.count])],
      }}
    >
      <div className="h-52">
        <ResponsiveContainer>
          <BarChart data={stats.byAge} margin={{ top: 20, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="name" {...AXIS} tick={{ fill: c.tick }} tickMargin={6} />
            <YAxis hide />
            <Tooltip cursor={{ fill: c.cursor }} content={<ChartTooltip />} />
            <Bar dataKey="count" name="Patients" fill={c.series1} radius={[4, 4, 0, 0]} maxBarSize={44}>
              {stats.byAge.map((a) => (
                <Cell key={a.name} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line px-2 pt-4 text-center">
        {(['female', 'male', 'other'] as const).map((g) => {
          const count = stats.byGender.find((x) => x.name === g)?.count ?? 0;
          return (
            <div key={g}>
              <dt className="text-xs text-muted">{titleCase(g)}</dt>
              <dd className="text-sm font-semibold tabular-nums">{Math.round((count / genderTotal) * 100)}%</dd>
            </div>
          );
        })}
      </dl>
    </ChartCard>
  );
}

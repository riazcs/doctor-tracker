import { Activity, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PatientStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const tones = {
  neutral: 'bg-surface-2 text-fg-2 border-line',
  primary: 'bg-primary-soft text-primary-soft-fg border-transparent',
  success: 'bg-success-soft text-success border-transparent',
  warning: 'bg-warning-soft text-warning border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: keyof typeof tones; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5', tones[tone], className)}>
      {children}
    </span>
  );
}

/** Status is never color-alone: each state carries an icon + label. */
export const STATUS_META: Record<PatientStatus, { label: string; tone: keyof typeof tones; icon: typeof Activity }> = {
  stable: { label: 'Stable', tone: 'primary', icon: Activity },
  under_observation: { label: 'Observation', tone: 'warning', icon: Eye },
  critical: { label: 'Critical', tone: 'danger', icon: AlertTriangle },
  recovered: { label: 'Recovered', tone: 'success', icon: CheckCircle2 },
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone}>
      <Icon aria-hidden />
      {meta.label}
    </Badge>
  );
}

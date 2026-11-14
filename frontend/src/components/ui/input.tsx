import { ChevronDown } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const controlClass =
  'w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-muted shadow-card transition-[border-color,box-shadow] ' +
  'hover:border-line-strong focus:border-primary focus:outline-none focus:ring-4 focus:ring-[var(--ring)] ' +
  'disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(controlClass, 'h-10', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(controlClass, 'min-h-20 py-2 leading-relaxed', className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className={cn('relative', className)}>
      <select className={cn(controlClass, 'h-10 appearance-none pr-9')} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
}

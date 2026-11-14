import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

const HUES = [214, 18, 158, 38, 334, 120, 250, 0];

function hueFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return HUES[h % HUES.length];
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const hue = hueFor(name);
  return (
    <span
      aria-hidden
      style={{ ['--h' as string]: hue }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        'bg-[hsl(var(--h)_70%_93%)] text-[hsl(var(--h)_55%_32%)] dark:bg-[hsl(var(--h)_35%_22%)] dark:text-[hsl(var(--h)_70%_80%)]',
        size === 'sm' && 'size-8 text-xs',
        size === 'md' && 'size-9 text-[13px]',
        size === 'lg' && 'size-14 text-lg',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

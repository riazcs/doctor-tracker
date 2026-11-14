const dateFmt = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });
const numberFmt = new Intl.NumberFormat('en');
const compactFmt = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export const formatDate = (iso?: string | null) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const formatNumber = (n: number) => numberFmt.format(n);
export const formatCompact = (n: number) => compactFmt.format(n);

/** YYYY-MM-DD for <input type="date"> */
export const toDateInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
export const todayInput = () => new Date().toISOString().slice(0, 10);

export const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

export const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

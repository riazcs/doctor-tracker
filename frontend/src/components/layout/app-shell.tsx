'use client';

import { HeartPulse, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser, useLogout } from '@/features/auth/use-auth';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav';
import { useTheme } from './theme-provider';

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-fg">
        <HeartPulse className="size-[18px]" aria-hidden />
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Doctor Tracker</span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary-soft text-primary-soft-fg' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
            )}
          >
            <Icon className="size-[18px]" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard() {
  const { user, isLoading } = useCurrentUser();
  const logout = useLogout();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
      {isLoading || !user ? (
        <>
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </>
      ) : (
        <>
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <Badge tone={user.role === 'admin' ? 'primary' : 'neutral'} className="mt-0.5 capitalize">
              {user.role}
            </Badge>
          </div>
        </>
      )}
      <Button variant="ghost" size="icon-sm" onClick={() => logout.mutate()} loading={logout.isPending} aria-label="Sign out" title="Sign out">
        {!logout.isPending && <LogOut />}
      </Button>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change and lock body scroll while it is open.
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setDrawerOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-bg px-4 py-5 lg:flex">
        <div className="flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </div>
        <NavLinks />
        <div className="mt-auto">
          <UserCard />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur-md lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} aria-label="Open navigation" aria-expanded={drawerOpen}>
          <Menu />
        </Button>
        <Brand />
        <ThemeToggle />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-pop-in flex-col gap-6 bg-bg px-4 py-5 shadow-pop">
            <div className="flex items-center justify-between">
              <Brand />
              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" autoFocus>
                <X />
              </Button>
            </div>
            <NavLinks onNavigate={() => setDrawerOpen(false)} />
            <div className="mt-auto">
              <UserCard />
            </div>
          </div>
        </div>
      )}

      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-[1400px]">
          {user?.sample && (
            <div role="status" className="mb-6 rounded-xl border border-line bg-primary-soft p-4 text-sm text-primary-soft-fg">
              <strong>Sample preview · Read-only.</strong> All doctors, patients, and analytics are fictional. Changes are disabled until a backend is connected.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

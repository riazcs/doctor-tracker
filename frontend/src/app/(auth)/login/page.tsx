import type { Metadata } from 'next';
import { HeartPulse, LineChart, ShieldCheck, Stethoscope } from 'lucide-react';
import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = { title: 'Sign in' };

const HIGHLIGHTS = [
  { icon: Stethoscope, title: 'Doctors & patients', text: 'One place for every doctor and the patients under their care.' },
  { icon: LineChart, title: 'Live analytics', text: 'Admissions, conditions and workload at a glance.' },
  { icon: ShieldCheck, title: 'Secure by default', text: 'httpOnly sessions and role-based access for every action.' },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#0d366b] p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden className="absolute -top-40 -right-32 size-[520px] rounded-full bg-[#2a78d6] opacity-40 blur-3xl" />
        <div aria-hidden className="absolute -bottom-48 -left-24 size-[420px] rounded-full bg-[#1baf7a] opacity-25 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
            <HeartPulse className="size-5" aria-hidden />
          </span>
          <span className="text-lg font-semibold">Doctor Tracker</span>
        </div>
        <div className="relative mt-auto max-w-md">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">Care coordination, without the spreadsheets.</h1>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-white/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-12 text-xs text-white/50">© {new Date().getFullYear()} Doctor Tracker</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-fg">
              <HeartPulse className="size-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold">Doctor Tracker</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1 text-sm text-muted">Sign in to the admin portal to continue.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

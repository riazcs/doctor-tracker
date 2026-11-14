'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, fieldA11y } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { errorMessage } from '@/lib/api';
import { loginSchema, type LoginValues } from '@/lib/validators';
import { useLogin } from './use-auth';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@doctortracker.dev', password: 'Admin@123' },
  { label: 'Viewer (read-only)', email: 'viewer@doctortracker.dev', password: 'Viewer@123' },
];

/** Only allow same-site relative redirects (prevents open-redirect via ?next=). */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => router.replace(safeNext(params.get('next'))) }),
  );

  const expired = params.get('expired') === '1' && !login.isError;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
      {(login.isError || expired) && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {login.isError ? errorMessage(login.error) : 'Your session has expired. Please sign in again.'}
        </div>
      )}

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input {...fieldA11y('email', errors.email?.message)} type="email" autoComplete="email" placeholder="you@hospital.com" autoFocus {...register('email')} />
      </Field>

      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <div className="relative">
          <Input
            {...fieldA11y('password', errors.password?.message)}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pr-10"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted hover:text-fg"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <Button type="submit" className="w-full" loading={login.isPending}>
        Sign in
      </Button>

      <div className="rounded-xl border border-dashed border-line-strong p-4">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Demo accounts</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <Button
              key={acc.email}
              variant="secondary"
              size="sm"
              onClick={() => {
                setValue('email', acc.email, { shouldValidate: true });
                setValue('password', acc.password, { shouldValidate: true });
              }}
            >
              {acc.label}
            </Button>
          ))}
        </div>
      </div>
    </form>
  );
}

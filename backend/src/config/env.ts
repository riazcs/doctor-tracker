import { z } from 'zod';

try {
  process.loadEnvFile();
} catch {
  // No .env file — rely on the real environment (e.g. in production containers).
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = schema.safeParse(process.env);

/** Problems with the environment, e.g. "JWT_SECRET: …". Names and rules only, never values. */
export const configErrors = parsed.success
  ? []
  : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);

if (configErrors.length) {
  console.error('Invalid environment configuration:');
  for (const e of configErrors) console.error(`  - ${e}`);
  // A long-running server should refuse to start. On Vercel, exiting only produces an opaque
  // FUNCTION_INVOCATION_FAILED page, so keep running and let app.ts report the problem instead.
  if (!process.env.VERCEL) process.exit(1);
}

// When config is invalid (Vercel only), app.ts rejects every request before any of these are used.
const data = (parsed.success ? parsed.data : schema.partial().parse({})) as z.infer<typeof schema>;

export const env = {
  ...data,
  isProd: process.env.NODE_ENV === 'production',
  corsOrigins: (data.CORS_ORIGIN ?? '').split(',').map((o) => o.trim()).filter(Boolean),
  cookieName: 'dt_session',
};

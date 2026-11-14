import type { NextConfig } from 'next';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: import.meta.dirname, // pin the workspace root (avoids picking up stray lockfiles in parent dirs)
    rules: {
      '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' },
    },
  },
  poweredByHeader: false,
  /**
   * The browser only ever talks to this origin. `/api/*` is forwarded to the standalone
   * Express server, which keeps the session cookie first-party (no CORS / third-party
   * cookie issues in production) and hides the backend URL from the client.
   */
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;

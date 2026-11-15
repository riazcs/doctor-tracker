import { backendUrl } from '@/lib/backend-config';
import { sampleResponse } from '@/lib/sample-api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const hopByHop = [
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
];

function cleanHeaders(headers: Headers) {
  for (const name of (headers.get('connection') ?? '').split(',')) {
    if (name.trim()) headers.delete(name.trim());
  }
  for (const name of hopByHop) headers.delete(name);
}

async function proxy(request: Request) {
  const incoming = new URL(request.url);
  const target = backendUrl(request.url);
  if (!target) return sampleResponse(request);
  // Accept either the backend origin or a URL already ending in /api.
  const basePath = target.pathname.replace(/\/+$/, '').replace(/\/api$/, '');
  target.pathname = `${basePath}${incoming.pathname}`;
  target.search = incoming.search;
  target.hash = '';

  try {
    const headers = new Headers(request.headers);
    cleanHeaders(headers);
    headers.delete('host');
    headers.delete('content-length');
    headers.set('accept-encoding', 'identity');
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(25_000),
    });
    const responseHeaders = new Headers(upstream.headers);
    cleanHeaders(responseHeaders);
    // Fetch decodes compressed responses; the original encoding/length no longer apply.
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('set-cookie');
    for (const cookie of upstream.headers.getSetCookie()) {
      responseHeaders.append('set-cookie', cookie.replace(/;\s*Domain=[^;]*/gi, ''));
    }
    responseHeaders.set('cache-control', 'no-store');
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json({ error: {
      code: 'BACKEND_UNAVAILABLE',
      message: 'Cannot reach the backend. Please try again shortly.',
    } }, { status: 502 });
  }
}

export {
  proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH,
  proxy as DELETE, proxy as HEAD, proxy as OPTIONS,
};

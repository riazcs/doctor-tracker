/** A missing or invalid backend enables the read-only sample preview. */
export function backendUrl(frontendUrl?: string): URL | null {
  try {
    const value = process.env.BACKEND_URL?.trim();
    if (!value) return null;
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (frontendUrl && url.origin === new URL(frontendUrl).origin) return null;
    return url;
  } catch {
    return null;
  }
}

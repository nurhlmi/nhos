import "server-only";

type Entry<T> = { value: T; storedAt: number; expiresAt: number };

/**
 * Small in-process TTL cache for third-party API responses. Lives on
 * globalThis so it survives hot reloads in development. On serverless hosts it
 * is per-instance, which is fine: it only reduces upstream calls.
 */
const store: Map<string, Entry<unknown>> =
  ((globalThis as { __nhosCache?: Map<string, Entry<unknown>> }).__nhosCache ??= new Map());

const MAX_ENTRIES = 500;

export type CachedResult<T> = { value: T; cached: boolean; fetchedAt: string };

/** Dedupes concurrent loads for the same key. */
const inflight = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<CachedResult<T>> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now) {
    return { value: hit.value, cached: true, fetchedAt: new Date(hit.storedAt).toISOString() };
  }

  let pending = inflight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = loader().finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  const value = await pending;

  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  const storedAt = Date.now();
  store.set(key, { value, storedAt, expiresAt: storedAt + ttlMs });
  return { value, cached: false, fetchedAt: new Date(storedAt).toISOString() };
}

/** Returns a stale entry (if any) so callers can degrade gracefully when upstream fails. */
export function getStale<T>(key: string): CachedResult<T> | null {
  const hit = store.get(key) as Entry<T> | undefined;
  if (!hit) return null;
  return { value: hit.value, cached: true, fetchedAt: new Date(hit.storedAt).toISOString() };
}

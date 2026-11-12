export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

type ErrorBody = { error?: string };

/** Client-side JSON fetch against nhOS route handlers. */
export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as ErrorBody;
      if (body.error) message = body.error;
    } catch {
      // non-JSON error body
    }
    const retryAfter = Number(res.headers.get("retry-after"));
    throw new HttpError(message, res.status, Number.isFinite(retryAfter) ? retryAfter : undefined);
  }
  return (await res.json()) as T;
}

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  /** Status codes considered transient. */
  retryOn?: number[];
  timeoutMs?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Server-side fetch to third-party APIs with timeout and bounded retries on
 * transient failures (network errors, 429, 5xx). Honours Retry-After.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {},
  { retries = 2, baseDelayMs = 800, retryOn = [408, 429, 500, 502, 503, 504], timeoutMs = 15_000 }: RetryOptions = {},
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if (!retryOn.includes(res.status) || attempt === retries) return res;
      const retryAfter = Number(res.headers.get("retry-after"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 10_000)
        : baseDelayMs * 2 ** attempt;
      await sleep(delay);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

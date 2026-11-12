import "server-only";

export class RateLimitError extends Error {
  constructor(message: string, public readonly retryAfterSeconds: number) {
    super(message);
    this.name = "RateLimitError";
  }
}

type Limiter = { timestamps: number[]; max: number; windowMs: number };

const limiters: Map<string, Limiter> =
  ((globalThis as { __nhosLimiters?: Map<string, Limiter> }).__nhosLimiters ??= new Map());

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Sliding-window limiter for outbound calls to a third-party API. Waits for a
 * free slot up to `maxWaitMs`; otherwise throws RateLimitError so the client
 * can back off instead of us getting blocked upstream.
 */
export async function acquireSlot(name: string, max: number, windowMs: number, maxWaitMs = 8000): Promise<void> {
  let limiter = limiters.get(name);
  if (!limiter || limiter.max !== max) {
    limiter = { timestamps: [], max, windowMs };
    limiters.set(name, limiter);
  }

  const deadline = Date.now() + maxWaitMs;
  for (;;) {
    const now = Date.now();
    limiter.timestamps = limiter.timestamps.filter((t) => now - t < windowMs);
    if (limiter.timestamps.length < max) {
      limiter.timestamps.push(now);
      return;
    }
    const waitMs = windowMs - (now - limiter.timestamps[0]!) + 50;
    if (now + waitMs > deadline) {
      throw new RateLimitError(
        "Upstream rate limit reached. Try again shortly.",
        Math.ceil(waitMs / 1000),
      );
    }
    await sleep(waitMs);
  }
}

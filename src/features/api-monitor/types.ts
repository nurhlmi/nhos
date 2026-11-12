/**
 * - up: the endpoint answered with 2xx/3xx
 * - error: reachable, but answered 4xx (auth, rate limit, bad request)
 * - down: timeout, network failure or 5xx
 * - unconfigured: a required API key is missing, so no request was sent
 */
export type ApiStatus = "up" | "error" | "down" | "unconfigured";

export type ApiCheck = {
  id: string;
  name: string;
  /** nhOS module that depends on this API. */
  feature: string;
  url: string;
  /** Whether nhOS sends an API key or token to this API. */
  usesApiKey: boolean;
  /** Key requirement and whether it is set in the environment. */
  key: { required: boolean; configured: boolean } | null;
  status: ApiStatus;
  httpStatus: number | null;
  latencyMs: number | null;
  message: string | null;
};

export type ApiMonitorReport = {
  checks: ApiCheck[];
  checkedAt: string;
  cached: boolean;
};

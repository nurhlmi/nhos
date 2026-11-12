/**
 * Freshness of external data shown in the UI:
 * - live: fetched from the upstream source for this request
 * - cached: served from nhOS's server cache (still within its TTL)
 * - stale: upstream failed, last known good copy served
 */
export type DataFreshness = "live" | "cached" | "stale";

export type SourceMeta = {
  source: string;
  sourceUrl: string;
  /** When nhOS fetched the data from the source. */
  fetchedAt: string;
  /** When the source itself last published/updated the data, if known. */
  sourceUpdatedAt?: string | null;
  freshness: DataFreshness;
  note?: string;
};

export type ApiResponse<T> = { data: T; meta: SourceMeta };

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

import "server-only";

/** Server-only configuration. Never import this from a client component. */
export const serverEnv = {
  /** Optional NVD API key, raises the rate limit from 5 to 50 requests / 30s. */
  nvdApiKey: process.env.NVD_API_KEY || undefined,
  /** TMDB API Read Access Token (v4, sent as Bearer). Preferred over the v3 key. */
  tmdbReadToken: process.env.TMDB_API_READ_TOKEN || undefined,
  /** TMDB v3 API key, used only when no read token is set. */
  tmdbApiKey: process.env.TMDB_API_KEY || undefined,
};
